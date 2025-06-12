
module.exports = function ({ api, Users, Threads, Currencies, logger }) {
  return async function handleEvent({ event }) {
    try {
      if (!event || event.type !== "event") return;
      
      const { events } = global.client;
      if (!events || events.size === 0) return;
      
      const { threadID, senderID, logMessageType } = event;
      
      // Process each event handler
      for (const [eventName, eventHandler] of events) {
        try {
          if (!eventHandler.run) continue;
          
          const { config } = eventHandler;
          
          // Check if event type matches
          if (config.eventType && !config.eventType.includes(logMessageType)) {
            continue;
          }
          
          // Create run object
          const runObj = {
            api,
            event,
            Users,
            Threads,
            Currencies,
            logger
          };
          
          // Execute event handler with timeout
          await Promise.race([
            eventHandler.run(runObj),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Event timeout')), 45000)
            )
          ]);
          
        } catch (error) {
          logger.log(`Event handler error for ${eventName}: ${error.message}`, "DEBUG");
        }
      }
      
    } catch (error) {
      logger.log(`HandleEvent error: ${error.message}`, "DEBUG");
    }
  };
};
