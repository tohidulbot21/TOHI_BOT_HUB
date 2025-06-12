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
              logger,
              getText: (key) => {
                // Provide a fallback getText function
                const fallbackMessages = {
                  "levelup": "Congratulations {name}, being talkative helped you level up to level {level}!",
                  "on": "on",
                  "off": "off",
                  "successText": "success notification rankup!"
                };
                return fallbackMessages[key] || `Message for ${key}`;
              }
            };

            // Execute with longer timeout for heavy operations
            await Promise.race([
              command.handleEvent(runObj),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('HandleEvent timeout')), 120000)
              )
            ]);
          }
        } catch (error) {
          // Suppress common timeout and rate limit errors
          if (error.message && (
            error.message.includes('HandleEvent timeout') ||
            error.message.includes('Rate limit') ||
            error.message.includes('timeout') ||
            error.message.includes('timed out') ||
            error.toString().includes('ECONNRESET') ||
            error.toString().includes('ETIMEDOUT')
          )) {
            // Silently ignore these common errors
            return;
          }
          logger.log(`HandleEvent error for ${commandName}: ${error.message}`, "DEBUG");
        }
      }

    } catch (error) {
      logger.log(`HandleCommandEvent error: ${error.message}`, "DEBUG");
    }
  };
};