
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "enhance",
    version: "2.0.0",
    author: "TOHI-BOT-HUB",
    countDown: 10,
    role: 0,
    usePrefix: true,
    shortDescription: "🚀 Ultra enhance your images with PicsArt API",
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
        `• Processing with PicsArt AI\n` +
        `• Please wait...`,
        event.threadID
      );

      try {
        // Direct API call to PicsArt Ultra Enhance
        const formData = new FormData();
        
        // Download image first
        const imageResponse = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000 
        });
        
        const imageBuffer = Buffer.from(imageResponse.data);
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        
        formData.append('image', blob, 'image.jpg');
        formData.append('upscale_factor', upscaleFactor.toString());
        formData.append('format', 'JPG');

        const enhanceResponse = await axios.post(
          'https://api.picsart.io/tools/1.0/upscale/enhance',
          formData,
          {
            headers: {
              'X-Picsart-API-Key': apiKey,
              'Content-Type': 'multipart/form-data'
            },
            timeout: 60000
          }
        );

        if (enhanceResponse.data?.data?.url) {
          const enhancedImageUrl = enhanceResponse.data.data.url;
          
          // Download enhanced image
          const cacheDir = path.join(__dirname, "cache");
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          
          const imagePath = path.join(cacheDir, `enhanced_${Date.now()}.jpg`);
          
          const finalImageResponse = await axios.get(enhancedImageUrl, {
            responseType: 'stream',
            timeout: 30000
          });

          const writeStream = fs.createWriteStream(imagePath);
          finalImageResponse.data.pipe(writeStream);

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
• Technology: PicsArt Ultra Enhance
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
        console.error('[ENHANCE] API Error:', apiError.response?.data || apiError.message);
        
        // Check for specific error types
        if (apiError.response?.status === 401) {
          return api.sendMessage(
            "❌ **Authentication Failed**\n\n" +
            "• Invalid API key\n" +
            "• Please check your PICSART_API_KEY in Secrets\n" +
            "• Get a valid API key from: https://picsart.io/developers/",
            event.threadID, event.messageID
          );
        } else if (apiError.response?.status === 402) {
          return api.sendMessage(
            "❌ **Credits Exhausted**\n\n" +
            "• Your PicsArt API credits are finished\n" +
            "• Please top up your credits at: https://picsart.io/developers/",
            event.threadID, event.messageID
          );
        } else if (apiError.response?.status === 429) {
          return api.sendMessage(
            "❌ **Rate Limit Exceeded**\n\n" +
            "• Too many requests\n" +
            "• Please wait a few minutes and try again",
            event.threadID, event.messageID
          );
        } else {
          return api.sendMessage(
            "❌ **Enhancement Failed**\n\n" +
            "• API processing error occurred\n" +
            "• Please try with a different image\n" +
            "• Make sure image is clear and not corrupted\n\n" +
            `🔧 **Error:** ${apiError.message}`,
            event.threadID, event.messageID
          );
        }
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
