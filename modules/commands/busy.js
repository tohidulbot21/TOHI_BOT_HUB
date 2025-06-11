
module.exports = {
  config: {
    name: "busy",
    version: "2.0.0",
    hasPermssion: 0,
    usePrefix: true,
    credits: "TOHI-BOT-HUB",
    description: "🚫 Do not disturb mode - Bot will notify when you're tagged",
    commandCategory: "utility",
    cooldowns: 5,
    usages: "[reason] or off",
    handleEvent: true
  },

  run: async function ({ api, event, args, Users, getLang }) {
    const { senderID, threadID, messageID } = event;
    
    try {
      // Check if user wants to turn off busy mode
      if (args[0] && args[0].toLowerCase() === "off") {
        const userData = await Users.getData(senderID);
        if (userData.data && userData.data.busy !== undefined) {
          delete userData.data.busy;
          await Users.setData(senderID, userData);
          
          return api.sendMessage(
            `🔓 Busy Mode বন্ধ হয়েছে!`,
            threadID, messageID
          );
        } else {
          return api.sendMessage(
            `❌ Busy Mode আগে থেকেই বন্ধ আছে\n💡 চালু করতে: /busy [কারণ]`,
            threadID, messageID
          );
        }
      }

      // Get the reason for being busy
      const reason = args.join(" ") || "";
      
      // Set busy mode
      const userData = await Users.getData(senderID);
      if (!userData.data) userData.data = {};
      userData.data.busy = reason || true;
      await Users.setData(senderID, userData);

      // Get user info for response with fallback
      let userName = `User-${senderID.slice(-6)}`;
      try {
        const userInfo = await api.getUserInfo(senderID);
        if (userInfo && userInfo[senderID] && userInfo[senderID].name) {
          userName = userInfo[senderID].name;
        }
      } catch (userInfoError) {
        // Use fallback name if getUserInfo fails
      }

      const successMessage = reason ? 
        `✅ Busy Mode চালু হয়েছে\n📝 কারণ: ${reason}\n🔓 বন্ধ করতে: /busy off`
        :
        `✅ Busy Mode চালু হয়েছে\n🔓 বন্ধ করতে: /busy off`;

      return api.sendMessage(successMessage, threadID, messageID);

    } catch (error) {
      console.error('[BUSY] Command error:', error);
      return api.sendMessage(
        `❌ System Error\n\n` +
        `🔧 Busy মোড সেট করতে সমস্যা হয়েছে।\n` +
        `💡 আবার চেষ্টা করুন।\n\n` +
        `🚩 Made by TOHIDUL`,
        threadID, messageID
      );
    }
  },

  // Handle when someone mentions a busy user
  handleEvent: async function ({ api, event, Users }) {
    const { mentions, threadID, messageID, senderID } = event;

    // Only process message events with mentions
    if (event.type !== "message" || !mentions || Object.keys(mentions).length === 0) return;

    try {
      // Check each mentioned user
      for (const [userID, mentionText] of Object.entries(mentions)) {
        // Skip if mentioning themselves
        if (userID === senderID) continue;
        
        const userData = await Users.getData(userID);
        
        // Check if user is in busy mode
        if (userData.data && userData.data.busy !== undefined) {
          let userName = `User-${userID.slice(-6)}`;
          
          try {
            // Try to get user name, but don't fail if rate limited
            const userInfo = await api.getUserInfo(userID);
            if (userInfo[userID]?.name) {
              userName = userInfo[userID].name;
            }
          } catch (userInfoError) {
            // Use fallback name if getUserInfo fails
          }

          const busyReason = userData.data.busy;

          // Create busy notification message
          let busyMessage;
          if (typeof busyReason === 'string' && busyReason.trim()) {
            busyMessage = `🚫 ${userName} ব্যস্ত আছেন\n📝 কারণ: ${busyReason}`;
          } else {
            busyMessage = `🚫 ${userName} ব্যস্ত আছেন\n📝 কোনো কারণ উল্লেখ করা হয়নি`;
          }

          // Send the busy notification
          try {
            await api.sendMessage(busyMessage, threadID);
          } catch (sendError) {
            // Silent fail for sending busy notifications
          }
          
          // Only send one notification per message
          break;
        }
      }
    } catch (error) {
      // Silent error handling for event functions
    }
  }
};
