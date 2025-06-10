
module.exports.config = {
  name: "approve",
  version: "6.0.0",
  permission: 2,
  usePrefix: true,
  credits: "TOHIDUL (Easy Bangla Edition)",
  description: "Owner approval system — approved ছাড়া কোনো গ্রুপে বট কাজ করবে না।",
  commandCategory: "Admin",
  usages: "/approve [list|pending|help]",
  cooldowns: 5
};

const OWNER_ID = "100092006324917";

module.exports.run = async function ({ api, event, args }) {
  const logger = require("../../utils/log.js");
  if (event.senderID !== OWNER_ID) {
    return api.sendMessage(`⛔️ কেবল owner (${OWNER_ID}) approval দিতে পারবেন!`, event.threadID, event.messageID);
  }

  const { threadID, messageID } = event;
  const { configPath } = global.client;
  const { writeFileSync } = global.nodemodule["fs-extra"];
  
  // Load config
  delete require.cache[require.resolve(configPath)];
  var config = require(configPath);

  // Initialize APPROVAL system
  if (!config.APPROVAL) {
    config.APPROVAL = { 
      approvedGroups: [], 
      pendingGroups: [], 
      rejectedGroups: [] 
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  }

  const command = (args[0] || "").toLowerCase();

  try {
    switch (command) {
      case "help": {
        const helpMsg = `📋 APPROVE COMMAND HELP:

🔸 /approve — বর্তমান গ্রুপ approve করুন
🔸 /approve list — সব approved গ্রুপের লিস্ট
🔸 /approve pending — pending গ্রুপের লিস্ট
🔸 /approve help — এই help মেসেজ

💡 Note: শুধু owner এই কমান্ড ব্যবহার করতে পারবেন।`;
        return api.sendMessage(helpMsg, threadID, messageID);
      }

      case "list": {
        const { approvedGroups = [] } = config.APPROVAL;
        
        if (approvedGroups.length === 0) {
          return api.sendMessage("📝 কোনো approved গ্রুপ নেই!", threadID, messageID);
        }

        let msg = `✅ APPROVED GROUPS (${approvedGroups.length}):\n\n`;
        
        for (let i = 0; i < Math.min(approvedGroups.length, 15); i++) {
          try {
            const info = await api.getThreadInfo(approvedGroups[i]);
            msg += `${i + 1}. ${info.threadName}\n`;
            msg += `   🆔 ${approvedGroups[i]}\n`;
            msg += `   👥 ${info.participantIDs.length} members\n\n`;
          } catch {
            msg += `${i + 1}. [তথ্য পাওয়া যায়নি]\n`;
            msg += `   🆔 ${approvedGroups[i]}\n\n`;
          }
        }
        
        if (approvedGroups.length > 15) {
          msg += `... এবং আরও ${approvedGroups.length - 15}টি গ্রুপ`;
        }
        
        return api.sendMessage(msg, threadID, messageID);
      }

      case "pending": {
        const { pendingGroups = [] } = config.APPROVAL;
        
        if (pendingGroups.length === 0) {
          return api.sendMessage("⏳ কোনো pending গ্রুপ নেই!", threadID, messageID);
        }

        let msg = `⏳ PENDING GROUPS (${pendingGroups.length}):\n\n`;
        
        for (let i = 0; i < Math.min(pendingGroups.length, 10); i++) {
          try {
            const info = await api.getThreadInfo(pendingGroups[i]);
            msg += `${i + 1}. ${info.threadName}\n`;
            msg += `   🆔 ${pendingGroups[i]}\n`;
            msg += `   👥 ${info.participantIDs.length} members\n\n`;
          } catch {
            msg += `${i + 1}. [তথ্য পাওয়া যায়নি]\n`;
            msg += `   🆔 ${pendingGroups[i]}\n\n`;
          }
        }
        
        msg += `💡 Approve করতে: /approve\n`;
        msg += `❌ Reject করতে: bot কে গ্রুপ থেকে remove করুন`;
        
        return api.sendMessage(msg, threadID, messageID);
      }

      default: {
        // Approve current group
        const targetID = String(threadID);
        
        // Clean and normalize arrays
        config.APPROVAL.approvedGroups = [...new Set((config.APPROVAL.approvedGroups || []).map(id => String(id)))];
        config.APPROVAL.pendingGroups = [...new Set((config.APPROVAL.pendingGroups || []).map(id => String(id)))];
        config.APPROVAL.rejectedGroups = [...new Set((config.APPROVAL.rejectedGroups || []).map(id => String(id)))];
        
        // Check if already approved
        if (config.APPROVAL.approvedGroups.includes(targetID)) {
          return api.sendMessage("✅ এই গ্রুপ ইতিমধ্যে চালু আছে!", threadID, messageID);
        }
        
        // Add to approved list
        config.APPROVAL.approvedGroups.push(targetID);
        
        // Remove from other lists
        config.APPROVAL.pendingGroups = config.APPROVAL.pendingGroups.filter(id => String(id) !== targetID);
        config.APPROVAL.rejectedGroups = config.APPROVAL.rejectedGroups.filter(id => String(id) !== targetID);
        
        // Save config
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        
        // Create user data for all group members
        try {
          const Users = require('../../includes/database/users')({ api });
          const threadInfo = await api.getThreadInfo(targetID);
          
          logger.log(`Creating user data for ${threadInfo.participantIDs.length} members in approved group ${targetID}`, 'DATABASE');
          
          for (const memberID of threadInfo.participantIDs) {
            try {
              if (!global.data.allUserID.includes(memberID)) {
                global.data.allUserID.push(memberID);
                await Users.createData(memberID);
                logger.log(`User data created for member ${memberID}`, 'DATABASE');
              }
            } catch (memberError) {
              logger.log(`Warning: Could not create data for member ${memberID}: ${memberError.message}`, 'WARN');
            }
            
            // Add small delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          logger.log(`Error creating member data: ${error.message}`, 'ERROR');
        }
        
        // Auto backup to groupdata.json
        try {
          const path = require('path');
          const groupDataPath = path.join(__dirname, '../../utils/groupdata.json');
          
          let groupData = {};
          if (require('fs-extra').existsSync(groupDataPath)) {
            groupData = JSON.parse(require('fs-extra').readFileSync(groupDataPath, 'utf8'));
          } else {
            groupData = { approvedGroups: [], lastUpdated: "", totalGroups: 0 };
          }
          
          // Update backup with current approved groups
          const currentTime = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
          groupData.approvedGroups = [];
          groupData.lastUpdated = currentTime;
          groupData.totalGroups = config.APPROVAL.approvedGroups.length;
          
          for (const gId of config.APPROVAL.approvedGroups) {
            try {
              const gInfo = await api.getThreadInfo(gId);
              groupData.approvedGroups.push({
                threadID: gId,
                threadName: gInfo.threadName || "Unknown Group",
                memberCount: gInfo.participantIDs.length,
                backupDate: currentTime,
                status: "auto_backed_up"
              });
            } catch (e) {
              groupData.approvedGroups.push({
                threadID: gId,
                threadName: "Group Info Unavailable",
                memberCount: 0,
                backupDate: currentTime,
                status: "auto_backed_up"
              });
            }
          }
          
          require('fs-extra').writeFileSync(groupDataPath, JSON.stringify(groupData, null, 2), 'utf8');
        } catch (backupError) {
          console.log("Auto backup failed:", backupError.message);
        }
        
        try {
          const info = await api.getThreadInfo(targetID);
          const successMsg = `✅ গ্রুপ চালু হয়েছে!

📝 নাম: ${info.threadName}
👥 মেম্বার: ${info.participantIDs.length} জন
🆔 ID: ${targetID}

🎉 এখন সব কমান্ড ব্যবহার করা যাবে!
📋 /help লিখে দেখুন।`;
          
          return api.sendMessage(successMsg, threadID, messageID);
        } catch {
          return api.sendMessage("✅ গ্রুপ চালু হয়েছে! এখন সব কমান্ড ব্যবহার করা যাবে।", threadID, messageID);
        }
      }
    }
  } catch (error) {
    console.error("Approve command error:", error);
    return api.sendMessage("❌ কিছু ভুল হয়েছে! আবার চেষ্টা করুন।", threadID, messageID);
  }
};
