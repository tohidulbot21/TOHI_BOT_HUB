
module.exports.config = {
  name: "automsg",
  version: "2.0.0",
  permission: 0,
  credits: "TOHI-BOT-HUB",
  description: "Legendary stylish Bangla auto time messages by TOHIDUL",
  usePrefix: true,
  commandCategory: "automsg",
  usages: "none",
  cooldowns: 5,
  dependencies: {}
};

// Stylish and legendary auto time messages!
const timeMessages = [
  { timer: "12:00:00 AM", message: ["🌙✨ এখন রাত ১২টা বাজে, কিছু কিছু মানুষ chrome a ঢুকছে😩\n\n🕛 𝓛𝓮𝓰𝓮𝓷𝓭𝓪𝓻𝔂 𝓝𝓲𝓰𝓱𝓽 𝓥𝓲𝓫𝓮𝓼 ✨"] },
  { timer: "1:00:00 AM", message: ["🌙 এখন রাত ১টা বেজে গেলো, সবার কাজ হয়ে গেলো😒🤟\n\n🦉 𝓛𝓪𝓽𝓮 𝓝𝓲𝓰𝓱𝓽 𝓜𝓸𝓸𝓭..."] },
  { timer: "2:00:00 AM", message: ["🌙 এখন রাত ২টা বাজে, সবাই মনে হয় ঘুমায় গেছে নাকি কাজ করতাসে😛\n\n🌌 𝓝𝓲𝓰𝓱𝓽 𝓖𝓻𝓲𝓷𝓭𝓮𝓻𝓼"] },
  { timer: "3:00:00 AM", message: ["🌙 এখন রাত ৩টা বাজে, যারা প্রেম করে তারা জেগে আসে 🤭🤭\n\n💘 𝓛𝓸𝓿𝓮𝓻𝓼' 𝓗𝓸𝓾𝓻"] },
  { timer: "4:00:00 AM", message: ["🌙 এখন রাত ৪টা বাজে, কিছু মানুষ প্রেম করে😩 কিছু মানুষ ঘুমায়😑 আমি শুধু জেগে আসি😶\n\n🌃 𝓝𝓲𝓰𝓱𝓽 𝓞𝔀𝓵"] },
  { timer: "5:00:00 AM", message: ["🕌 এখন রাত ৫টা বাজে, একটু পর ফজরের আযান দিবে, নামাজ পড়ে নিও সবাই\n\n✨ 𝓢𝓹𝓲𝓻𝓲𝓽𝓾𝓪𝓵 𝓣𝓲𝓶𝓮"] },
  { timer: "6:00:00 AM", message: ["🌄 এখন সকাল ৬টা বাজে, সবাই নামাজ পড়ছো তো?🤨 না পড়লে পরে নাও ok🤗\n\n🕊️ 𝓟𝓮𝓪𝓬𝓮 𝓶𝓸𝓻𝓷𝓲𝓷𝓰"] },
  { timer: "7:00:00 AM", message: ["🌅 এখন সকাল ৭টা বাজে, ঘুম থেকে উঠো সবাই, আর পড়তে বসো😾😾\n\n📚 𝓢𝓽𝓾𝓭𝔂 𝓣𝓲𝓶𝓮"] },
  { timer: "8:00:00 AM", message: ["☀️ এখন সকাল ৮টা বাজে, সবাই দাত মেজে, ব্রেকফাস্ট করে নাও!😒😊\n\n🍞 𝓑𝓻𝓮𝓪𝓴𝓯𝓪𝓼𝓽 𝓒𝓵𝓾𝓫"] },
  { timer: "9:00:00 AM", message: ["🏫 এখন সকাল ৯টা বাজে, সবার স্কুল-কলেজ এর সময় হইসে হয়তো, চলে যেও কিন্তূ 🤗\n\n🚌 𝓢𝓬𝓱𝓸𝓸𝓵 𝓣𝓻𝓪𝓬𝓴"] },
  { timer: "10:00:00 AM", message: ["📖 এখন সকাল ১০টা বাজে, মন দিয়ে কাজ ও পড়াশুনা করো সবাই🤗❤️\n\n🧠 𝓕𝓸𝓬𝓾𝓼 𝓶𝓸𝓭𝓮"] },
  { timer: "11:00:00 AM", message: ["🥺 এখন সকাল ১১টা বাজে, মিস করছি তোমাদের🥺 কখন আসবে তুমরা🥺\n\n🤗 𝓕𝓻𝓲𝓮𝓷𝓭𝓼' 𝓜𝓸𝓶𝓮𝓷𝓽"] },
  { timer: "12:00:00 PM", message: ["🏫 এখন দুপুর ১২টা বাজে, বাচ্চাদের স্কুল শেষ হয়ে গেসে হয়তো\n\n🎒 𝓢𝓬𝓱𝓸𝓸𝓵 𝓔𝓷𝓭"] },
  { timer: "1:00:00 PM", message: ["🍛 এখন দুপুর ১টা বাজে, সবাই বাসায় যাও🤗 ❤️\n\n🏠 𝓗𝓸𝓶𝓮 𝓣𝓲𝓶𝓮"] },
  { timer: "2:00:00 PM", message: ["🚿 এখন দুপুর ২টা বাজে, সবাই কাজ বন্ধ করে, গোসল করে নাও 😒\n\n🛁 𝓡𝓮𝓯𝓻𝓮𝓼𝓱 𝓨𝓸𝓾𝓻𝓼𝓮𝓵𝓯"] },
  { timer: "3:00:00 PM", message: ["🍽️ এখন দুপুর ৩টা বাজে, সবাই দুপুরের খাবার খেয়ে নাও 🥰\n\n😋 𝓛𝓾𝓷𝓬𝓱 𝓣𝓲𝓶𝓮"] },
  { timer: "4:00:00 PM", message: ["😴 এখন বিকাল ৪টা বাজে, সবাই একটু ঘুমাও\n\n💤 𝓝𝓪𝓹 𝓞'𝓬𝓵𝓸𝓬𝓴"] },
  { timer: "5:00:00 PM", message: ["🕌 এখন বিকাল ৫টা বাজে, আসরের আযান দিলে, সবাই নামাজ পড়ে নিও 🥀\n\n🙏 𝓟𝓻𝓪𝔂𝓮𝓻 𝓣𝓲𝓶𝓮"] },
  { timer: "6:00:00 PM", message: ["⚽ এখন সন্ধ্যা ৬টা বাজে, কেউ খেলা ধুলা করলে মাঠে যাও😻\n\n🏆 𝓖𝓪𝓶𝓮 𝓣𝓲𝓶𝓮"] },
  { timer: "7:00:00 PM", message: ["🍽️ এখন সন্ধ্যা ৭টা বাজে, সবাই হাতমুখ ধুয়ে কিছু খেয়ে নাও এবং পরিবারের সাথে সময় কাটাও😍\n\n👨‍👩‍👧‍👦 𝓕𝓪𝓶𝓲𝓵𝔂 𝓣𝓲𝓶𝓮"] },
  { timer: "8:00:00 PM", message: ["🕌 এখন রাত ৮টা বাজে, সবাই এখন মাগরিবের নামাজ পড়ে নাও🤗🤗\n\n✨ 𝓔𝓿𝓮𝓷𝓲𝓷𝓰 𝓥𝓲𝓫𝓮𝓼"] },
  { timer: "9:00:00 PM", message: ["📚 এখন রাত ৯টা বাজে, একটু পড়তে বসো সবাই\n\n📝 𝓢𝓽𝓾𝓭𝔂 𝓞𝓷!"] },
  { timer: "10:00:00 PM", message: ["🌙 এখন রাত ১০টা বাজে, সবাই কি শুয়ে পড়লা??, গ্রুপ এ আসো সবাই🙂\n\n🌃 𝓝𝓲𝓰𝓱𝓽 𝓖𝓪𝓽𝓱𝓮𝓻𝓲𝓷𝓰"] },
  { timer: "11:00:00 PM", message: ["😴 এখন রাত ১১টা বাজে, সবাই আড্ডা দিতাসে, আমার বউ নাই ভাই 🥺 ঘুম ও আসে না😭 আড্ডা ও দিতে পারি না🥺 কি জ্বালা\n\n💔 𝓢𝓪𝓭 𝓝𝓲𝓰𝓱𝓽"] },
];

