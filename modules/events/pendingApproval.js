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

module.exports.run = async function({ api, event, Users, Threads }) {
  try {
    const { threadID, author, logMessageType } = event;

    // Only handle when bot is added to group
    if (logMessageType !== "log:thread-add") return;

    // Check if bot was added
    const botID = api.getCurrentUserID();
    if (!event.logMessageData || !event.logMessageData.addedParticipants) return;

    const addedBot = event.logMessageData.addedParticipants.find(p => p.userFbId === botID);
    if (!addedBot) return;

    // Load config
    let config = {};
    try {
      const configData = await fsPromises.readFile(configPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      // Initialize default config if file doesn't exist
      config = {
        AUTO_APPROVE: { enabled: true, approvedGroups: [] },
        APPROVAL: { approvedGroups: [], pendingGroups: [], rejectedGroups: [] }
      };
    }

    // Initialize approval arrays if they don't exist
    config.APPROVAL = config.APPROVAL || {};
    config.APPROVAL.approvedGroups = config.APPROVAL.approvedGroups || [];
    config.APPROVAL.pendingGroups = config.APPROVAL.pendingGroups || [];
    config.APPROVAL.rejectedGroups = config.APPROVAL.rejectedGroups || [];

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.name || "Unnamed Group";

    if (config.AUTO_APPROVE?.enabled) {
      // Auto approve
      if (!config.APPROVAL.approvedGroups.includes(threadID)) {
        config.APPROVAL.approvedGroups.push(threadID);

        // Save config
        await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));

        api.sendMessage(
          `✅ Group "${groupName}" has been automatically approved!\n\n` +
          `📝 Type /help to see available commands.\n` +
          `👑 Bot Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
          threadID
        );
      }
    } else {
      // Manual approval required
      if (!config.APPROVAL.pendingGroups.includes(threadID) && 
          !config.APPROVAL.approvedGroups.includes(threadID)) {
        config.APPROVAL.pendingGroups.push(threadID);

        // Save config
        await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));

        api.sendMessage(
          `⏳ Group "${groupName}" is pending approval.\n\n` +
          `Please wait for admin approval to use bot commands.`,
          threadID
        );

        // Notify admins
        const adminMessage = `🔔 New group pending approval:\n\n` +
          `📝 Name: ${groupName}\n` +
          `🆔 ID: ${threadID}\n` +
          `👥 Members: ${threadInfo.participantIDs?.length || 0}\n\n` +
          `Use /approve ${threadID} to approve this group.`;

        if (global.config.ADMINBOT && Array.isArray(global.config.ADMINBOT)) {
          global.config.ADMINBOT.forEach(adminID => {
            api.sendMessage(adminMessage, adminID);
          });
        }
      }
    }

  } catch (error) {
    console.error('Pending approval error:', error);
  }
};