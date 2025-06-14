module.exports = function ({ api, Users, Threads, Currencies, logger, botSettings }) {
  const moment = require("moment-timezone");
  const axios = require("axios");

  // Enhanced error checking
  function shouldIgnoreError(error) {
    if (!error) return true;

    const errorStr = error.toString().toLowerCase();
    const ignorablePatterns = [
      'rate limit',
      'enoent',
      'network timeout',
      'connection reset',
      'does not exist in database',
      'you can\'t use this feature',
      'took too long to execute',
      'command timeout',
      'execution timeout',
      'request timeout',
      'socket timeout',
      'network error',
      'api error',
      'facebook error',
      'permission denied',
      'access denied',
      'invalid session',
      'login required',
      'cannot read properties of undefined',
      'getname is not a function',
      'mqtt',
      'attachment url',
      'has no valid run or onstart function',
      'command has no valid',
      'no valid function',
      'function is not defined'
    ];

    return ignorablePatterns.some(pattern => errorStr.includes(pattern));
  }

  // Enhanced cooldown management
  const cooldowns = new Map();
  const userActivity = new Map();

  function checkCooldown(userID, commandName, cooldownTime) {
    if (!cooldownTime || cooldownTime <= 0) return true;

    const key = `${userID}_${commandName}`;
    const now = Date.now();
    const lastUsed = cooldowns.get(key) || 0;

    if (now - lastUsed < cooldownTime * 1000) {
      return false;
    }

    cooldowns.set(key, now);
    return true;
  }

  // Command execution without timeout
  async function executeCommand(command, Obj, commandName) {
    try {
      // Support run, onStart, and start functions
      if (typeof command.run === 'function') {
        return await command.run(Obj);
      } else if (typeof command.onStart === 'function') {
        return await command.onStart(Obj);
      } else if (typeof command.start === 'function') {
        return await command.start(Obj);
      } else {
        // Silently ignore commands without valid functions
        return;
      }
    } catch (error) {
      throw error;
    }
  }

  function getCommandTimeout(commandName) {
    // Heavy commands get longer timeout
    const heavyCommands = [
      'album', 'album2', 'work', 'daily', 'video', 'video2', 'video3',
      'sing', 'sing2', 'tiktok', 'download', 'ai', 'gemini', 'imagine',
      'dalle', 'art', 'cover', 'fbcover', 'insta', 'twitter', 'pinterest'
    ];

    const veryHeavyCommands = [
      'album2', 'work', 'video3', 'download', 'fbvideo'
    ];

    if (veryHeavyCommands.includes(commandName?.toLowerCase())) {
      return 300000; // 5 minutes
    } else if (heavyCommands.includes(commandName?.toLowerCase())) {
      return 180000; // 3 minutes
    } else {
      return 60000; // 1 minute
    }
  }

  return async function handleCommand({ event }) {
    try {
      if (!event || !event.body) return;

      const { api } = global.client;
      const { commands } = global.client;
      const { threadID, messageID, senderID, isGroup } = event;

      // Check if group is approved before executing any commands
      const fs = require('fs');
      const configPath = require('path').join(__dirname, '../../config.json');
      let approvalConfig = {};

      try {
        const configData = fs.readFileSync(configPath, 'utf8');
        approvalConfig = JSON.parse(configData);
      } catch (error) {
        approvalConfig = { APPROVAL: { approvedGroups: [] } };
      }

      // Initialize approval system if not exists
      if (!approvalConfig.APPROVAL) {
        approvalConfig.APPROVAL = { approvedGroups: [], pendingGroups: [], rejectedGroups: [] };
      }

      // For group chats, check if group is approved
      if (event.threadID && event.threadID !== event.senderID) {
        const isApproved = approvalConfig.APPROVAL.approvedGroups.includes(String(event.threadID));
        const isOwner = global.config.ADMINBOT && global.config.ADMINBOT.includes(event.senderID);

        // If group is not approved and sender is not owner, block all commands
        if (!isApproved && !isOwner) {
          // Only allow approve command for owner
          const messageBody = event.body || "";
          const prefix = global.config.PREFIX || "/";

          if (messageBody.startsWith(prefix + "approve") && isOwner) {
            // Allow approve command to pass through
          } else {
            // Block all other commands
            return;
          }
        }
      }

      // Get thread settings
      const threadData = global.data.threadData.get(threadID) || {};
      const prefix = threadData.PREFIX || global.config.PREFIX || "/";

      // Check if message starts with prefix
      if (!event.body.startsWith(prefix)) return;

      // Parse command
      const args = event.body.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      // Get command (check both name and aliases)
      let command = commands.get(commandName);
      if (!command) {
        // Check aliases
        for (const [name, cmd] of commands) {
          if (cmd.config.aliases && Array.isArray(cmd.config.aliases)) {
            if (cmd.config.aliases.includes(commandName)) {
              command = cmd;
              break;
            }
          }
        }
      }

      if (!command) return;

      const commandConfig = command.config;

      // Permission check
      if (commandConfig.permission > 0) {
        const isAdmin = global.config.ADMINBOT?.includes(senderID);
        if (!isAdmin && commandConfig.permission >= 2) {
          return; // Silently ignore for non-admins
        }
      }

      // Cooldown check
      if (commandConfig.cooldowns && !checkCooldown(senderID, commandName, commandConfig.cooldowns)) {
        return; // Silently ignore cooldown violations
      }

      // Thread/User ban check
      const threadBanned = global.data.threadBanned.has(threadID);
      const userBanned = global.data.userBanned.has(senderID);
      const commandBanned = global.data.commandBanned.get(threadID)?.includes(commandName) ||
                           global.data.commandBanned.get(senderID)?.includes(commandName);

      if (threadBanned || userBanned || commandBanned) {
        return; // Silently ignore banned users/threads
      }

      // Rate limiting
      if (botSettings?.RATE_LIMITING?.ENABLED) {
        const lastActivity = userActivity.get(senderID) || 0;
        const now = Date.now();
        const interval = botSettings.RATE_LIMITING.MIN_MESSAGE_INTERVAL || 8000;

        if (now - lastActivity < interval) {
          return; // Silently ignore rate limited users
        }

        userActivity.set(senderID, now);
      }

      // Create fallback getText function that works without language keys
      const fallbackGetText = (key, ...args) => {
        try {
          // Try to use global getText first
          if (global.getText && typeof global.getText === 'function') {
            const result = global.getText(key, ...args);
            if (result && result !== key) {
              return result;
            }
          }
        } catch (e) {
          // Ignore getText errors
        }

        // Fallback messages for common keys
        const fallbackMessages = {
          "moduleInfo": `
╔═────── ★ ★ ─────═╗
        💫 TOHI-BOT MODULE INFO 💫
╚═────── ★ ★ ─────═╝
🔹 Name         : %1
🔸 Usage        : %3
📝 Description   : %2
🌈 Category     : %4
⏳ Cooldown     : %5s
🔑 Permission   : %6

⚡️ Made by TOHIDUL | TOHI-BOT ⚡️`,
          "helpList": `✨ TOHI-BOT has %1 commands available!
🔍 TIP: Type %2help [command name] for details!`,
          "user": "User",
          "adminGroup": "Admin Group",
          "adminBot": "Admin Bot",
          "on": "on",
          "off": "off",
          "successText": "Success!",
          "error": "An error occurred",
          "missingInput": "Please provide required input",
          "noPermission": "You don't have permission to use this command",
          "cooldown": "Please wait before using this command again",
          "levelup": "Congratulations {name}, you leveled up to level {level}!",
          "reason": "Reason",
          "at": "at",
          "banSuccess": "User banned successfully",
          "unbanSuccess": "User unbanned successfully"
        };

        // If we have a fallback message, format it with args
        if (fallbackMessages[key]) {
          let message = fallbackMessages[key];
          for (let i = 0; i < args.length; i++) {
            message = message.replace(new RegExp(`%${i + 1}`, 'g'), args[i] || '');
            message = message.replace(new RegExp(`\\{${i + 1}\\}`, 'g'), args[i] || '');
          }
          return message;
        }

        // If no fallback found, return a generic message
        return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      };

      // Create enhanced run object
      const Obj = {
        api,
        event,
        args,
        Users,
        Threads,
        Currencies,
        permssion: commandConfig.permission || 0,
        getText: fallbackGetText,
        logger
      };

      // Enhanced user info
      try {
        if (!global.data.userName.has(senderID)) {
          const userInfo = await api.getUserInfo(senderID);
          if (userInfo && userInfo[senderID]) {
            global.data.userName.set(senderID, userInfo[senderID].name || "Unknown User");
          }
        }
      } catch (e) {
        // Ignore user info errors
      }

      const userName = global.data.userName.get(senderID) || "Unknown User";

      // Log command usage
      logger.log(`Command "${commandName}" used by ${userName} (${senderID})`, "COMMAND");

      // Execute command with enhanced error handling
      try {
        await executeCommand(command, Obj, commandName);
      } catch (error) {
        if (shouldIgnoreError(error)) {
          // Log timeout/ignorable errors as DEBUG only
          logger.log(`Command "${commandName}" issue: ${error.message}`, "DEBUG");
        } else {
          // Log other errors normally
          logger.log(`Command "${commandName}" error: ${error.message}`, "ERROR");
        }
      }

    } catch (error) {
      if (!shouldIgnoreError(error)) {
        logger.log(`HandleCommand error: ${error.message}`, "ERROR");
      }
    }
  };
};