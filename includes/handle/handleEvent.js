module.exports = function ({ api, Users, Threads, Currencies, logger }) {
  return async function handleEvent({ event }) {
    try {
      const { events } = global.client;
      const { threadID, messageID, senderID, body } = event;

      // Check for non-prefix commands in message body
      if (event.body && typeof event.body === 'string') {
        const messageText = event.body.toLowerCase().trim();

        // Define non-prefix commands that should be logged
        const nonPrefixCommands = [
          'bby', 'baby', 'bbi', 'love', 'kiss', 'hug', 'good morning', 
          'good night', 'gm', 'gn', 'hi', 'hello', 'hey', 'wow', 'nice',
          'thanks', 'thank you', 'ok', 'okay', 'yes', 'no', 'hmm', 'hm'
        ];

        // Check if message matches any non-prefix command
        const matchedCommand = nonPrefixCommands.find(cmd => {
          return messageText === cmd || messageText.includes(cmd);
        });

        if (matchedCommand) {
          // Log non-prefix command usage with style
          try {
            // Get user info
            let userName = "Unknown User";
            try {
              if (!global.data.userName.has(senderID)) {
                const userInfo = await api.getUserInfo(senderID);
                if (userInfo && userInfo[senderID]) {
                  global.data.userName.set(senderID, userInfo[senderID].name || "Unknown User");
                }
              }
              userName = global.data.userName.get(senderID) || "Unknown User";
            } catch (e) {
              // Ignore user info errors
            }

            // Get group info
            let groupName = "Private Chat";
            if (event.threadID && event.threadID !== event.senderID) {
              try {
                const threadInfo = await api.getThreadInfo(event.threadID);
                groupName = threadInfo.threadName || `Group ${event.threadID.slice(-6)}`;
              } catch (e) {
                groupName = `Group ${event.threadID.slice(-6)}`;
              }
            }

            // Create stylish console output for non-prefix commands
            const chalk = require("chalk");
            const gradient = require("gradient-string");

            console.log(chalk.magenta("╭─────────────────────────────────────╮"));
            console.log(chalk.magenta("│") + gradient.pastel("      💬 NON-PREFIX TRIGGERED 💬     ") + chalk.magenta("│"));
            console.log(chalk.magenta("╰─────────────────────────────────────╯"));
            console.log(chalk.yellow("📋 Group Name: ") + chalk.green(groupName));
            console.log(chalk.yellow("👤 User: ") + chalk.blue(userName));
            console.log(chalk.yellow("🆔 UID: ") + chalk.magenta(senderID));
            console.log(chalk.yellow("💭 Message: ") + chalk.cyan(`"${event.body}"`));
            console.log(chalk.yellow("🎯 Trigger: ") + chalk.red(matchedCommand));
            console.log(chalk.yellow("📊 Status: ") + chalk.green("✅ DETECTED"));
            console.log(chalk.yellow("⏰ Time: ") + chalk.cyan(new Date().toLocaleString("en-US", {
              timeZone: "Asia/Dhaka",
              hour12: true,
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              second: '2-digit'
            })));
            console.log(chalk.magenta("─".repeat(40)));
          } catch (logError) {
            // Fallback logging
            logger.log(`Non-prefix command "${matchedCommand}" triggered by ${userName} (${senderID})`, "INFO");
          }
        }
      }

      // Handle events
      for (const [eventName, eventCommand] of events) {
        try {
          // Enhanced error checking for events
          if (!eventCommand || !eventCommand.config) continue;

          // Permission check for events
          if (eventCommand.config.permission && eventCommand.config.permission > 0) {
            const isAdmin = global.config.ADMINBOT?.includes(senderID);
            if (!isAdmin && eventCommand.config.permission >= 2) {
              continue;
            }
          }

          // Create enhanced event object
          const eventObj = {
            api,
            event,
            Users,
            Threads,
            Currencies,
            logger
          };

          // Execute event
          if (typeof eventCommand.run === 'function') {
            await eventCommand.run(eventObj);
          } else if (typeof eventCommand.onStart === 'function') {
            await eventCommand.onStart(eventObj);
          }
        } catch (error) {
          // Silent error handling for events
          logger.log(`Event "${eventName}" error: ${error.message}`, "DEBUG");
        }
      }
    } catch (error) {
      logger.log(`HandleEvent error: ${error.message}`, "ERROR");
    }
  };
};