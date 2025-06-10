const { loadImage, createCanvas } = require('canvas');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports.config = {
  name: "queen",
  version: "1.0.0",
  hasPermssion: 0,
  usePrefix: true,
  credits: "TOHI-BOT-HUB",
  description: "Make a queen proposal image with avatars",
  commandCategory: "love",
  usages: "[tag]",
  cooldowns: 5,
  dependencies: {
    "canvas": "",
    "axios": "",
    "fs-extra": ""
  }
};

const QUEEN_BG_URL = "https://i.postimg.cc/vB55tT9V/king2.jpg";

module.exports.onLoad = async () => {
  const dirMaterial = __dirname + `/cache/canvas/`;
  if (!fs.existsSync(dirMaterial)) {
    fs.mkdirSync(dirMaterial, { recursive: true });
  }

  // Download queen background image if not exists
  const queenBgPath = dirMaterial + "queen_propose.png";
  if (!fs.existsSync(queenBgPath)) {
    console.log("[QUEEN] Downloading queen background image...");
    
    // Multiple fallback URLs
    const backgroundUrls = [
      "https://i.postimg.cc/vB55tT9V/king2.jpg",
      "",
      ""
    ];
    
    let downloaded = false;
    
    for (let i = 0; i < backgroundUrls.length && !downloaded; i++) {
      try {
        console.log(`[QUEEN] Trying URL ${i + 1}/${backgroundUrls.length}: ${backgroundUrls[i]}`);
        const response = await axios.get(backgroundUrls[i], { 
          responseType: 'stream',
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const writer = fs.createWriteStream(queenBgPath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        console.log("[QUEEN] Queen background image downloaded successfully from:", backgroundUrls[i]);
        downloaded = true;
        
      } catch (error) {
        console.log(`[QUEEN] Failed to download from URL ${i + 1}:`, error.message);
        if (i === backgroundUrls.length - 1) {
          console.log("[QUEEN] All download attempts failed. Creating fallback background...");
          // Create a simple colored background as fallback
          try {
            const { createCanvas } = require("canvas");
            const canvas = createCanvas(1023, 1024);
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = '#ff69b4';
            ctx.fillRect(0, 0, 1023, 1024);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(queenBgPath, buffer);
            console.log("[QUEEN] Fallback background created successfully");
          } catch (fallbackError) {
            console.log("[QUEEN] Failed to create fallback background:", fallbackError.message);
          }
        }
      }
    }
  }
};

async function downloadAvatar(userID, outputPath) {
  try {
    const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const response = await axios.get(avatarUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    fs.writeFileSync(outputPath, Buffer.from(response.data));
    return true;
  } catch (error) {
    console.log(`[QUEEN] Failed to download avatar for ${userID}:`, error.message);
    return false;
  }
}

function drawCircularImage(ctx, image, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, x, y, size, size);
  ctx.restore();
}

async function makeImage({ one, two }) {
  try {
    const __root = path.resolve(__dirname, "cache", "canvas");
    const backgroundPath = __root + "/queen_propose.png";
    const pathImg = __root + `/queen_${one}_${two}_${Date.now()}.png`;
    const avatarOnePath = __root + `/avt_${one}.png`;
    const avatarTwoPath = __root + `/avt_${two}.png`;

    // Check if background exists
    if (!fs.existsSync(backgroundPath)) {
      throw new Error("Queen background image not found. Please restart the bot to download it.");
    }

    // Download avatars
    console.log("[QUEEN] Downloading avatars...");
    const avatar1Success = await downloadAvatar(one, avatarOnePath);
    const avatar2Success = await downloadAvatar(two, avatarTwoPath);

    if (!avatar1Success || !avatar2Success) {
      throw new Error("Failed to download user avatars");
    }

    // Load images
    const background = await loadImage(backgroundPath);
    const avatar1 = await loadImage(avatarOnePath);
    const avatar2 = await loadImage(avatarTwoPath);

    // Create canvas (background = 1023x1024)
    const canvas = createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.drawImage(background, 0, 0, 1023, 1024);

    // Draw avatars as circles (custom positions)
    // avatar1: (276, 164), size: 130
    // avatar2: (640, 237), size: 152
    drawCircularImage(ctx, avatar1, 640, 237, Math.min(154, 152));
    drawCircularImage(ctx, avatar2, 276, 164, Math.min(130, 144));

    // Save the final image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(pathImg, buffer);

    // Clean up avatar files
    fs.unlinkSync(avatarOnePath);
    fs.unlinkSync(avatarTwoPath);

    return pathImg;
  } catch (error) {
    console.error("[QUEEN] Error creating image:", error.message);
    throw error;
  }
}

module.exports.run = async function ({ event, api, args }) {
  try {
    const { threadID, messageID, senderID } = event;

    // Get mentioned user
    const mention = Object.keys(event.mentions)[0];
    if (!mention) {
      return api.sendMessage("❌ Please tag someone to make the queen image with!\nExample: /queen @username", threadID, messageID);
    }

    const taggedName = event.mentions[mention].replace("@", "");

    // Check if user is trying to queen themselves
    if (mention === senderID) {
      return api.sendMessage("😅 You can't make yourself the queen! Tag someone else.", threadID, messageID);
    }

    // Send processing message
    const processingMsg = await api.sendMessage("👑 Creating your QUEEN image... Please wait!", threadID);

    try {
      // Create the queen image
      const imagePath = await makeImage({ one: senderID, two: mention });

      // Remove processing message
      await api.unsendMessage(processingMsg.messageID);

      // Send the queen proposal
      return api.sendMessage({
        body: `👑 ${taggedName}, you have been crowned as QUEEN by someone! 👑\n\n🌹 Made with love by TOHI-BOT-HUB 🌹`,
        mentions: [{
          tag: taggedName,
          id: mention
        }],
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => {
        // Clean up the image file
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }, messageID);
    } catch (imageError) {
      // Remove processing message
      await api.unsendMessage(processingMsg.messageID);

      console.error("[QUEEN] Image creation failed:", imageError.message);
      return api.sendMessage(
        "❌ **QUEEN Image Failed**\n\n" +
        "• Failed to create queen image\n" +
        "• Please try again later\n\n" +
        `🔧 **Error:** ${imageError.message}\n\n` +
        "🚩 **Made by TOHI-BOT-HUB**",
        threadID, messageID
      );
    }

  } catch (error) {
    console.error("[QUEEN] Main error:", error.message);
    return api.sendMessage(
      "❌ **System Error**\n\n" +
      "• An unexpected error occurred\n" +
      "• Please try again later\n\n" +
      `🔧 **Error:** ${error.message}\n\n` +
      "📞 **Contact:** Report this to bot admin\n" +
      "🚩 **Made by TOHI-BOT-HUB**",
      event.threadID, event.messageID
    );
  }
};