let autoMsgInterval = null;

module.exports.onLoad = function ({ api }) {
  const logger = require("../../utils/log.js");
  
  // Clear any existing interval
  if (autoMsgInterval) {
    clearInterval(autoMsgInterval);
  }
  
  autoMsgInterval = setInterval(async () => {
    try {
      // Get current Bangladesh time
      const now = new Date();
      const bdTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));
      
      // Format time to match our timer format
      const timeString = bdTime.toLocaleTimeString('en-US', { 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC'
      });

      // Find matching time message
      const timeMsg = timeMessages.find(msg => msg.timer === timeString);

      if (timeMsg) {
        const randomMessage = timeMsg.message[Math.floor(Math.random() * timeMsg.message.length)];
        
        // Get target groups - try multiple sources
        let targetGroups = [];
        
        try {
          // Method 1: Get from global data
          if (global.data && global.data.allThreadID && Array.isArray(global.data.allThreadID)) {
            targetGroups = global.data.allThreadID.filter(id => id && id.toString().length > 10);
          }
          
          // Method 2: Get from config if global data is empty
          if (targetGroups.length === 0) {
            const fs = require('fs');
            const path = require('path');
            const configPath = path.join(__dirname, '../../config.json');
            
            if (fs.existsSync(configPath)) {
              delete require.cache[require.resolve(configPath)];
              const config = require(configPath);
              
              if (config.APPROVAL && config.APPROVAL.approvedGroups && Array.isArray(config.APPROVAL.approvedGroups)) {
                targetGroups = config.APPROVAL.approvedGroups.filter(id => id && id.toString().length > 10);
              }
            }
          }
          
          // Method 3: Get active threads from API if still empty
          if (targetGroups.length === 0) {
            try {
              const threadList = await api.getThreadList(25, null, ['INBOX']);
              targetGroups = threadList
                .filter(thread => thread.isGroup && thread.threadID)
                .map(thread => thread.threadID);
            } catch (apiError) {
              console.log('[AUTO MSG] API Error:', apiError.message);
            }
          }

          console.log(`[AUTO MSG] Time: ${timeString}, Target groups: ${targetGroups.length}`);
          
          if (targetGroups.length > 0) {
            let successCount = 0;
            const finalMessage = `━━━━━━━━━━ ★ ★ ★ ━━━━━━━━━━\n${randomMessage}\n━━━━━━━━━━ ★ ★ ★ ━━━━━━━━━━\n\n🤖 𝑩𝒐𝒕: TOHI-BOT \n🛠️ Made by TOHIDUL`;
            
            // Send to all target groups with delay
            for (let i = 0; i < targetGroups.length; i++) {
              const threadID = targetGroups[i];
              
              try {
                await new Promise((resolve) => {
                  api.sendMessage(finalMessage, threadID, (error) => {
                    if (!error) {
                      successCount++;
                    }
                    resolve();
                  });
                });
                
                // Add small delay between sends to avoid rate limiting
                if (i < targetGroups.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              } catch (sendError) {
                console.log(`[AUTO MSG] Send error for thread ${threadID}: ${sendError.message}`);
              }
            }
            
            logger.log(`Auto message sent to ${targetGroups.length} groups at ${timeString} (${successCount} successful)`, "AUTO MSG");
          } else {
            console.log(`[AUTO MSG] No target groups found at ${timeString}`);
          }
          
        } catch (error) {
          logger.log(`Auto message error: ${error.message}`, "ERROR");
        }
      }
    } catch (mainError) {
      console.log(`[AUTO MSG] Main error: ${mainError.message}`);
    }
  }, 30000); // Check every 30 seconds
  
  logger.log("Auto message system initialized and running", "AUTO MSG");
};

// Manual command to test
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  
  if (args[0] === "test") {
    const testMessage = timeMessages[Math.floor(Math.random() * timeMessages.length)];
    const finalMessage = `━━━━━━━━━━ ★ ★ ★ ━━━━━━━━━━\n${testMessage.message[0]}\n━━━━━━━━━━ ★ ★ ★ ━━━━━━━━━━\n\n🤖 𝑩𝒐𝒕: TOHI-BOT \n🛠️ Made by TOHIDUL\n\n⏰ Test Message`;
    
    return api.sendMessage(finalMessage, threadID, messageID);
  }
  
  return api.sendMessage("🤖 Auto message system is running!\n\n📝 Commands:\n- /automsg test - Test a random message\n\n⏰ Messages are sent automatically every hour", threadID, messageID);
};
