module.exports = function ({ api, Users, Threads, Currencies, logger }) {
  return async function handleCommandEvent({ event }) {
    try {
      if (!event || event.type !== "message") return;

      const { commands } = global.client;
      const { threadID, senderID } = event;

      // Check if any commands have handleEvent
      for (const [commandName, command] of commands) {
        try {
          if (command.handleEvent) {
            const runObj = {
              api,
              event,
              Users,
              Threads, 
              Currencies,
              logger
            };

            // Execute with timeout
            await Promise.race([
              command.handleEvent(runObj),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('HandleEvent timeout')), 30000)
              )
            ]);
          }
        } catch (error) {
          // Silently ignore handleEvent errors
          logger.log(`HandleEvent error for ${commandName}: ${error.message}`, "DEBUG");
        }
      }

    } catch (error) {
      logger.log(`HandleCommandEvent error: ${error.message}`, "DEBUG");
    }
  };
};