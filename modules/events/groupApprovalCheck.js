
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "groupApprovalCheck",
  eventType: ["message"],
  version: "2.0.0",
  credits: "TOHI-BOT-HUB",
  description: "Advanced group approval system with database integration"
};

module.exports.run = async function({ api, event, Groups }) {
  try {
    // Only check for group messages (not personal messages)
    if (!event.threadID || event.threadID === event.senderID) return;
    
    // Skip if message doesn't start with prefix
    const prefix = global.config.PREFIX || "/";
    if (!event.body || !event.body.startsWith(prefix)) return;
    
    const threadID = String(event.threadID);
    const senderID = String(event.senderID);
    const isOwner = global.config.ADMINBOT && global.config.ADMINBOT.includes(senderID);
    
    // Initialize Groups if not available
    if (!Groups) {
      Groups = require('../../includes/database/groups')({ api });
    }
    
    // Check group approval status
    const isApproved = Groups.isApproved(threadID);
    const isPending = Groups.isPending(threadID);
    const isRejected = Groups.isRejected(threadID);
    
    // If group is not approved and sender is not owner
    if (!isApproved && !isOwner) {
      const command = event.body.split(' ')[0].substring(1).toLowerCase();
      
      // Allow only approve command for owner
      if (command === 'approve' && isOwner) {
        return; // Let the command pass through
      }
      
      // Block all other commands
      if (isPending) {
        // Get group data for better message
        const groupData = Groups.getData(threadID);
        const groupName = groupData ? groupData.threadName : "Unknown Group";
        
        api.sendMessage(
          `⏳ গ্রুপ "${groupName}" এখনো approve করা হয়নি।\n\n` +
          `🚫 Bot এর কোনো command কাজ করবে না।\n` +
          `⏰ Admin approval এর জন্য অপেক্ষা করুন।\n\n` +
          `📊 Status: Pending Approval\n` +
          `🆔 Group ID: ${threadID}\n` +
          `👑 Bot Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
          event.threadID
        );
      } else if (isRejected) {
        api.sendMessage(
          `❌ এই গ্রুপটি reject করা হয়েছে।\n\n` +
          `🚫 Bot এর কোনো command কাজ করবে না।\n` +
          `📞 Admin এর সাথে যোগাযোগ করুন।\n\n` +
          `📊 Status: Rejected\n` +
          `👑 Bot Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
          event.threadID
        );
      } else {
        // Group is not in any list - add to pending
        try {
          const groupData = await Groups.createData(threadID);
          Groups.addToPending(threadID);
          
          api.sendMessage(
            `⏳ নতুন গ্রুপ detect হয়েছে!\n\n` +
            `📝 Group: ${groupData ? groupData.threadName : 'Unknown'}\n` +
            `🆔 ID: ${threadID}\n` +
            `📊 Status: Pending Approval\n\n` +
            `🚫 Bot commands কাজ করবে না যতক্ষণ না approve হয়।\n` +
            `👑 Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
            event.threadID
          );
          
          // Notify admin
          if (global.config.ADMINBOT && global.config.ADMINBOT[0]) {
            api.sendMessage(
              `🔔 নতুন গ্রুপ approval এর জন্য অপেক্ষা করছে:\n\n` +
              `📝 Group: ${groupData ? groupData.threadName : 'Unknown'}\n` +
              `🆔 ID: ${threadID}\n` +
              `👥 Members: ${groupData ? groupData.memberCount : 0}\n\n` +
              `✅ Approve: ${prefix}approve\n` +
              `❌ Reject: ${prefix}approve reject ${threadID}`,
              global.config.ADMINBOT[0]
            );
          }
        } catch (error) {
          console.error('Error handling new group:', error);
        }
      }
      
      // Block the command by setting a flag
      event.blockCommand = true;
    } else if (isApproved) {
      // Group is approved - ensure data is up to date
      try {
        const groupData = Groups.getData(threadID);
        if (!groupData || !groupData.settings || !groupData.settings.allowCommands) {
          Groups.setData(threadID, {
            settings: { allowCommands: true, autoApprove: false }
          });
        }
      } catch (error) {
        console.error('Error updating approved group data:', error);
      }
    }
    
  } catch (error) {
    console.error('Group approval check error:', error);
  }
};
