module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
    const logger = require("../../utils/log.js")
    return function ({ event, ...rest2 }) {
        const { allowInbox } = global.config;
        const { userBanned, threadBanned } = global.data;
        const { commands, eventRegistered } = global.client;
        var { senderID, threadID } = event;
        var senderID = String(senderID);
        var threadID = String(threadID);
        
        // Simplified approval check
        const isPM = threadID === senderID;
        if (!isPM) {
          try {
            const config = require('../../config.json');
            const isApproved = config.AUTO_APPROVE?.enabled || 
                              config.APPROVAL?.approvedGroups?.includes(threadID) || 
                              false;
            if (!isApproved) return;
          } catch (error) {
            // Continue if config can't be loaded
          }
        }
        
        if (userBanned.has(senderID) || threadBanned.has(threadID) || allowInbox == !![] && senderID == threadID) return;
        for (const eventReg of eventRegistered) {
            let cmd = commands.get(eventReg);
            
            // If not found by name, check aliases
            if (!cmd) {
                for (const [cmdName, cmdModule] of commands.entries()) {
                    if (cmdModule.config && cmdModule.config.aliases && Array.isArray(cmdModule.config.aliases)) {
                        if (cmdModule.config.aliases.includes(eventReg)) {
                            cmd = cmdModule;
                            break;
                        }
                    }
                }
            }
            var getText2;

            if (cmd && cmd.languages && typeof cmd.languages == 'object') 
                getText2 = (...values) => {
                const commandModule = cmd.languages || {};
                if (!commandModule.hasOwnProperty(global.config.language)) 
                    return api.sendMessage(global.getText('handleCommand','notFoundLanguage', cmd.config.name), threadID, messengeID); 
                var lang = cmd.languages[global.config.language][values[0]] || '';
                for (var i = values.length; i > 0x16c0 + -0x303 + -0x1f * 0xa3; i--) {
                    const expReg = RegExp('%' + i, 'g');
                    lang = lang.replace(expReg, values[i]);
                }
                return lang;
            };
            else getText2 = () => {};
            try {
                const Obj = {
                    ...rest,
                    ...rest2
                };
                Obj.event = event 
                Obj.api = api
                Obj.models = models
                Obj.Users = Users
                Obj.Threads = Threads 
                Obj.Currencies = Currencies 
                Obj.getText = getText2;
                
                if (cmd && cmd.handleEvent) {
                    // Wrap in async handler to catch promise rejections
                    Promise.resolve(cmd.handleEvent(Obj)).catch(eventError => {
                        if (!shouldIgnoreError(eventError)) {
                            logger.log(`Event error in ${cmd.config.name}: ${eventError.message}`, 'error');
                        }
                    });
                }
            } catch (error) {
                if (!shouldIgnoreError(error)) {
                    logger.log(`Command event error in ${cmd.config?.name || 'unknown'}: ${error.message}`, 'error');
                }
            }
        }
    };
};
