
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "joinallgc",
  version: "1.0.0",
  hasPermssion: 2,
  usePrefix: true,
  credits: "TOHI-BOT-HUB",
  description: "Auto rejoin all approved groups after account ban",
  commandCategory: "Admin",
  usages: "/joinallgc [backup|restore|show]",
  cooldowns: 10
};

const OWNER_ID = "100092006324917";

module.exports.run = async function ({ api, event, args }) {
  if (event.senderID !== OWNER_ID) {
    return api.sendMessage(`⛔️ শুধুমাত্র owner (${OWNER_ID}) এই কমান্ড ব্যবহার করতে পারবেন!`, event.threadID, event.messageID);
  }

  const { threadID, messageID } = event;
  const groupDataPath = path.join(__dirname, '../../utils/groupdata.json');
  const { configPath } = global.client;
  
  // Load config and groupdata
  delete require.cache[require.resolve(configPath)];
  var config = require(configPath);
  
  let groupData = {};
  try {
    if (fs.existsSync(groupDataPath)) {
      groupData = JSON.parse(fs.readFileSync(groupDataPath, 'utf8'));
    } else {
      groupData = {
        approvedGroups: [],
        lastUpdated: "",
        totalGroups: 0,
        backupNote: "This file stores approved group data for rejoin feature"
      };
    }
  } catch (error) {
    groupData = {
      approvedGroups: [],
      lastUpdated: "",
      totalGroups: 0,
      backupNote: "This file stores approved group data for rejoin feature"
    };
  }

  const command = (args[0] || "").toLowerCase();

  try {
    switch (command) {
      case "backup": {
        // Backup current approved groups
        if (!config.APPROVAL || !config.APPROVAL.approvedGroups || config.APPROVAL.approvedGroups.length === 0) {
          return api.sendMessage("📝 কোনো approved গ্রুপ নেই backup করার জন্য!", threadID, messageID);
        }

        const currentTime = new Date().toLocaleString("bn-BD", {
          timeZone: "Asia/Dhaka"
        });

        // Create detailed backup
        const backupData = {
          approvedGroups: [],
          lastUpdated: currentTime,
          totalGroups: config.APPROVAL.approvedGroups.length,
          backupNote: "Backup created for rejoin feature"
        };

        // Get group details
        for (const groupId of config.APPROVAL.approvedGroups) {
          try {
            const info = await api.getThreadInfo(groupId);
            backupData.approvedGroups.push({
              threadID: groupId,
              threadName: info.threadName || "Unknown Group",
              memberCount: info.participantIDs.length,
              backupDate: currentTime,
              status: "backed_up"
            });
          } catch (error) {
            // If can't get info, still backup the ID
            backupData.approvedGroups.push({
              threadID: groupId,
              threadName: "Group Info Unavailable",
              memberCount: 0,
              backupDate: currentTime,
              status: "info_unavailable"
            });
          }
        }

        // Save backup
        fs.writeFileSync(groupDataPath, JSON.stringify(backupData, null, 2), 'utf8');

        const successMsg = `✅ BACKUP সম্পূর্ণ হয়েছে!

📊 Backup Details:
🔸 মোট গ্রুপ: ${backupData.totalGroups}টি
🕒 Backup সময়: ${currentTime}
📁 সংরক্ষিত: utils/groupdata.json

💡 এখন account ban হলে /joinallgc restore দিয়ে সব গ্রুপে rejoin করতে পারবেন!`;

        return api.sendMessage(successMsg, threadID, messageID);
      }

      case "restore": {
        // Auto rejoin to backed up groups
        if (!groupData.approvedGroups || groupData.approvedGroups.length === 0) {
          return api.sendMessage("❌ কোনো backup ডাটা নেই! প্রথমে /joinallgc backup করুন।", threadID, messageID);
        }

        api.sendMessage(`🔄 Auto Rejoin শুরু হচ্ছে...
        
📊 মোট গ্রুপ: ${groupData.approvedGroups.length}টি
⏳ অনুগ্রহ করে অপেক্ষা করুন...`, threadID);

        let successCount = 0;
        let failCount = 0;
        let results = [];

        for (let i = 0; i < groupData.approvedGroups.length; i++) {
          const group = groupData.approvedGroups[i];
          
          try {
            // Get current user ID
            const botUserID = api.getCurrentUserID();
            
            // Check if bot is already in group
            try {
              const threadInfo = await api.getThreadInfo(group.threadID);
              const isAlreadyMember = threadInfo.participantIDs.includes(botUserID);
              
              if (isAlreadyMember) {
                results.push(`✅ ${group.threadName} - Already member`);
                successCount++;
                continue;
              }
            } catch (checkError) {
              // Group might not exist or bot doesn't have access
              results.push(`❌ ${group.threadName} - Can't access group`);
              failCount++;
              continue;
            }

            // Try to rejoin (this requires group invitation or public group)
            // Note: Auto-joining requires the group to be public or bot to be invited
            results.push(`⏳ ${group.threadName} - Rejoin attempt (manual invitation may be needed)`);
            
            // Add delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (error) {
            results.push(`❌ ${group.threadName} - Rejoin failed`);
            failCount++;
          }
        }

        // Update config with groups that bot is now in
        if (!config.APPROVAL) {
          config.APPROVAL = { approvedGroups: [], pendingGroups: [], rejectedGroups: [] };
        }

        // Re-approve groups that bot successfully joined
        const currentApproved = new Set(config.APPROVAL.approvedGroups.map(id => String(id)));
        
        for (const group of groupData.approvedGroups) {
          try {
            const threadInfo = await api.getThreadInfo(group.threadID);
            const botUserID = api.getCurrentUserID();
            
            if (threadInfo.participantIDs.includes(botUserID)) {
              if (!currentApproved.has(String(group.threadID))) {
                config.APPROVAL.approvedGroups.push(String(group.threadID));
                successCount++;
              }
            }
          } catch (error) {
            // Group not accessible
          }
        }

        // Save updated config
        const { writeFileSync } = require('fs-extra');
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

        const reportMsg = `🎯 AUTO REJOIN সম্পূর্ণ!

📊 Report:
✅ সফল: ${successCount}টি গ্রুপ
❌ ব্যর্থ: ${failCount}টি গ্রুপ

💡 Note: Facebook bot auto-join করতে পারে না। গ্রুপে manually invite করা লাগবে। তবে invite পাওয়ার পর bot automatically approve হয়ে যাবে।

🔍 /joinallgc show দিয়ে backup list দেখুন।`;

        return api.sendMessage(reportMsg, threadID, messageID);
      }

      case "show": {
        // Show backed up groups
        if (!groupData.approvedGroups || groupData.approvedGroups.length === 0) {
          return api.sendMessage("📝 কোনো backup ডাটা নেই!", threadID, messageID);
        }

        let msg = `📋 BACKUP GROUP LIST:

📊 মোট backup: ${groupData.totalGroups}টি গ্রুপ
🕒 Last backup: ${groupData.lastUpdated}

┌─── GROUP DETAILS ───┐\n`;

        for (let i = 0; i < Math.min(groupData.approvedGroups.length, 10); i++) {
          const group = groupData.approvedGroups[i];
          msg += `${i + 1}. ${group.threadName}\n`;
          msg += `   🆔 ${group.threadID}\n`;
          msg += `   👥 ${group.memberCount} members\n`;
          msg += `   📅 ${group.backupDate}\n\n`;
        }

        if (groupData.approvedGroups.length > 10) {
          msg += `... এবং আরও ${groupData.approvedGroups.length - 10}টি গ্রুপ\n\n`;
        }

        msg += `└─────────────────────────┘

💡 Commands:
🔸 /joinallgc backup - নতুন backup তৈরি
🔸 /joinallgc restore - সব গ্রুপে rejoin
🔸 /joinallgc show - এই list`;

        return api.sendMessage(msg, threadID, messageID);
      }

      default: {
        const helpMsg = `📋 JOINALLGC COMMAND HELP:

🔸 /joinallgc backup — বর্তমান approved গ্রুপগুলো backup করুন
🔸 /joinallgc restore — backup থেকে সব গ্রুপে rejoin করুন  
🔸 /joinallgc show — backup list দেখুন
🔸 /joinallgc help — এই help মেসেজ

🎯 কিভাবে কাজ করে:
1️⃣ প্রথমে /joinallgc backup দিন
2️⃣ Account ban হলে নতুন account দিয়ে bot চালান
3️⃣ /joinallgc restore দিন
4️⃣ গ্রুপগুলোতে manually invite নিন
5️⃣ Bot automatically approve হয়ে যাবে!

⚠️ Note: Facebook auto-join allow করে না। Group invite প্রয়োজন।`;

        return api.sendMessage(helpMsg, threadID, messageID);
      }
    }
  } catch (error) {
    console.error("Joinallgc command error:", error);
    return api.sendMessage("❌ কিছু ভুল হয়েছে! আবার চেষ্টা করুন।", threadID, messageID);
  }
};
