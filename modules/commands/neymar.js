module.exports = {
  config: {
    name: "neymar",
    aliases: ["njr"],
    version: "1.1",
    usePrefix: true,
    author: "Made by Tohidul",
    countDown: 5,
    role: 0,
    shortDescription: "⚽ Neymar Jr - random photo",
    longDescription: "Sends a random stylish photo of Neymar Jr.",
    category: "football",
    commandCategory: "football",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const links = [
      "https://i.imgur.com/arWjsNg.jpg",
      "https://i.imgur.com/uJYvMR0.jpg",
      "https://i.imgur.com/A3MktQ4.jpg",
      "https://i.imgur.com/wV8YHHp.jpg",
      "https://i.imgur.com/14sAFjM.jpg",
      "https://i.imgur.com/EeAi2G6.jpg",
      "https://i.imgur.com/fUZbzhJ.jpg",
      "https://i.imgur.com/bUjGSCX.jpg",
      "https://i.imgur.com/4KZvLbO.jpg",
      "https://i.imgur.com/gBEAsYZ.jpg",
      "https://i.imgur.com/baKOat0.jpg",
      "https://i.imgur.com/4Z0ERpD.jpg",
      "https://i.imgur.com/h2ReDUe.jpg",
      "https://i.imgur.com/KQPalvi.jpg",
      "https://i.imgur.com/VRALDic.jpg",
      "https://i.imgur.com/Z3qGkZa.jpg",
      "https://i.imgur.com/etyPi7B.jpg",
      "https://i.imgur.com/tMxLEwl.jpg",
      "https://i.imgur.com/OwEdlZo.jpg",
      "https://i.imgur.com/UHAo39t.jpg",
      "https://i.imgur.com/aV4EVT9.jpg",
      "https://i.imgur.com/zdC8yiG.jpg",
      "https://i.imgur.com/JI7tjsr.jpg",
      "https://i.imgur.com/fFuPCrM.jpg",
      "https://i.imgur.com/XIaAXju.jpg",
      "https://i.imgur.com/yyIJwPH.jpg",
      "https://i.imgur.com/MyGcsJM.jpg",
      "https://i.imgur.com/UXjh4R1.jpg",
      "https://i.imgur.com/QGrvMZL.jpg"
    ];

    try {
      const img = links[Math.floor(Math.random() * links.length)];
      const axios = require('axios');
      const fs = require('fs');
      const path = require('path');
      
      // Download image
      const response = await axios.get(img, { responseType: 'stream' });
      const imagePath = path.join(__dirname, 'tmp', `neymar_${Date.now()}.jpg`);
      
      // Ensure tmp directory exists
      const tmpDir = path.join(__dirname, 'tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);
      
      writer.on('finish', () => {
        api.sendMessage({
          body: '✨ Here comes the Magician! 🐐 Neymar Jr ✨',
          attachment: fs.createReadStream(imagePath)
        }, threadID, () => {
          // Clean up the file after sending
          fs.unlinkSync(imagePath);
        }, messageID);
      });
      
      writer.on('error', (error) => {
        console.log('Error downloading Neymar image:', error);
        api.sendMessage('✨ Here comes the Magician! 🐐 Neymar Jr ✨', threadID, messageID);
      });
      
    } catch (error) {
      console.log('Neymar command error:', error);
      api.sendMessage('✨ Here comes the Magician! 🐐 Neymar Jr ✨', threadID, messageID);
    }
  }
};