const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "4k",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Made by Tohidul",
  premium: false,
  description: "Enhance a photo to 4K quality",
  commandCategory: "image",
  usages: "Reply to an image",
  cooldowns: 5,
  usePrefix: true,
  dependencies: {
    "fs-extra": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const cachePath = __dirname + "/cache/enhanced_image.jpg";
  const { threadID, messageID, messageReply } = event;
  const imageUrl = messageReply ? messageReply.attachments[0].url : args.join(" ");

  if (!imageUrl) {
    api.sendMessage("❌ Please reply to an image to enhance it.", threadID, messageID);
    return;
  }

  try {
    const waitMsg = await api.sendMessage("⏳ Please wait while your image is being enhanced to 4K...", threadID);
    // Call the API to enhance the image
    const response = await axios.get("https://yt-video-production.up.railway.app/upscale?imageUrl=" + encodeURIComponent(imageUrl));
    const enhancedUrl = response.data.imageUrl;
    // Download the enhanced image
    const enhancedImageBuffer = (await axios.get(enhancedUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(cachePath, Buffer.from(enhancedImageBuffer, "binary"));
    // Send the enhanced image
    api.sendMessage({
      body: "✅ Your 4K image is ready!",
      attachment: fs.createReadStream(cachePath)
    }, threadID, () => fs.unlinkSync(cachePath), messageID);
    if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
  } catch (err) {
    api.sendMessage("❌ Error processing image: " + err.message, threadID, messageID);
  }
};