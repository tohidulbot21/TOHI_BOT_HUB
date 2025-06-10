module.exports = function ({ Users, Threads }) {
    const logger =require("../../utils/log.js");
    const threads = require('../database/data/threadsData.json')
    const users = require('../database/data/usersData.json')
    return async function ({ event }) {
        const { allUserID, allThreadID } = global.data; 
        const { autoCreateDB } = global.config;
        if (autoCreateDB == ![]) return;
        var { senderID, threadID } = event;
        senderID = String(senderID);
        var threadID = String(threadID);
        try {
            // Always ensure user data exists first
            if (!allUserID.includes(senderID) && !users.hasOwnProperty(senderID)) {
                allUserID.push(senderID);
                try {
                    await Users.createData(senderID);
                    logger.log(global.getText('handleCreateDatabase', 'newUser', senderID), 'DATABASE');
                } catch (error) {
                    logger.log(`Error creating user ${senderID}: ${error.message}`, 'ERROR');
                }
            }
            
            // Create thread data if needed
            if (!allThreadID.includes(threadID) && event.isGroup == !![] && !threads.hasOwnProperty(threadID)) {
                allThreadID.push(threadID)
                await Threads.createData(threadID);
                logger.log(global.getText('handleCreateDatabase', 'newThread', threadID), 'DATABASE');
            }
            
            // Update participant data
            if(threads.hasOwnProperty(threadID)) {
                var data = threads[threadID]
                if(data) {
                    if(!data.threadInfo.participantIDs.includes(senderID)) {
                        data.threadInfo.participantIDs.push(senderID)
                        logger.log('Perform more group data ' + threadID, 'ADD DATA')
                        await Threads.setData(threadID, {threadInfo: data.threadInfo})
                    }
                }
            }
            
            // Force create user data if still missing
            if (!users.hasOwnProperty(senderID)) {
                try {
                    await Users.createData(senderID);
                    logger.log(global.getText('handleCreateDatabase', 'newUser', senderID), 'DATABASE');
                } catch (error) {
                    logger.log(`Failed to create user data for ${senderID}: ${error.message}`, 'ERROR');
                }
            }
            return;
        } catch (err) {
            return console.log(err);
        }
    };
}
