
module.exports = function ({ api, Users, Threads, Currencies, logger }) {
  return async function handleReply({ event }) {
    try {
      if (!event || !event.messageReply) return;
      
      const { handleReply } = global.client;
      if (!handleReply || !Array.isArray(handleReply)) return;
      
      const { threadID, messageID, senderID } = event;
      const messageReplyID = event.messageReply.messageID;
      
      // Find matching reply handler
      const replyIndex = handleReply.findIndex(reply => reply.messageID === messageReplyID);
      if (replyIndex === -1) return;
      
      const reply = handleReply[replyIndex];
      const { name, author } = reply;
      
      // Check if sender matches author (optional)
      if (author && author !== senderID && !global.config.ADMINBOT?.includes(senderID)) {
        return; // Only author or admin can use reply
      }
      
      // Get command
      const { commands } = global.client;
      const command = commands.get(name);
      if (!command || !command.onReply) return;
      
      // Create run object
      const runObj = {
        api,
        event,
        Users,
        Threads,
        Currencies,
        Reply: reply,
        logger
      };
      
      try {
        // Execute onReply with timeout
        await Promise.race([
          command.onReply(runObj),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Reply timeout')), 60000)
          )
        ]);
        
        // Remove reply handler after successful execution
        handleReply.splice(replyIndex, 1);
        
      } catch (error) {
        logger.log(`Reply handler error for ${name}: ${error.message}`, "DEBUG");
        
        // Remove failed reply handler
        handleReply.splice(replyIndex, 1);
      }
      
    } catch (error) {
      logger.log(`HandleReply error: ${error.message}`, "DEBUG");
    }
  };
};
