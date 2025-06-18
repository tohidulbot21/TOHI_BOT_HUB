
const axios = require('axios');
const picsartfordevelopers = require('@api/picsartfordevelopers');

module.exports.config = {
  name: "enhance",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "TOHI-BOT-HUB",
  description: "Enhance image quality using PicsArt AI",
  usePrefix: true,
  commandCategory: "image",
  usages: "[reply to image] [upscale_factor]",
  cooldowns: 10,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;

  // Check if user replied to an image
  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("❌ Please reply to an image to enhance it!", threadID, messageID);
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("❌ Please reply to a photo, not other file types!", threadID, messageID);
  }

  try {
    api.sendMessage("🔄 Processing your image enhancement... Please wait!", threadID, messageID);

    // Set up PicsArt API with your API key
    const PICSART_API_KEY = process.env.PICSART_API_KEY || "YOUR_PICSART_API_KEY";
    
    if (!PICSART_API_KEY || PICSART_API_KEY === "YOUR_PICSART_API_KEY") {
      return api.sendMessage("❌ PicsArt API key not configured. Please set PICSART_API_KEY in environment variables.", threadID, messageID);
    }

    // Configure PicsArt client
    picsartfordevelopers.auth(PICSART_API_KEY);

    // Get upscale factor from args or default to 2
    const upscaleFactor = args[0] && ['2', '4', '6', '8'].includes(args[0]) ? args[0] : '2';

    // Use PicsArt API to enhance the image
    const response = await picsartfordevelopers.imageUltraEnhance({
      image_url: attachment.url,
      upscale_factor: upscaleFactor,
      format: 'JPG'
    });

    if (response && response.data && response.data.url) {
      const enhancedImageUrl = response.data.url;
      
      // Download the enhanced image
      const imageResponse = await axios.get(enhancedImageUrl, { 
        responseType: 'stream',
        timeout: 30000 
      });
      
      // Send the enhanced image
      const form = {
        body: `✅ Image enhanced successfully!\n🔍 Upscale Factor: ${upscaleFactor}x\n⚡ Enhanced by PicsArt AI\n🚩 Made by TOHI-BOT-HUB`,
        attachment: imageResponse.data
      };

      return api.sendMessage(form, threadID, messageID);
      
    } else {
      throw new Error("No enhanced image URL received from API");
    }

  } catch (error) {
    console.error("PicsArt Enhancement Error:", error);
    
    let errorMessage = "❌ Failed to enhance image. ";
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage += "Invalid API key.";
          break;
        case 429:
          errorMessage += "Rate limit exceeded. Try again later.";
          break;
        case 400:
          errorMessage += "Invalid image or parameters.";
          break;
        default:
          errorMessage += `API Error: ${error.response.status}`;
      }
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      errorMessage += "Connection timeout. Please try again.";
    } else {
      errorMessage += "Please try again later.";
    }

    return api.sendMessage(errorMessage, threadID, messageID);
  }
};

module.exports.handleEvent = async function({ api, event }) {
  // Optional: Auto-enhance when someone sends an image (if enabled)
  // This can be implemented based on user preferences
};
