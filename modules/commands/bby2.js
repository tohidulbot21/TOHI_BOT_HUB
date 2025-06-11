
const axios = require('axios');

module.exports.config = {
  name: "bby2",
  version: "1.0.0",
  credits: "TOHI-BOT-HUB",
  cooldowns: 3,
  hasPermssion: 0,
  description: "AI girlfriend chatbot powered by OpenAI",
  commandCategory: "chat",
  category: "chat",
  usePrefix: false,
  prefix: false,
  usages: `[anyMessage] OR teach [YourMessage] - [Reply] OR remove [YourMessage]`,
};

module.exports.run = async function ({ api, event, args, Users }) {
  try {
    const openaiApiKey = "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";
    const dipto = args.join(" ").toLowerCase();
    const uid = event.senderID;
    const userName = await Users.getNameUser(uid) || "জান";

    // Add rate limiting
    const now = Date.now();
    if (!global.bby2CommandCooldown) global.bby2CommandCooldown = new Map();
    
    const lastUsed = global.bby2CommandCooldown.get(uid) || 0;
    if (now - lastUsed < 3000) { // 3 second cooldown
      return;
    }
    global.bby2CommandCooldown.set(uid, now);

    if (!args[0]) {
      const ran = [
        `হ্যালো ${userName} জান! 💕 আমার সাথে কথা বলতে চাও? 🥰`,
        `${userName}, তুমি কেমন আছো বেবি? 😘`,
        `আরে ${userName}! আমাকে মিস করেছো? 🙈💖`,
        `${userName} জানু, বলো কি করছো এখন? 💝`
      ];
      const r = ran[Math.floor(Math.random() * ran.length)];
      return api.sendMessage(r, event.threadID, event.messageID);
    }

    // Handle special commands
    if (args[0] === 'remove') {
      return api.sendMessage("আরে জান, আমি সব মনে রাখি! ভুলে যাওয়ার কোনো উপায় নেই 😏💕", event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && dipto.includes('-')) {
      return api.sendMessage("শিখিয়ে দাও জান! আমি তোমার কথা মনে রাখবো 💖😘", event.threadID, event.messageID);
    }

    // Girlfriend personality prompt
    const girlfriendPrompt = `You are a loving, caring Bengali girlfriend AI. Your name is Bby. You should reply in Bengali language with romantic, sweet, and caring tone. Use emojis frequently. Address the user as "জান", "বেবি", "জানু" etc. Be flirty, romantic but keep it appropriate. The user's name is ${userName}. User said: "${args.join(" ")}"

Reply as a girlfriend would reply - be sweet, caring, sometimes playful, sometimes jealous in a cute way. Keep responses short and sweet with lots of Bengali romantic expressions and emojis.`;

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: girlfriendPrompt
          },
          {
            role: "user", 
            content: args.join(" ")
          }
        ],
        max_tokens: 150,
        temperature: 0.9
      }, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid OpenAI response format');
      }

      const aiReply = response.data.choices[0].message.content;
      
      return api.sendMessage(aiReply, event.threadID,
        (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: this.config.name,
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              lnk: aiReply
            });
          }
        }, event.messageID);

    } catch (apiError) {
      console.error('[BBY2] OpenAI API Error:', apiError.message);
      
      // Fallback responses if API fails
      const fallbackResponses = [
        `${userName} জান, আমার মাথা একটু ঘুরছে 😵 একটু পরে কথা বলি? 💕`,
        `সরি বেবি, আমি এখন একটু busy আছি 🥺 তুমি একটু অপেক্ষা করবে? 💖`,
        `${userName}, আমার internet connection টা খারাপ 😔 তুমি আবার বলো তো? 💝`,
        `জানু, আমি তোমার কথা শুনতে পাচ্ছি না ভালো করে 🤭 আবার বলো? 💕`
      ];
      
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return api.sendMessage(fallback, event.threadID, event.messageID);
    }

  } catch (e) {
    console.error('Error in BBY2 command execution:', e);
    return api.sendMessage(`${await Users.getNameUser(event.senderID) || "জান"}, কিছু একটা সমস্যা হয়েছে 😔 আবার try করো? 💕`, event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  try {
    if (event.type == "message_reply") {
      const reply = event.body;
      const userName = await api.getUserInfo(event.senderID).then(info => info[event.senderID].name) || "জান";
      
      const openaiApiKey = "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";
      
      const girlfriendPrompt = `You are a loving, caring Bengali girlfriend AI. Your name is Bby. Reply in Bengali with romantic, sweet tone. Use emojis. Address user as "জান", "বেবি", "জানু". Be flirty, romantic but appropriate. User's name is ${userName}. This is a continued conversation. User replied: "${reply}"`;

      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: girlfriendPrompt
            },
            {
              role: "user",
              content: reply
            }
          ],
          max_tokens: 150,
          temperature: 0.9
        }, {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });

        const aiReply = response.data.choices[0].message.content;
        
        await api.sendMessage(aiReply, event.threadID, (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: this.config.name,
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              lnk: aiReply
            });
          }
        }, event.messageID);

      } catch (apiError) {
        const fallback = `${userName} জান, আমি তোমার কথা ভালো বুঝতে পারছি না 🥺 আবার বলো? 💖`;
        await api.sendMessage(fallback, event.threadID, event.messageID);
      }
    }
  } catch (err) {
    console.error('[BBY2] HandleReply Error:', err.message);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const body = event.body ? event.body.toLowerCase() : "";
    if (body.startsWith("bby2") || body.startsWith("girlfriend") || body.startsWith("gf")) {
      const arr = body.replace(/^\S+\s*/, "");
      const userName = await api.getUserInfo(event.senderID).then(info => info[event.senderID].name) || "জান";
      
      if (!arr) {
        await api.sendMessage(`${userName} জান, আমার সাথে কথা বলো না! 😘💕`, event.threadID, (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: this.config.name,
              type: "reply",
              messageID: info.messageID,
              author: event.senderID
            });
          }
        }, event.messageID);
      } else {
        // Process with OpenAI here similar to run function
        const openaiApiKey = "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";
        
        try {
          const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are a loving Bengali girlfriend AI named Bby. Reply in Bengali with romantic tone, use emojis. Address user as জান/বেবি/জানু. User's name is ${userName}. User said: "${arr}"`
              },
              {
                role: "user",
                content: arr
              }
            ],
            max_tokens: 150,
            temperature: 0.9
          }, {
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          });

          const aiReply = response.data.choices[0].message.content;
          
          await api.sendMessage(aiReply, event.threadID, (error, info) => {
            if (!error && info) {
              global.client.handleReply.push({
                name: this.config.name,
                type: "reply",
                messageID: info.messageID,
                author: event.senderID,
                lnk: aiReply
              });
            }
          }, event.messageID);

        } catch (apiError) {
          const fallback = `${userName} জানু, আমি একটু ব্যস্ত আছি 🥰 একটু পরে কথা বলি? 💕`;
          await api.sendMessage(fallback, event.threadID, event.messageID);
        }
      }
    }
  } catch (err) {
    console.error('[BBY2] HandleEvent Error:', err.message);
  }
};
