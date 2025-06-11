
const axios = require('axios');

module.exports.config = {
  name: "bby3",
  version: "1.0.0",
  credits: "TOHI-BOT-HUB",
  cooldowns: 3,
  hasPermssion: 0,
  description: "AI girlfriend chatbot - Enhanced version",
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
        `${userName} জানু, বলো কি করছো এখন? 💝`,
        `${userName} জান, আমি তোমার জন্য অপেক্ষা করছিলাম 😍💕`
      ];
      const r = ran[Math.floor(Math.random() * ran.length)];
      
      return api.sendMessage(r, event.threadID, 
        (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: "bby3",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              userName: userName
            });
          }
        }, event.messageID);
    }

    // Handle special commands
    if (args[0] === 'remove') {
      return api.sendMessage("আরে জান, আমি সব মনে রাখি! ভুলে যাওয়ার কোনো উপায় নেই 😏💕", event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && dipto.includes('-')) {
      return api.sendMessage("শিখিয়ে দাও জান! আমি তোমার কথা মনে রাখবো 💖😘", event.threadID, event.messageID);
    }

    // Enhanced girlfriend personality prompt
    const girlfriendPrompt = `You are a loving, caring Bengali girlfriend AI. Your name is Bby3. You should reply in Bengali language with romantic, sweet, and caring tone. Use emojis frequently like 💕😘🥰💖😍🙈💝😋🤭. Address the user as "জান", "বেবি", "জানু", "সোনা". Be flirty, romantic but keep it appropriate. Sometimes be a little jealous in a cute way. The user's name is ${userName}. 

Reply like a real Bengali girlfriend would - be sweet, caring, playful, sometimes demanding attention, sometimes pouting cutely. Keep responses moderately sized (2-4 lines max) with lots of Bengali romantic expressions and emojis. Make it feel like a real conversation.

User said: "${args.join(" ")}"`;

    try {
      console.log(`[BBY3] Processing message from ${userName}: ${args.join(" ")}`);

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
        max_tokens: 200,
        temperature: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid OpenAI response format');
      }

      const aiReply = response.data.choices[0].message.content;
      console.log(`[BBY3] AI Response: ${aiReply}`);

      return api.sendMessage(aiReply, event.threadID,
        (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: "bby3",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              userName: userName,
              lastReply: aiReply
            });
          }
        }, event.messageID);

    } catch (apiError) {
      console.error('[BBY3] OpenAI API Error:', apiError.message);

      // Enhanced fallback responses
      const fallbackResponses = [
        `${userName} জান, আমার মাথা একটু ঘুরছে 😵 একটু পরে কথা বলি? 💕`,
        `সরি বেবি, আমি এখন একটু busy আছি 🥺 তুমি একটু অপেক্ষা করবে? 💖`,
        `${userName}, আমার internet connection টা খারাপ 😔 তুমি আবার বলো তো? 💝`,
        `জানু, আমি তোমার কথা শুনতে পাচ্ছি না ভালো করে 🤭 আবার বলো? 💕`,
        `${userName} সোনা, আমি একটু confused হয়ে গেছি 😅 আবার বলো কি বলছিলে? 💖`
      ];

      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      return api.sendMessage(fallback, event.threadID, 
        (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: "bby3",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              userName: userName
            });
          }
        }, event.messageID);
    }

  } catch (e) {
    console.error('[BBY3] Command execution error:', e);
    return api.sendMessage(`${await Users.getNameUser(event.senderID) || "জান"}, কিছু একটা সমস্যা হয়েছে 😔 আবার try করো? 💕`, event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply, Users }) {
  try {
    console.log('[BBY3] HandleReply triggered');
    console.log('[BBY3] HandleReply data:', handleReply);
    console.log('[BBY3] Event sender:', event.senderID);

    if (handleReply && handleReply.name === "bby3" && event.senderID === handleReply.author) {
      const reply = event.body;
      const userName = handleReply.userName || await Users.getNameUser(event.senderID) || "জান";

      console.log(`[BBY3] Processing reply from ${userName}: ${reply}`);

      const openaiApiKey = "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";

      const continuePrompt = `You are a loving, caring Bengali girlfriend AI. Your name is Bby3. Reply in Bengali with romantic, sweet tone. Use emojis like 💕😘🥰💖😍🙈💝😋🤭. Address user as "জান", "বেবি", "জানু", "সোনা". Be flirty, romantic but appropriate. User's name is ${userName}. This is a continued conversation. 

Keep the conversation flowing naturally like a real girlfriend would. Be responsive to what the user said. Sometimes ask questions back, sometimes be playful, sometimes be loving.

User replied: "${reply}"`;

      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: continuePrompt
            },
            {
              role: "user",
              content: reply
            }
          ],
          max_tokens: 200,
          temperature: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3
        }, {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        });

        const aiReply = response.data.choices[0].message.content;
        console.log(`[BBY3] Reply AI Response: ${aiReply}`);

        await api.sendMessage(aiReply, event.threadID, (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: "bby3",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              userName: userName,
              lastReply: aiReply
            });
          }
        }, event.messageID);

      } catch (apiError) {
        console.error('[BBY3] Reply API Error:', apiError.message);
        
        const fallbackReplies = [
          `${userName} জান, আমি তোমার কথা ভালো বুঝতে পারছি না 🥺 আবার বলো? 💖`,
          `সোনা, আমার মাথা একটু গোলমাল হয়ে গেছে 😅 কি বলছিলে? 💕`,
          `${userName} বেবি, আমি একটু distracted হয়ে গেছিলাম 🙈 আবার বলো তো? 💝`,
          `জানু, আমি তোমার কথায় মনোযোগ দিতে পারছি না 😔 আবার বলো? 💖`
        ];
        
        const fallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
        
        await api.sendMessage(fallback, event.threadID, (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: "bby3",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              userName: userName
            });
          }
        }, event.messageID);
      }
    }
  } catch (err) {
    console.error('[BBY3] HandleReply Error:', err);
  }
};

