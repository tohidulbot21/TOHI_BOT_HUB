module.exports.config = {
  name: "automsg", // <-- Bot name!
  version: "1.0.0",
  permission: 0,
  credits: "TOHI-BOT-HUB", // 💎 Credit: TOHIDUL (Legendary) 💎
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

// Stylish and legendary auto-messaging engine
module.exports.onLoad = function ({ api }) {
  const logger = require("../../utils/log.js");

  setInterval(() => {
    try {
      const now = new Date();
      // Convert to Bangladesh time (UTC+6)
      const bdTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));
      const timeString = bdTime.toLocaleString('en-US', { 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC'
      });
      const currentTime = timeString;

      const timeMsg = timeMessages.find(msg => msg.timer === currentTime);

      if (timeMsg) {
        const randomMessage = timeMsg.message[Math.floor(Math.random() * timeMsg.message.length)];

        // Get approved groups from config
        const fs = require('fs');
        const path = require('path');
        const configPath = path.join(__dirname, '../../config.json');

        try {
          delete require.cache[require.resolve(configPath)];
          const config = require(configPath);

          let targetGroups = [];

          // Get all available groups
          if (global.data && global.data.allThreadID && global.data.allThreadID.length > 0) {
            targetGroups = global.data.allThreadID;
          } else if (config.AUTO_APPROVE && config.AUTO_APPROVE.approvedGroups && config.AUTO_APPROVE.approvedGroups.length > 0) {
            targetGroups = config.AUTO_APPROVE.approvedGroups;
          } else if (config.APPROVAL && config.APPROVAL.approvedGroups && config.APPROVAL.approvedGroups.length > 0) {
            targetGroups = config.APPROVAL.approvedGroups;
          }

          console.log(`[AUTO MSG DEBUG] Current time: ${currentTime}, Target groups: ${targetGroups.length}`);
          
          if (targetGroups && targetGroups.length > 0) {
            let successCount = 0;
            targetGroups.forEach(threadID => {
              try {
                api.sendMessage(
                  `━━━━━━━━━━ ★ ★ ★ ━━━━━━━━━━\n${randomMessage}\n━━━━━━━━━━ ★ ★ ★ ━━━━━━━━━━\n\n🤖 𝑩𝒐𝒕: TOHI-BOT \n🛠️ Made by TOHIDUL`,
                  threadID,
                  (error) => {
                    if (!error) successCount++;
                  }
                );
              } catch (sendError) {
                console.log(`[AUTO MSG] Send error for thread ${threadID}: ${sendError.message}`);
              }
            });
            logger.log(`Auto message sent to ${targetGroups.length} groups at ${currentTime} (${successCount} successful)`, "AUTO MSG");
          } else {
            console.log(`[AUTO MSG] No target groups found at ${currentTime}`);
          }
        } catch (configError) {
          logger.log(`Error reading config for auto message: ${configError.message}`, "ERROR");
        }
      }
    } catch (error) {
      logger.log(`Auto message error: ${error.message}`, "ERROR");
    }
  }, 30000); // Check every 30 seconds for better accuracy
  
  // Log startup
  logger.log("Auto message system initialized", "AUTO MSG");
};

module.exports.run = () => {};