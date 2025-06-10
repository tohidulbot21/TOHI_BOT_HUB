
const { loadImage, createCanvas } = require('canvas');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports.config = {
  name: "propose",
  version: "1.0.1",
  hasPermssion: 0,
  usePrefix: true,
  credits: "TOHI-BOT-HUB",
  description: "Propose to someone with a beautiful image",
  commandCategory: "love",
  usages: "[tag]",
  cooldowns: 5,
  dependencies: {
    "canvas": "",
    "axios": "",
    "fs-extra": ""
  }
};

module.exports.onLoad = async () => {
  const dirMaterial = __dirname + `/cache/canvas/`;
  if (!fs.existsSync(dirMaterial)) {
    fs.mkdirSync(dirMaterial, { recursive: true });
  }
  
  // Download background image if not exists
  if (!fs.existsSync(dirMaterial + "totinh.png")) {
    try {
      console.log("[PROPOSE] Downloading background image...");
      const backgroundUrls = [
        "https://i.imgur.com/AC7pnk1.jpg",
        "https://i.ibb.co/9ZQX8Kp/propose-bg.png",
        "https://i.imgur.com/ep1gG3r.png"
      ];
      
      let downloaded = false;
      for (let i = 0; i < backgroundUrls.length && !downloaded; i++) {
        try {
          const response = await axios.get(backgroundUrls[i], { 
            responseType: 'stream',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          const writer = fs.createWriteStream(dirMaterial + "totinh.png");
          response.data.pipe(writer);
          
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          
          console.log("[PROPOSE] Background image downloaded successfully");
          downloaded = true;
        } catch (error) {
          console.log(`[PROPOSE] Failed to download from URL ${i + 1}: ${error.message}`);
        }
      }
      
      if (!downloaded) {
        console.log("[PROPOSE] All download attempts failed, command may not work properly");
      }
    } catch (error) {
      console.log("[PROPOSE] Error setting up background:", error.message);
    }
  }
};

async function downloadAvatar(userID, outputPath) {
  try {
    const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const response = await axios.get(avatarUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    fs.writeFileSync(outputPath, Buffer.from(response.data));
    return true;
  } catch (error) {
    console.log(`[PROPOSE] Failed to download avatar for ${userID}:`, error.message);
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
    const backgroundPath = __root + "/totinh.png";
    const pathImg = __root + `/propose_${one}_${two}_${Date.now()}.png`;
    const avatarOnePath = __root + `/avt_${one}.png`;
    const avatarTwoPath = __root + `/avt_${two}.png`;

    // Check if background exists
    if (!fs.existsSync(backgroundPath)) {
      throw new Error("Background image not found. Please restart the bot to download it.");
    }

    // Download avatars
    console.log("[PROPOSE] Downloading avatars...");
    const avatar1Success = await downloadAvatar(one, avatarOnePath);
    const avatar2Success = await downloadAvatar(two, avatarTwoPath);

    if (!avatar1Success || !avatar2Success) {
      throw new Error("Failed to download user avatars");
    }

    // Load images
    const background = await loadImage(backgroundPath);
    const avatar1 = await loadImage(avatarOnePath);
    const avatar2 = await loadImage(avatarTwoPath);

    // Create canvas
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Draw avatars as circles
    // Left avatar (proposer)
    drawCircularImage(ctx, avatar1, 112, 81, 155, 164);
    
    // Right avatar (proposed to)
    drawCircularImage(ctx, avatar2, 513, 142, 138, 184);

    // Save the final image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(pathImg, buffer);

    // Clean up avatar files
    fs.unlinkSync(avatarOnePath);
    fs.unlinkSync(avatarTwoPath);

    return pathImg;
  } catch (error) {
    console.error("[PROPOSE] Error creating image:", error.message);
    throw error;
  }
}

module.exports.run = async function ({ event, api, args, Users }) {
  try {
    const { threadID, messageID, senderID } = event;
    
    // Get mentioned user
    const mention = Object.keys(event.mentions)[0];
    if (!mention) {
      return api.sendMessage("❌ Please tag someone to propose to!\nExample: /propose @username", threadID, messageID);
    }

    const taggedName = event.mentions[mention].replace("@", "");
    
    // Check if user is trying to propose to themselves
    if (mention === senderID) {
      return api.sendMessage("😅 You can't propose to yourself! Tag someone else.", threadID, messageID);
    }

    // Send processing message
    const processingMsg = await api.sendMessage("💖 Creating your proposal... Please wait!", threadID);

    try {
      // Create the proposal image
      const imagePath = await makeImage({ one: senderID, two: mention });
      
      // Remove processing message
      await api.unsendMessage(processingMsg.messageID);
      
      // Send the proposal
      return api.sendMessage({
        body: `💕 ${taggedName}, someone has a special question for you! 💕\n\n"Will you be mine? 💖"\n\n🌹 Made with love by TOHI-BOT-HUB 🌹`,
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
      
      console.error("[PROPOSE] Image creation failed:", imageError.message);
      return api.sendMessage(
        "❌ **Proposal Failed**\n\n" +
        "• Failed to create proposal image\n" +
        "• Please try again later\n\n" +
        `🔧 **Error:** ${imageError.message}\n\n` +
        "🚩 **Made by TOHI-BOT-HUB**",
        threadID, messageID
      );
    }
    
  } catch (error) {
    console.error("[PROPOSE] Main error:", error.message);
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
