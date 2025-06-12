let activeCmd = false;
const processedMessages = new Map(); // Track processed messages
const DUPLICATE_TIMEOUT = 3000; // 3 seconds

// Define shouldIgnoreError function to handle specific errors
function shouldIgnoreError(error) {
  if (!error) return false;

  const errorStr = error.toString().toLowerCase();
  const errorMessage = error.message ? error.message.toLowerCase() : '';

  // Facebook spam protection errors
  if (error.error === 1390008 || errorStr.includes("can't use this feature") || errorStr.includes("spam")) {
    return true;
  }

  // Content availability errors
  if (error.error === 1357031 || errorStr.includes('content is no longer available') || errorStr.includes('content you requested cannot be displayed')) {
    return true;
  }

  // Rate limit errors
  if (errorStr.includes('rate limit') || errorStr.includes('429') || error.error === 3252001) {
    return true;
  }

  // User not found errors
  if (errorStr.includes('user id') && errorStr.includes('does not exist')) {
    return true;
  }

  // Network timeout errors
  if (errorStr.includes('timeout') || errorStr.includes('network')) {
    return true;
  }

  // Facebook API temporary errors
  if (errorStr.includes('temporary') || errorStr.includes('try again')) {
    return true;
  }

  // Permission and blocked action errors
  if (errorStr.includes('blocked') || errorStr.includes('permission') || error.blockedAction) {
    return true;
  }

  return false;
}

// Make function globally available
global.shouldIgnoreError = shouldIgnoreError;

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  const stringSimilarity = require("string-similarity");
  const moment = require("moment-timezone");
  const logger = require("../../utils/log");
  const { readFileSync, writeFileSync } = require("fs-extra");
  const { join, resolve } = require('path');
  const { execSync } = require('child_process');
  const axios = require('axios');
  const chalk = require('chalk');

