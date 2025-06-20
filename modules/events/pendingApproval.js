const fs = require('fs');
const fsPromises = require('fs').promises;
const configPath = require('path').join(__dirname, '../../config.json');

module.exports.config = {
  name: "pendingApproval",
  eventType: ["log:thread-add"],
  version: "1.0.0",
  credits: "TOHI-BOT-HUB",
  description: "Auto approve or handle pending groups"
};

module.exports.run = async function({ api, event, Users, Threads, Groups }) {
  try {
    const { threadID, author, logMessageType } = event;

    // Only handle when bot is added to group
    if (logMessageType !== "log:thread-add") return;

    // Check if bot was added
    const botID = api.getCurrentUserID();
    if (!event.logMessageData || !event.logMessageData.addedParticipants) return;

    const addedBot = event.logMessageData.addedParticipants.find(p => p.userFbId === botID);
    if (!addedBot) return;

    // Get thread info
    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.name || "Unnamed Group";

    // Check if group already exists in database
    let groupData = Groups.getData(threadID);
    if (!groupData) {
      groupData = await Groups.createData(threadID);
    }

    // Check if auto approve is enabled
    if (Groups.isAutoApproveEnabled()) {
      // Auto approve
      Groups.approveGroup(threadID);

      api.sendMessage(
        `✅ Group "${groupName}" has been automatically approved!\n\n` +
        `📝 Type ${global.config.PREFIX || '*'}help to see available commands.\n` +
        `👑 Bot Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
        threadID
      );
    } else {
      // Manual approval required
      Groups.addToPending(threadID);

      api.sendMessage(
        `⏳ Group "${groupName}" এ বট add হয়েছে কিন্তু এখনো approve করা হয়নি।\n\n` +
        `🚫 Bot এর কোনো command কাজ করবে না যতক্ষণ না admin approve করে।\n` +
        `⏰ Admin এর approval এর জন্য অপেক্ষা করুন।\n\n` +
        `👑 Bot Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
        threadID
      );

      // Notify admins
      const adminMessage = `🔔 নতুন গ্রুপ approval এর জন্য অপেক্ষা করছে:\n\n` +
        `📝 Group Name: ${groupName}\n` +
        `🆔 Group ID: ${threadID}\n` +
        `👥 Members: ${threadInfo.participantIDs?.length || 0}\n` +
        `📅 Added: ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}\n\n` +
        `✅ Approve করতে: ${global.config.PREFIX || '*'}approve ${threadID}\n` +
        `❌ Reject করতে: bot কে group থেকে remove করুন`;

      if (global.config.ADMINBOT && global.config.ADMINBOT.length > 0) {
        global.config.ADMINBOT.forEach(adminID => {
          api.sendMessage(adminMessage, adminID);
        });
      }
    }

  } catch (error) {
    console.error('Error in pendingApproval event:', error);
  }
};