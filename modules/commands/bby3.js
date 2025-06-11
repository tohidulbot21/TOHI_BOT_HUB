
const axios = require('axios');

const baseApiUrl = async () => {
  const base = await axios.get(`https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`);
  return base.data.api;
};

module.exports.config = {
  name: "bby3",
  version: "1.0.0",
  credits: "TOHI-BOT-HUB",
  cooldowns: 3,
  hasPermssion: 0,
  description: "API girlfriend chatbot",
  commandCategory: "chat",
  category: "chat",
  usePrefix: false,
  prefix: false,
  usages: `[anyMessage] OR teach [YourMessage] - [Reply] OR remove [YourMessage]`,
};

module.exports.run = async function ({ api, event, args, Users }) {
  try {
    const link = `${await baseApiUrl()}/baby`;
    const dipto = args.join(" ").toLowerCase();
    const uid = event.senderID;
    const userName = await Users.getNameUser(uid) || "জান";

    // Add rate limiting
    const now = Date.now();
    if (!global.bby3CommandCooldown) global.bby3CommandCooldown = new Map();

    const lastUsed = global.bby3CommandCooldown.get(uid) || 0;
    if (now - lastUsed < 3000) { // 3 second cooldown
      return;
    }
    global.bby3CommandCooldown.set(uid, now);

    if (!args[0]) {
      const ran = [
        `হ্যালো ${userName} জান! 💕 আমার সাথে কথা বলতে চাও? 🥰`,
        `${userName}, তুমি কেমন আছো বেবি? 😘`,
        `আরে ${userName}! আমাকে মিস করেছো? 🙈💖`,
        `${userName} জানু, বলো কি করছো এখন? 💝`
      ];
      const r = ran[Math.floor(Math.random() * ran.length)];
      return api.sendMessage(r, event.threadID, (error, info) => {
        if (!error && info) {
          global.client.handleReply.push({
            name: "bby3",
            type: "reply",
            messageID: info.messageID,
            author: event.senderID,
            lnk: r
          });
        }
      }, event.messageID);
    }

    if (args[0] === 'remove') {
      const fina = dipto.replace("remove ", "");
      const respons = await axios.get(`${link}?remove=${fina}&senderID=${uid}`);
      return api.sendMessage(`${userName} জান, ${respons.data.message} 💕`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && dipto.includes('-')) {
      const [comd, command] = dipto.split(' - ');
      const final = comd.replace("teach ", "");
      if (!command || command.length < 2) {
        return api.sendMessage('❌ | Invalid format! Use teach [YourMessage] - [Reply1], [Reply2], [Reply3]...', event.threadID, event.messageID);
      }
      const re = await axios.get(`${link}?teach=${final}&reply=${command}&senderID=${uid}`);
      const name = await Users.getNameUser(re.data.teacher) || "";
      return api.sendMessage(`✅ ${userName} জান, আমি শিখে নিলাম! ${re.data.message} 💖\nTeacher: ${name || "unknown"}\nTeachs: ${re.data.teachs}`, event.threadID, event.messageID);
    }

    // If not any command, chat normally
    try {
      const response = await axios.get(`${link}?text=${encodeURIComponent(dipto)}&senderID=${uid}&font=1`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.data || !response.data.reply) {
        throw new Error('Invalid response format');
      }
      
      const reply = response.data.reply;
      
      // Add girlfriend style to the reply
      const girlfriendReply = `${reply} 💕`;
      
      return api.sendMessage(girlfriendReply, event.threadID,
        (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: "bby3",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              lnk: girlfriendReply,
              apiUrl: link
            });
          }
        }, event.messageID);
    } catch (apiError) {
      console.error('[BBY3] API Error:', apiError.message);
      const fallbackResponses = [
        `${userName} জান, আমার মাথা একটু ঘুরছে 😵 একটু পরে কথা বলি? 💕`,
        `সরি বেবি, আমি এখন একটু busy আছি 🥺 তুমি একটু অপেক্ষা করবে? 💖`,
        `${userName}, আমার internet connection টা খারাপ 😔 তুমি আবার বলো তো? 💝`
      ];
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return api.sendMessage(fallback, event.threadID, event.messageID);
    }

  } catch (e) {
    console.error('Error in BBY3 command execution:', e);
    return api.sendMessage(`${await Users.getNameUser(event.senderID) || "জান"}, কিছু একটা সমস্যা হয়েছে 😔 আবার try করো? 💕`, event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply, Users }) {
  try {
    if (handleReply && handleReply.name === "bby3" && event.senderID === handleReply.author) {
      const reply = event.body;
      const userName = await Users.getNameUser(event.senderID) || "জান";
      
      try {
        const link = `${await baseApiUrl()}/baby`;
        const response = await axios.get(`${link}?text=${encodeURIComponent(reply)}&senderID=${event.senderID}&font=1`, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.data || !response.data.reply) {
          throw new Error('Invalid API response');
        }
        
        const apiReply = response.data.reply;
        const girlfriendReply = `${userName} জান, ${apiReply} 💕`;
        
        await api.sendMessage(girlfriendReply, event.threadID, (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: "bby3",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              lnk: girlfriendReply
            });
          }
        }, event.messageID);
        
      } catch (apiError) {
        console.error('[BBY3] API Error in HandleReply:', apiError.message);
        const fallbackResponses = [
          `${userName} জান, আমার মাথা একটু ঘুরছে 😵 একটু পরে কথা বলি? 💕`,
          `${userName} জানু, আমি তোমার কথা ভালো বুঝতে পারছি না 🥺 আবার বলো? 💖`,
          `সরি ${userName}, আমি এখন একটু ব্যস্ত আছি 🤭 একটু পরে কথা বলি? 💝`
        ];
        const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        await api.sendMessage(fallback, event.threadID, event.messageID);
      }
    }
  } catch (err) {
    console.error('[BBY3] HandleReply Error:', err.message);
  }
};

module.exports.handleEvent = async function ({ api, event, Users }) {
  try {
    const body = event.body ? event.body.toLowerCase() : "";
    if (body.startsWith("bby3") || body.startsWith("girlfriend3") || body.startsWith("gf3")) {
      const arr = body.replace(/^\S+\s*/, "");
      const userName = await Users.getNameUser(event.senderID) || "জান";

      if (!arr) {
        await api.sendMessage(`${userName} জান, আমার সাথে কথা বলো না! 😘💕`, event.threadID, (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: "bby3",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID
            });
          }
        }, event.messageID);
      } else {
        const response = await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}&font=1`, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.data || !response.data.reply) {
          throw new Error('Invalid API response');
        }
        
        const apiReply = response.data.reply;
        const girlfriendReply = `${apiReply} 💕`;
        
        await api.sendMessage(girlfriendReply, event.threadID, (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: "bby3",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              lnk: girlfriendReply
            });
          }
        }, event.messageID);
      }
    }
  } catch (err) {
    console.error('[BBY3] HandleEvent Error:', err.message);
    // Don't send error messages for event handlers to avoid spam
  }
};
