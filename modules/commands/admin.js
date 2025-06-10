const fs = require("fs-extra");
const moment = require("moment-timezone");
const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "admin",
  version: "1.0.0",
  hasPermssion: 0,
  usePrefix:true,
  credits: "TOHI-BOT-HUB",
  description: "Show Bot Owner Info",
  commandCategory: "info",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { senderID } = event;
  
  // Check if user is admin (optional - remove this check if you want everyone to see admin info)
  // if (!global.config.ADMINBOT.includes(senderID)) {
  //   return api.sendMessage("❌ আপনার এই কমান্ড ব্যবহারের অনুমতি নেই!", event.threadID, event.messageID);
  // }

  const now = moment().tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm:ss A");
  const imageUrl = "https://i.postimg.cc/nhM2PPjW/admin.png";
  const imagePath = path.join(__dirname, "cache", `admin_${Date.now()}.png`);

  const ownerInfo =
    `╭─────〔 👑 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎 👑 〕─────╮\n` +
    `┃\n` +
    `┃ 🏷️ 𝗡𝗮𝗺𝗲       : 𝙏 𝙊 𝙃 𝙄 𝘿 𝙐 𝙇 ッ\n` +
    `┃ 👨‍💼 𝗚𝗲𝗻𝗱𝗲𝗿     : 𝗠𝗮𝗹𝗲\n` +
    `┃ 💖 𝗥𝗲𝗹𝗮𝘁𝗶𝗼𝗻   : 𝗦𝗶𝗻𝗴𝗹𝗲\n` +
    `┃ 🎂 𝗔𝗴𝗲         : 18+\n` +
    `┃ 🕌 𝗥𝗲𝗹𝗶𝗴𝗶𝗼𝗻    : 𝗜𝘀𝗹𝗮𝗺\n` +
    `┃ 🎓 𝗘𝗱𝘂𝗰𝗮𝘁𝗶𝗼𝗻  : 𝗜𝗻𝘁𝗲𝗿 1𝘀𝘁 𝗬𝗲𝗮𝗿\n` +
    `┃ 🏠 𝗔𝗱𝗱𝗿𝗲𝘀𝘀    : 𝗧𝗵𝗮𝗸𝘂𝗿𝗴𝗮𝗼𝗻, 𝗕𝗮𝗻𝗴𝗹𝗮𝗱𝗲𝘀𝗵\n` +
    `┃\n` +
    `┣━━━〔 🌐 𝗦𝗢𝗖𝗜𝗔𝗟 𝗟𝗜𝗡𝗞𝗦 〕━━━┫\n` +
    `┃ 🎭 TikTok    : -----------\n` +
    `┃ ✈️ Telegram  : https://t.me/NFTTOHIDUL19\n` +
    `┃ 🌍 Facebook  : https://www.facebook.com/profile.php?id=100092006324917\n` +
    `┃\n` +
    `┣━━━〔 ⏰ 𝗨𝗣𝗗𝗔𝗧𝗘𝗗 𝗧𝗜𝗠𝗘 〕━━━┫\n` +
    `┃ 🕒 ${now}\n` +
    `╰──────────────────────────────╯\n` +
    `💌 𝑪𝒓𝒆𝒂𝒕𝒆𝒅 𝒃𝒚 𝑻𝑶𝑯𝑰𝑫𝑼𝑳 𝑩𝑶𝑻`;

  try {
    // Download the image from URL
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream',
      timeout: 10000
    });

    // Ensure cache directory exists
    const cacheDir = path.dirname(imagePath);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Write image to cache
    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Send message with image and auto-cleanup
    return api.sendMessage({
      body: ownerInfo,
      attachment: fs.createReadStream(imagePath)
    }, event.threadID, () => {
      // Auto cleanup after sending
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log(`[ADMIN] Cleaned up cache file: ${imagePath}`);
        } catch (cleanupError) {
          console.log(`[ADMIN] Cache cleanup warning: ${cleanupError.message}`);
        }
      }
    });

  } catch (error) {
    console.error("[ADMIN] Error downloading image:", error.message);
    
    // Always try to send the text message even if image fails
    try {
      return api.sendMessage(ownerInfo + "\n\n[⛔] ছবি ডাউনলোড করতে সমস্যা হয়েছে!", event.threadID);
    } catch (sendError) {
      // Silent fail if even text message fails
      console.error("[ADMIN] Failed to send fallback message:", sendError.message);
    }
  }
};
