const path = require('path');
const fs = require('fs');

module.exports = {
  config: {
    name: "pendingApproval",
    eventType: ["log:subscribe"],
    version: "5.0.0",
    credits: "TOHIDUL (Easy Bangla Edition)",
    description: "নতুন গ্রুপে বট গেলে approval pending এ পাঠায়, owner approval না দিলে কোনো কমান্ড কাজ করবে না।"
  },
  run: async function({ api, event }) {
    try {
      const configPath = path.join(__dirname, '../../config.json');
      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);
      const OWNER_ID = "100092006324917";

      // APPROVAL init
      if (!config.APPROVAL) {
        config.APPROVAL = {
          approvedGroups: [],
          pendingGroups: [],
          rejectedGroups: []
        };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      }

      // Disable auto-approve
      if (!config.AUTO_APPROVE) {
        config.AUTO_APPROVE = { enabled: false };
      } else {
        config.AUTO_APPROVE.enabled = false;
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Bot added to group
      if (
        event.logMessageData &&
        event.logMessageData.addedParticipants &&
        event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())
      ) {
        const threadID = event.threadID;

        if (config.APPROVAL.approvedGroups.includes(threadID)) return;
        if (config.APPROVAL.rejectedGroups && config.APPROVAL.rejectedGroups.includes(threadID)) return;

        if (!config.APPROVAL.pendingGroups.includes(threadID)) {
          config.APPROVAL.pendingGroups.push(threadID);
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        }

        try {
          const threadInfo = await api.getThreadInfo(threadID);
          const msg = 
`🔔 নতুন গ্রুপে বট যোগ হয়েছে!

নাম: ${threadInfo.threadName}
আইডি: ${threadID}
মেম্বার: ${threadInfo.participantIDs.length} জন

এই গ্রুপে বট চালু করবেন?

উত্তর দিন:
১ বা yes — চালু করতে
২ বা no — বাতিল করতে

অথবা: /approve ${threadID}

⚠️ অনুমোদন না দিলে এই গ্রুপে বট কাজ করবে না।`;

          api.sendMessage(msg, OWNER_ID, (error, info) => {
            if (!error) {
              global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: OWNER_ID,
                threadID: threadID,
                type: "approval"
              });
            }
          });
        } catch {}
      }
    } catch {}
  },

  handleReply: async function ({ api, event, handleReply }) {
    const OWNER_ID = "100092006324917";
    if (event.senderID !== OWNER_ID) {
      return api.sendMessage(`⛔️ কেবল owner (${OWNER_ID}) approval দিতে পারবেন।`, event.threadID);
    }

    const configPath = path.join(__dirname, '../../config.json');
    delete require.cache[require.resolve(configPath)];
    var config = require(configPath);

    const threadID = handleReply.threadID;
    const choice = event.body.toLowerCase().trim();

    if (["yes", "y", "approve", "হ্যাঁ", "1"].includes(choice)) {
      if (!config.APPROVAL.approvedGroups.includes(threadID)) {
        config.APPROVAL.approvedGroups.push(threadID);
      }
      config.APPROVAL.pendingGroups = config.APPROVAL.pendingGroups.filter(id => id !== threadID);
      config.APPROVAL.rejectedGroups = config.APPROVAL.rejectedGroups.filter(id => id !== threadID);

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      try {
        const info = await api.getThreadInfo(threadID);
        api.sendMessage(
`✅ এই গ্রুপে বট চালু হলো!

নাম: ${info.threadName}
মেম্বার: ${info.participantIDs.length} জন

এখন সব কমান্ড ব্যবহার করা যাবে।
/help লিখে দেখুন।`, threadID);
        api.sendMessage(`✅ "${info.threadName}" গ্রুপটি চালু হয়েছে!`, event.threadID, event.messageID);
      } catch {
        api.sendMessage(`✅ গ্রুপ চালু হয়েছে!`, event.threadID, event.messageID);
      }
    } else if (["no", "n", "reject", "না", "2"].includes(choice)) {
      if (!config.APPROVAL.rejectedGroups.includes(threadID)) {
        config.APPROVAL.rejectedGroups.push(threadID);
      }
      config.APPROVAL.pendingGroups = config.APPROVAL.pendingGroups.filter(id => id !== threadID);
      config.APPROVAL.approvedGroups = config.APPROVAL.approvedGroups.filter(id => id !== threadID);

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      try {
        const info = await api.getThreadInfo(threadID);
        api.sendMessage(
`❌ এই গ্রুপে বট চালু করা হয়নি।

নাম: ${info.threadName}

কোনো কমান্ড কাজ করবে না।`, threadID);
        api.sendMessage(`❌ "${info.threadName}" গ্রুপটি বাতিল হয়েছে!`, event.threadID, event.messageID);
      } catch {
        api.sendMessage(`❌ গ্রুপ বাতিল হয়েছে!`, event.threadID, event.messageID);
      }
    } else {
      api.sendMessage(`❓ লিখুন: ১ (চালু) বা ২ (বাতিল)`, event.threadID, event.messageID);
    }
  }
};