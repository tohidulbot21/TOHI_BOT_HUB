const axios = require('axios');

module.exports = {
  config: {
    name: "4k",
    usePrefix: true,
    aliases: ["4k", "remini", "upscale"],
    version: "2.0",
    author: "JARiF",
    countDown: 15,
    role: 0,
    longDescription: "Upscale your image using multiple API endpoints.",
    category: "image",
    commandCategory: "image edit",
    guide: {
      en: "{pn} reply to an image"
    }
  },

  onStart: async function ({ message, args, event, api }) {
    const { threadID, messageID } = event;

    const getImageUrl = () => {
      if (event.type === "message_reply") {
        const replyAttachment = event.messageReply.attachments[0];
        if (["photo", "sticker"].includes(replyAttachment?.type)) {
          return replyAttachment.url;
        } else {
          throw new Error("┐⁠(⁠￣⁠ヘ⁠￣⁠)⁠┌ | Must reply to an image.");
        }
      } else if (args[0]?.match(/(https?:\/\/.*\.(?:png|jpg|jpeg))/g)) {
        return args[0];
      } else {
        throw new Error("(⁠┌⁠・⁠。⁠・⁠)⁠┌ | Reply to an image.");
      }
    };

    // Alternative API endpoints
    const apiEndpoints = [
      {
        name: "Remini API",
        url: (imageUrl) => `https://api.popcat.xyz/remini?image=${encodeURIComponent(imageUrl)}`,
        processResponse: (response) => response.data.image || response.data.url
      },
      {
        name: "Upscale API",
        url: (imageUrl) => `https://api.alexflipnote.dev/enhance?image=${encodeURIComponent(imageUrl)}`,
        processResponse: (response) => response.data.url
      }
    ];

    try {
      const imageUrl = getImageUrl();

      const processingMsg = await api.sendMessage("ƪ⁠(⁠‾⁠.⁠‾⁠“⁠)⁠┐ | Processing image enhancement...", threadID);

      let enhancedImageUrl = null;
      let usedApi = null;

      // Try each API endpoint
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying ${endpoint.name}...`);
          const response = await axios.get(endpoint.url(imageUrl), {
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          enhancedImageUrl = endpoint.processResponse(response);
          usedApi = endpoint.name;
          break;
        } catch (apiError) {
          console.log(`${endpoint.name} failed:`, apiError.message);
          continue;
        }
      }

      // Remove processing message
      await api.unsendMessage(processingMsg.messageID);

      if (!enhancedImageUrl) {
        return api.sendMessage(
          "┐⁠(⁠￣⁠ヘ⁠￣⁠)⁠┌ | All enhancement services are currently unavailable. Please try again later.",
          threadID, messageID
        );
      }

      // Download and send the enhanced image
      const imageResponse = await axios.get(enhancedImageUrl, {
        responseType: 'stream',
        timeout: 30000
      });

      return api.sendMessage({
        body: `<⁠(⁠￣⁠︶⁠￣⁠)⁠> | Image enhanced successfully using ${usedApi}!`,
        attachment: imageResponse.data
      }, threadID, messageID);

    } catch (error) {
      console.log("4K command error:", error.message);

      let errorMessage = "┐⁠(⁠￣⁠ヘ⁠￣⁠)⁠┌ | ";

      if (error.message.includes("Must reply to an image")) {
        errorMessage += "Please reply to an image to enhance it.";
      } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        errorMessage += "Network connection failed. Please try again later.";
      } else if (error.response?.status === 429) {
        errorMessage += "Service is rate limited. Please wait a moment and try again.";
      } else {
        errorMessage += "Unable to enhance image. Please try again later.";
      }

      return api.sendMessage(errorMessage, threadID, messageID);
    }
  }
};