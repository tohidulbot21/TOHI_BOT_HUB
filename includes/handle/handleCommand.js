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
      'login required'
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

  // Command execution with timeout and error handling
  async function executeCommand(command, Obj, commandName) {
    const timeoutDuration = getCommandTimeout(commandName);

    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Command "${commandName}" timed out after ${timeoutDuration / 1000}s`));
      }, timeoutDuration);

      try {
        const result = await command.run(Obj);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
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

      // Get thread settings
      const threadData = global.data.threadData.get(threadID) || {};
      const prefix = threadData.PREFIX || global.config.PREFIX || "/";

      // Check if message starts with prefix
      if (!event.body.startsWith(prefix)) return;

      // Parse command
      const args = event.body.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      // Get command
      const command = commands.get(commandName);
      if (!command) return;

      const { config } = command;

      // Permission check
      if (config.permission > 0) {
        const isAdmin = global.config.ADMINBOT?.includes(senderID);
        if (!isAdmin && config.permission >= 2) {
          return; // Silently ignore for non-admins
        }
      }

      // Cooldown check
      if (config.cooldowns && !checkCooldown(senderID, commandName, config.cooldowns)) {
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

      // Create enhanced run object
      const Obj = {
        api,
        event,
        args,
        Users,
        Threads,
        Currencies,
        permssion: config.permission || 0,
        getText: global.getText,
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