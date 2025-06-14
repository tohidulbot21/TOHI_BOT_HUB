const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "enhance",
    version: "3.0.0",
    author: "Made by Tohidul",
    countDown: 10,
    role: 0,
    usePrefix: true,
    shortDescription: "🚀 Enhance images with multiple resolutions",
    longDescription: "Enhance image quality with 2K, 4K, 8K, 16K options using PicsArt API",
    category: "image",
    commandCategory: "image",
    guide: {
      en: "{p}{n} [reply to image] [2k/4k/8k/16k]"
    }
  },

  onStart: async function ({ message, args, event, api }) {
    try {
      const apiKey = process.env.PICSART_API_KEY;
      if (!apiKey) {
        return api.sendMessage(
          "❌ PicsArt API key missing!\nAdd PICSART_API_KEY to Secrets",
          event.threadID, event.messageID
        );
      }

      let imageUrl = "";
      let resolution = args[0]?.toLowerCase() || "4k";

      // Map resolution to upscale factor
      const resolutionMap = {
        "2k": 2,
        "4k": 4,
        "8k": 8,
        "16k": 16
      };

      let upscaleFactor = resolutionMap[resolution];

      if (!upscaleFactor) {
        return api.sendMessage(
          "❌ Invalid resolution!\nUse: 2k, 4k, 8k, or 16k\nExample: /enhance 4k",
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
          "❌ Reply to an image!\nUsage: /enhance [2k/4k/8k/16k]",
          event.threadID, event.messageID
        );
      }

      // Send processing message
      const processingMsg = await api.sendMessage(
        `🚀 Enhancing to ${resolution.toUpperCase()}...\nPlease wait...`,
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

          const imagePath = path.join(cacheDir, `enhanced_${resolution}_${Date.now()}.jpg`);

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
          const successMessage = `✨ Enhanced to ${resolution.toUpperCase()} successfully!\n🎯 Made by Tohidul`;

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
            "❌ Invalid API key!\nCheck PICSART_API_KEY in Secrets",
            event.threadID, event.messageID
          );
        } else if (apiError.response?.status === 402) {
          return api.sendMessage(
            "❌ API credits exhausted!\nTop up at: https://picsart.io/developers/",
            event.threadID, event.messageID
          );
        } else if (apiError.response?.status === 429) {
          return api.sendMessage(
            "❌ Rate limit exceeded!\nWait a few minutes and try again",
            event.threadID, event.messageID
          );
        } else if (apiError.response?.data?.code === 403116) {
          return api.sendMessage(
            `❌ Image too large for ${resolution.toUpperCase()}!\nTry a smaller image or lower resolution`,
            event.threadID, event.messageID
          );
        } else {
          return api.sendMessage(
            `❌ Enhancement failed!\nTry with a different image\nError: ${apiError.message}`,
            event.threadID, event.messageID
          );
        }
      }

    } catch (error) {
      console.error('[ENHANCE] Main error:', error);
      return api.sendMessage(
        `❌ System error!\nPlease try again later\nError: ${error.message}`,
        event.threadID, event.messageID
      );
    }
  }
};