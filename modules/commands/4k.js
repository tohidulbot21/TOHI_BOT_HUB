const axios = require('axios');
const tinyurl = require('tinyurl');

module.exports = {
  config: {
    name: "4k",
    usePrefix: true,
    aliases: ["4k", "remini"],
    version: "1.0",
    author: "JARiF",
    countDown: 15,
    role: 0,
    longDescription: "Upscale your image.",
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

  try {
    const imageUrl = getImageUrl();
    const shortUrl = await tinyurl.shorten(imageUrl);

    api.sendMessage("ƪ⁠(⁠‾⁠.⁠‾⁠“⁠)⁠┐ | Please wait...", threadID, messageID);

    const response = await axios.get(`https://www.api.vyturex.com/upscale?imageUrl=${shortUrl}`);
    const resultUrl = response.data.resultUrl;

    const stream = await global.utils.getStreamFromURL(resultUrl);
    return api.sendMessage({ 
      body: "<⁠(⁠￣⁠︶⁠￣⁠)⁠> | Image Enhanced.", 
      attachment: stream 
    }, threadID, messageID);
  } catch (error) {
    console.log("4K command error:", error.message);
    return api.sendMessage("┐⁠(⁠￣⁠ヘ⁠￣⁠)⁠┌ | Error: " + error.message, threadID, messageID);
  }
  }
};