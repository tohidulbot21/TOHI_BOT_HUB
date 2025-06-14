
const picsartfordevelopers = require('@api/picsartfordevelopers');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
  config: {
    name: "enhance",
    version: "1.0.0",
    author: "TOHI-BOT-HUB",
    countDown: 10,
    role: 0,
    usePrefix: true,
    shortDescription: "🚀 Ultra enhance your images with AI",
    longDescription: "Enhance image quality using PicsArt Ultra Enhance API",
    category: "image",
    commandCategory: "image",
    guide: {
      en: "{p}{n} [reply to image] [upscale_factor: 2-16]"
    }
  },

  onStart: async function ({ message, args, event, api }) {
    try {
      // Check for API key
      const apiKey = process.env.PICSART_API_KEY;
      if (!apiKey) {
        return api.sendMessage(
          "❌ **API Key Missing!**\n\n" +
          "• Please add your PicsArt API key to Secrets\n" +
          "• Key name: `PICSART_API_KEY`\n" +
          "• Get your API key from: https://picsart.io/developers/",
          event.threadID, event.messageID
        );
      }

      // Configure PicsArt SDK
      picsartfordevelopers.auth(apiKey);

      let imageUrl = "";
      let upscaleFactor = parseInt(args[0]) || 2;

      // Validate upscale factor
      if (upscaleFactor < 2 || upscaleFactor > 16) {
        return api.sendMessage(
          "❌ **Invalid Upscale Factor**\n\n" +
          "• Please use a value between 2-16\n" +
          "• Example: `/enhance 4` (for 4x upscaling)",
          event.threadID, event.messageID
        );
      }

      // Check for replied image
      if (event.type === "message_reply" && event.messageReply.attachments?.length > 0) {
        const attachment = event.messageReply.attachments[0];
        if (attachment.type === "photo") {
          imageUrl = attachment.url;
        }
      }

      if (!imageUrl) {
        return api.sendMessage(
          "❌ **No Image Found**\n\n" +
          "• Please reply to an image\n" +
          "• Usage: `/enhance [upscale_factor]`\n" +
          "• Example: `/enhance 4`",
          event.threadID, event.messageID
        );
      }

      // Send processing message
      const processingMsg = await api.sendMessage(
        `🚀 **Ultra Enhancing Image...**\n\n` +
        `• Upscale Factor: ${upscaleFactor}x\n` +
        `• Processing with AI technology\n` +
        `• Please wait...`,
        event.threadID
      );

      try {
        // Call PicsArt Ultra Enhance API
        const response = await picsartfordevelopers.imageUltraEnhance({
          image: imageUrl,
          upscale_factor: upscaleFactor.toString(),
          format: 'JPG'
        });

        if (response.data?.data?.url) {
          const enhancedImageUrl = response.data.data.url;
          
          // Download enhanced image
          const cacheDir = path.join(__dirname, "cache");
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          
          const imagePath = path.join(cacheDir, `enhanced_${Date.now()}.jpg`);
          
          const imageResponse = await axios.get(enhancedImageUrl, {
            responseType: 'stream',
            timeout: 30000
          });

          const writeStream = fs.createWriteStream(imagePath);
          imageResponse.data.pipe(writeStream);

          await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          });

          // Unsend processing message
          await api.unsendMessage(processingMsg.messageID);

          // Send enhanced image
          const successMessage = `
╔══════════════════════════════╗
  🚀 **ULTRA ENHANCE COMPLETE** 🚀
╚══════════════════════════════╝

✨ **Enhancement Details:**
• Upscale Factor: ${upscaleFactor}x
• Technology: AI Ultra Enhance
• Quality: Professional Grade

🎯 **Powered by PicsArt API**
          `;

          await api.sendMessage({
            body: successMessage,
            attachment: fs.createReadStream(imagePath)
          }, event.threadID, event.messageID);

          // Clean up
          setTimeout(() => {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          }, 10000);

        } else {
          throw new Error('Invalid API response');
        }

      } catch (apiError) {
        await api.unsendMessage(processingMsg.messageID);
        console.error('[ENHANCE] API Error:', apiError);
        
        return api.sendMessage(
          "❌ **Enhancement Failed**\n\n" +
          "• API processing error occurred\n" +
          "• Please try with a different image\n" +
          "• Make sure your API key is valid\n\n" +
          `🔧 **Error:** ${apiError.message}`,
          event.threadID, event.messageID
        );
      }

    } catch (error) {
      console.error('[ENHANCE] Main error:', error);
      return api.sendMessage(
        "❌ **System Error**\n\n" +
        "• An unexpected error occurred\n" +
        "• Please try again later\n\n" +
        `🔧 **Error:** ${error.message}`,
        event.threadID, event.messageID
      );
    }
  }
};