// Helper function for command suggestion
function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

  // Cache for frequently accessed data
  const commandCache = new Map();
  const cooldownCache = new Map();

  const OWNER_UIDS = ["100092006324917"];

  // Protected commands that can't be used against the owner
  const PROTECTED_COMMANDS = ["toilet", "hack", "arrest", "ban", "kick"];

  return async function ({ event, ...rest2 }) {
    if (activeCmd) {
      return;
    }

    // Quick return for non-command messages
    if (!event.body || typeof event.body !== 'string') {
      return;
    }

    // Simplified duplicate prevention
    const messageKey = `${event.threadID}_${event.messageID}_${Date.now()}`;

    // Quick duplicate check without blocking
    if (processedMessages.has(event.messageID)) {
      return;
    }

    // Mark message as processed
    processedMessages.set(event.messageID, Date.now());

    // Clean old entries less frequently
    if (processedMessages.size > 500) {
      const now = Date.now();
      const toDelete = [];
      for (const [key, timestamp] of processedMessages.entries()) {
        if (now - timestamp > DUPLICATE_TIMEOUT) {
          toDelete.push(key);
        }
      }
      toDelete.forEach(key => processedMessages.delete(key));
    }

    // Simplified approval check - handled in listen.js already
    // Skip duplicate approval checking here to prevent conflicts

    const dateNow = Date.now();
    const time = moment.tz("Asia/Manila").format("HH:MM:ss DD/MM/YYYY");
    const { allowInbox, PREFIX, ADMINBOT, DeveloperMode, adminOnly } = global.config;
    const { userBanned, threadBanned, threadInfo, commandBanned } = global.data;
    const { commands } = global.client;

    var { body, senderID, threadID, messageID } = event;
    var senderID = String(senderID),
      threadID = String(threadID);

    const args = (body || "").trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    var command = commands.get(commandName);
    const replyAD = "[ MODE ] - Only bot admin can use bot";

    if (
      command &&
      command.config.name.toLowerCase() === commandName.toLowerCase() &&
      !ADMINBOT.includes(senderID) &&
      adminOnly &&
      senderID !== api.getCurrentUserID()
    ) {
      return api.sendMessage(replyAD, threadID, messageID);
    }

    if (
      typeof body === "string" &&
      body.startsWith(PREFIX) &&
      !ADMINBOT.includes(senderID) &&
      adminOnly &&
      senderID !== api.getCurrentUserID()
    ) {
      return api.sendMessage(replyAD, threadID, messageID);
    }

    if (
      userBanned.has(senderID) ||
      threadBanned.has(threadID) ||
      (allowInbox == ![] && senderID == threadID)
    ) {
      if (!ADMINBOT.includes(senderID.toString())) {
        if (userBanned.has(senderID)) {
          const { reason, dateAdded } = userBanned.get(senderID) || {};
          return api.sendMessage(
            global.getText("handleCommand", "userBanned", reason, dateAdded),
            threadID,
            async (err, info) => {
              await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID,
          );
        } else {
          if (threadBanned.has(threadID)) {
            const { reason, dateAdded } = threadBanned.get(threadID) || {};
            return api.sendMessage(
              global.getText(
                "handleCommand",
                "threadBanned",
                reason,
                dateAdded,
              ),
              threadID,
              async (_, info) => {
                await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
                return api.unsendMessage(info.messageID);
              },
              messageID,
            );
          }
        }
      }
    }

    if (commandName.startsWith(PREFIX)) {
      // Skip if only prefix is sent
      if (commandName === PREFIX) {
        return;
      }

      const cmdName = commandName.slice(PREFIX.length).toLowerCase();

      if (!command) {
        // First check for exact command name match
        command = commands.get(cmdName);

        // If not found, check for aliases
        if (!command) {
          for (const [name, cmdModule] of commands.entries()) {
            if (cmdModule.config && cmdModule.config.aliases && Array.isArray(cmdModule.config.aliases)) {
              if (cmdModule.config.aliases.some(alias => alias.toLowerCase() === cmdName)) {
                command = cmdModule;
                break;
              }
            }
          }
        }

        // If still not found, try similarity matching
        if (!command) {
          const allCommandNames = [];
          // Add command names
          for (const [name, cmdModule] of commands.entries()) {
            allCommandNames.push(name);
            // Add aliases
            if (cmdModule.config && cmdModule.config.aliases && Array.isArray(cmdModule.config.aliases)) {
              allCommandNames.push(...cmdModule.config.aliases);
            }
          }

          const checker = stringSimilarity.findBestMatch(cmdName, allCommandNames);
          if (checker.bestMatch.rating >= 0.5) {
            // Find the command by name or alias
            const matchedName = checker.bestMatch.target;
            command = commands.get(matchedName);
            if (!command) {
              // Check if it's an alias
              for (const [name, cmdModule] of commands.entries()) {
                if (cmdModule.config && cmdModule.config.aliases && Array.isArray(cmdModule.config.aliases)) {
                  if (cmdModule.config.aliases.includes(matchedName)) {
                    command = cmdModule;
                    break;
                  }
                }
              }
            }
          } else {
            return; // Simply ignore invalid commands
          }
        }
      }
    } else {
      // Handle commands without prefix (usePrefix: false)
      if (!command) {
        const firstWord = body.trim().split(' ')[0].toLowerCase();

        // Check for exact command name match
        for (const [cmdName, cmdModule] of commands.entries()) {
          if (cmdModule.config && cmdModule.config.usePrefix === false &&
            cmdName.toLowerCase() === firstWord) {
            command = cmdModule;
            break;
          }
        }

        // If not found, check for aliases
        if (!command) {
          for (const [cmdName, cmdModule] of commands.entries()) {
            if (cmdModule.config && cmdModule.config.usePrefix === false &&
              cmdModule.config.aliases && Array.isArray(cmdModule.config.aliases)) {
              if (cmdModule.config.aliases.some(alias => alias.toLowerCase() === firstWord)) {
                command = cmdModule;
                break;
              }
            }
          }
        }
      }
    }

    if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
      if (!ADMINBOT.includes(senderID)) {
        const banThreads = commandBanned.get(threadID) || [],
          banUsers = commandBanned.get(senderID) || [];
        if (banThreads.includes(command.config.name))
          return api.sendMessage(
            global.getText(
              "handleCommand",
              "commandThreadBanned",
              command.config.name,
            ),
            threadID,
            async (_, info) => {
              await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID,
          );
        if (banUsers.includes(command.config.name))
          return api.sendMessage(
            global.getText(
              "handleCommand",
              "commandUserBanned",
              command.config.name,
            ),
            threadID,
            async (_, info) => {
              await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID,
          );
      }
    }

    if (command && command.config && command.config.usePrefix !== undefined) {
      command.config.usePrefix = command.config.usePrefix ?? true;
    }

    if (command && command.config) {
      // For commands with usePrefix: false, check if the command name matches exactly
      if (command.config.usePrefix === false) {
        const firstWord = body.trim().split(' ')[0].toLowerCase();
        const isCommandMatch = firstWord === command.config.name.toLowerCase() ||
          (command.config.aliases && Array.isArray(command.config.aliases) &&
            command.config.aliases.some(alias => alias.toLowerCase() === firstWord));

        if (!isCommandMatch) {
          return; // Silently ignore if not matching
        }

        // Update args for non-prefix commands
        const tempArgs = body.trim().split(/ +/);
        tempArgs.shift(); // Remove the command name

        // Clear existing args and add new ones
        while (args.length > 0) {
          args.pop();
        }
        args.push(...tempArgs);
      }
      // For commands with usePrefix: true, require prefix
      if (command.config.usePrefix === true && !body.startsWith(PREFIX)) {
        return;
      }
    }

    if (command && command.config) {
      if (typeof command.config.usePrefix === "undefined") {
        api.sendMessage(
          global.getText("handleCommand", "noPrefix", command.config.name),
          event.threadID,
          event.messageID,
        );
        return;
      }
    }

    if (
      command &&
      command.config &&
      command.config.commandCategory &&
      command.config.commandCategory.toLowerCase() === "nsfw" &&
      !global.data.threadAllowNSFW.includes(threadID) &&
      !ADMINBOT.includes(senderID)
    )
      return api.sendMessage(
        global.getText("handleCommand", "threadNotAllowNSFW"),
        threadID,
        async (_, info) => {
          await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
          return api.unsendMessage(info.messageID);
        },
        messageID,
      );

    var threadInfo2;
    if (event.isGroup == !![])
      try {
        threadInfo2 =
          threadInfo.get(threadID) || (await Threads.getInfo(threadID));
        if (Object.keys(threadInfo2).length == 0) throw new Error();
      } catch (err) {
        logger.log(
          global.getText("handleCommand", "cantGetInfoThread", "error"),
        );
      }

    var permssion = 0;
    var threadInfoo =
      threadInfo.get(threadID) || (await Threads.getInfo(threadID));
    const find = threadInfoo.adminIDs.find((el) => el.id == senderID);
    if (ADMINBOT.includes(senderID.toString())) permssion = 2;
    else if (!ADMINBOT.includes(senderID) && find) permssion = 1;
    if (
      command &&
      command.config &&
      command.config.hasPermssion &&
      command.config.hasPermssion > permssion
    ) {
      return api.sendMessage(
        global.getText(
          "handleCommand",
          "permissionNotEnough",
          command.config.name,
        ),
        event.threadID,
        event.messageID,
      );
    }

    if (
      command &&
      command.config &&
      !client.cooldowns.has(command.config.name)
    ) {
      client.cooldowns.set(command.config.name, new Map());
    }

    const timestamps =
      command && command.config
        ? client.cooldowns.get(command.config.name)
        : undefined;

    const expirationTime =
      ((command && command.config && command.config.cooldowns) || 1) * 1000;

    if (
      timestamps &&
      timestamps instanceof Map &&
      timestamps.has(senderID) &&
      dateNow < timestamps.get(senderID) + expirationTime
    )
      return api.setMessageReaction(
        "⏳",
        event.messageID,
        (err) =>
          err
            ? logger.log(
                "An error occurred while executing setMessageReaction",
                2,
              )
            : "",
        !![],
      );

    var getText2;
    if (
      command &&
      command.languages &&
      typeof command.languages === "object" &&
      command.languages.hasOwnProperty(global.config.language)
    )
      getText2 = (...values) => {
        var lang = command.languages[global.config.language][values[0]] || "";
        for (var i = values.length; i > 0x2533 + 0x1105 + -0x3638; i--) {
          const expReg = RegExp("%" + i, "g");
          lang = lang.replace(expReg, values[i]);
        }
        return lang;
      };
    else getText2 = () => { };

    try {
      const Obj = {
        ...rest,
        ...rest2,
        api: api,
        event: event,
        args: args,
        models: models,
        Users: Users,
        Threads: Threads,
        Currencies: Currencies,
        permssion: permssion,
        getText: getText2,
      };

      if (command && typeof command.run === "function") {
        // Debug log for command execution
        logger.log(`Attempting to execute command: ${command.config.name}`, "DEBUG");
        
        // Set activeCmd to prevent concurrent execution
        activeCmd = true;

        try {
          // Get user name with better fallback - show full name or complete user ID
          let userName = senderID; // Default to full user ID
          try {
            const userData = await Users.getData(senderID);
            if (userData && userData.name) {
              userName = userData.name;
              event.fbUserName = userData.name;
            } else {
              // Try getUserInfo as fallback to get actual name
              try {
                const userInfo = await api.getUserInfo(senderID);
                if (userInfo && userInfo[senderID] && userInfo[senderID].name) {
                  userName = userInfo[senderID].name;
                  event.fbUserName = userInfo[senderID].name;
                }
              } catch (e) {
                // If both fail, use complete user ID instead of truncated version
                userName = `UserID-${senderID}`;
              }
            }
          } catch (dbError) {
            // Try getUserInfo as fallback
            try {
              const userInfo = await api.getUserInfo(senderID);
              if (userInfo && userInfo[senderID] && userInfo[senderID].name) {
                userName = userInfo[senderID].name;
                event.fbUserName = userInfo[senderID].name;
              } else {
                // Use complete user ID if name fetch fails
                userName = `UserID-${senderID}`;
              }
            } catch (e) {
              // Use complete user ID as final fallback
              userName = `UserID-${senderID}`;
            }
          }

          logger.log(`Command "${command.config.name}" used by ${userName}`, "COMMAND");

          // Execute command with extended timeout (60 seconds for heavy commands)
          const commandPromise = command.run(Obj);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Command took too long to execute')), 60000)
          );
          
          await Promise.race([commandPromise, timeoutPromise]);

          // Set cooldown only after successful execution
          if (timestamps && timestamps instanceof Map) {
            timestamps.set(senderID, dateNow);
          }
        } finally {
          // Always reset activeCmd
          activeCmd = false;
        }

        return;
      }
    } catch (e) {
      // Reset activeCmd on error
      activeCmd = false;

      // Enhanced error handling with better debugging
      if (e.code === 'ENOENT' && e.path && e.path.includes('cache')) {
        // File not found in cache - ignore these errors
        logger.log(`Cache file not found (ignored): ${e.path}`, "DEBUG");
      } else {
        // Log all command errors for debugging
        logger.log(`Command error in "${command?.config?.name || commandName}": ${e.message}`, "ERROR");
        console.error(`Full error details:`, e);

        // Send error message to help users understand what went wrong
        if (!shouldIgnoreError(e)) {
          try {
            // Send a helpful error message instead of generic one
            const errorMsg = `❌ Error in ${command?.config?.name || commandName} command: ${e.message}\n\n🔧 Please try again or contact admin if the issue persists.\n🚩 Made by TOHIDUL`;
            api.sendMessage(errorMsg, threadID, messageID);
          } catch (sendError) {
            // If can't send detailed error, try simple message
            try {
              api.sendMessage(`❌ Command failed. Please try again.`, threadID, messageID);
            } catch (finalError) {
              // Silent fail as last resort
              logger.log(`Failed to send error message: ${finalError.message}`, "ERROR");
            }
          }
        }
      }
    }

    if (!command) {
      // Check if command exists by alias
      for (const [cmdName, cmdModule] of commands.entries()) {
        if (cmdModule.config && cmdModule.config.aliases && Array.isArray(cmdModule.config.aliases)) {
          if (cmdModule.config.aliases.includes(commandName)) {
            command = cmdModule;
            break;
          }
        }
      }
    }

    if (!command) {
      // Only show suggestions for prefix commands
      if (body && body.startsWith(PREFIX)) {
        // Command not found - suggest similar commands
        const allCommands = [];

        // Collect all command names and aliases that use prefix
        for (const [cmdName, cmdModule] of commands.entries()) {
          if (!cmdModule.config || cmdModule.config.usePrefix !== false) {
            allCommands.push(cmdName);
            if (cmdModule.config && cmdModule.config.aliases && Array.isArray(cmdModule.config.aliases)) {
              allCommands.push(...cmdModule.config.aliases);
            }
          }
        }

        // Find similar commands using simple string matching
        const cmdNameWithoutPrefix = commandName.replace(PREFIX, '');
        const suggestions = allCommands.filter(cmd => 
          cmd.includes(cmdNameWithoutPrefix) || 
          cmdNameWithoutPrefix.includes(cmd) ||
          levenshteinDistance(cmd, cmdNameWithoutPrefix) <= 2
        ).slice(0, 3);

        let suggestionText = "";
        if (suggestions.length > 0) {
          suggestionText = `\n\n💡 Did you mean:\n${suggestions.map((cmd, i) => {
            return `${i + 1}. ${PREFIX}${cmd}`;
          }).join('\n')}`;
        }

        const errorMessage = `❌ এই কমান্ডটি খুঁজে পাওয়া যায়নি!${suggestionText}\n\n📝 সব কমান্ড দেখতে টাইপ করুন: ${PREFIX}help\n🔧 সাহায্যের জন্য: ${PREFIX}admin\n\n🚩 Made by TOHIDUL`;

        // Send command not found message directly
        try {
          api.sendMessage(errorMessage, threadID, messageID);
        } catch (sendError) {
          // Try fallback message if detailed message fails
          try {
            api.sendMessage(`❌ Invalid command. Type ${PREFIX}help for available commands.`, threadID, messageID);
          } catch (finalError) {
            logger.log(`Failed to send command not found message: ${finalError.message}`, "DEBUG");
          }
        }
      }
      return; // No prefix, just ignore
    }
  };
};