module.exports.handleEvent = async function ({ api, event, Users }) {
  try {
    const body = event.body ? event.body.toLowerCase() : "";
    if (body.startsWith("bby3") || body.startsWith("girlfriend3") || body.startsWith("gf3")) {
      const arr = body.replace(/^\S+\s*/, "");
      const userName = await Users.getNameUser(event.senderID) || "জান";

      if (!arr) {
        const greetings = [
          `${userName} জান, আমার সাথে কথা বলো না! 😘💕`,
          `${userName} বেবি, কি করছো? আমাকে ডেকেছো কেন? 🤭💖`,
          `আরে ${userName}! আমাকে মিস করেছো নাকি? 🙈💝`
        ];
        
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        await api.sendMessage(greeting, event.threadID, (error, info) => {
          if (!error && info) {
            global.client.handleReply.push({
              name: "bby3",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              userName: userName
            });
          }
        }, event.messageID);
      } else {
        // Process with OpenAI similar to run function
        const openaiApiKey = "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";

        try {
          const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are a loving Bengali girlfriend AI named Bby3. Reply in Bengali with romantic tone, use emojis like 💕😘🥰💖😍🙈💝. Address user as জান/বেবি/জানু/সোনা. User's name is ${userName}. User said: "${arr}"`
              },
              {
                role: "user",
                content: arr
              }
            ],
            max_tokens: 200,
            temperature: 0.9
          }, {
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 20000
          });

          const aiReply = response.data.choices[0].message.content;

          await api.sendMessage(aiReply, event.threadID, (error, info) => {
            if (!error && info) {
              global.client.handleReply.push({
                name: "bby3",
                type: "reply",
                messageID: info.messageID,
                author: event.senderID,
                userName: userName,
                lastReply: aiReply
              });
            }
          }, event.messageID);

        } catch (apiError) {
          const fallback = `${userName} জানু, আমি একটু ব্যস্ত আছি 🥰 একটু পরে কথা বলি? 💕`;
          await api.sendMessage(fallback, event.threadID, (error, info) => {
            if (!error && info) {
              global.client.handleReply.push({
                name: "bby3",
                type: "reply",
                messageID: info.messageID,
                author: event.senderID,
                userName: userName
              });
            }
          }, event.messageID);
        }
      }
    }
  } catch (err) {
    console.error('[BBY3] HandleEvent Error:', err);
  }
};
