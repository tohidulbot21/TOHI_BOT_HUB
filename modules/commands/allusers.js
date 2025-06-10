module.exports.config = {
    name: "alluser",
    version: "1.0.8",
    permission: 2, // Only admins can use this command
    usePrefix: true,
    credits: "TOHI-BOT-HUB",
    description: "Displays all group members with their IDs and names.",
    category: "admin",
    commandCategory: "Info",
    cooldowns: 2
};

module.exports.run = async function ({ api, event, args, Users }) {
    // Check if the user is a bot admin or group admin
    const isBotAdmin = global.config.ADMINBOT.includes(event.senderID.toString());
    
    if (!isBotAdmin) {
        try {
            const threadInfo = await api.getThreadInfo(event.threadID);
            const isGroupAdmin = threadInfo.adminIDs.some(admin => admin.id === event.senderID);
            
            if (!isGroupAdmin) {
                return api.sendMessage("🚫 **Access Denied!** Only bot admins or group admins can use this command! 😎", event.threadID, event.messageID);
            }
        } catch (error) {
            return api.sendMessage("❌ **Error checking admin status!** Please try again later. 🚨", event.threadID, event.messageID);
        }
    }

    function reply(d) {
        api.sendMessage(d, event.threadID, event.messageID);
    }

    try {
        const ep = event.participantIDs;
        let msg = "╭───✨ **Group Members** ✨───╮\n";
        msg += "│  📋 **List of All Users**  │\n";
        msg += "╰──────────────────────╯\n\n";
        let m = 0;

        for (let i of ep) {
            m += 1;
            const name = await Users.getNameUser(i);
            msg += `🌟 ${m}. **${name}** 🌟\n`;
            msg += `📌 **User ID**: ${i}\n`;
            msg += `🔗 **Profile**: https://facebook.com/${i}\n`;
            msg += `╰─➤ **Status**: Active 🟢\n\n`;
        }

        const finalMsg = `🎉 **Group Members Overview** 🎉\n\n${msg}╭───💡 **Crafted by Tohidul** 💡───╮\n╰─────────────────────────╯`;
        reply(finalMsg);
    } catch (error) {
        reply("❌ **Oops! Something went wrong!** 😓\nPlease try again later or contact the bot admin. 🚨");
    }
};