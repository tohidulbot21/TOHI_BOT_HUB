const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");
module.exports = {
  config: {
    name: "cover2",
    version: "1.0",
    author: "munem.",
    countDown: 5,
    role: 0,
    usePrefix: true,
    shortDescription: "Create fb Banner",
    longDescription: "",
    category: "image",
    commandCategory: "image",
    guide: {
      en: "{p}{n}  Name or code | text | Text",
    }
  },



  onStart: async function ({ message, args, event, api }) {
    const info = args.join(" ");
    if (!info){
      return message.reply(`Please enter in the format:\n/cover2  Name or code | text | Text | bgtext`);
    } else {
      const msg = info.split("|");
      const id = msg[0] ? msg[0].trim() : "";
      const name = msg[1] ? msg[1].trim() : "";
      const juswa = msg[2] ? msg[2].trim() : "";
      const bgtext = msg[3] ? msg[3].trim() : "";



       // Validate required fields
      if (!id || !name) {
        return message.reply("❌ Please provide at least ID/Name and main text!\nFormat: /cover2 id|name|subtext|bgtext");
      }

      if (isNaN(id)) { // If input is not a number
        await api.sendMessage("processing your cover senpai....😻", event.threadID, event.messageID);

        let id1;
        try {
          const response = await axios.get(`https://www.nguyenmanh.name.vn/api/searchAvt?key=${encodeURIComponent(id)}`, {
            timeout: 10000
          });

          if (response.data && response.data.result && response.data.result.ID) {
            id1 = response.data.result.ID;
          } else {
            throw new Error("Invalid response format");
          }
        } catch (error) {
          console.log(`Cover2 API error: ${error.message}`);
          await message.reply("Character not found, please check the name and try again...");
          return;
        }

        try {
          const img = `https://www.nguyenmanh.name.vn/api/avtWibu6?id=${id1}&tenchinh=${encodeURIComponent(name)}&tenphu=${encodeURIComponent(juswa)}&mxh=${encodeURIComponent(bgtext)}&apikey=az4d4hVW`;

          const form = {
            body: `「 Here's your cover senpai😻❤️ 」`
          };

          form.attachment = [];

          if (global.utils && global.utils.getStreamFromURL) {
            form.attachment[0] = await global.utils.getStreamFromURL(img);
          } else {
            // Fallback method
            const response = await axios.get(img, { responseType: 'stream', timeout: 15000 });
            form.attachment[0] = response.data;
          }

          message.reply(form);
        } catch (error) {
          console.log(`Cover2 image generation error: ${error.message}`);
          await message.reply("❌ Failed to generate cover image. Please try again later.");
        } 



       } else { 
        await api.sendMessage("processing your cover senpai....😻", event.threadID, event.messageID);

        try {
          const img = `https://www.nguyenmanh.name.vn/api/avtWibu6?id=${encodeURIComponent(id)}&tenchinh=${encodeURIComponent(name)}&tenphu=${encodeURIComponent(juswa)}&mxh=${encodeURIComponent(bgtext)}&apikey=az4d4hVW`;

          const form = {
            body: `「 Here's your cover senpai😻❤️ 」`
          };

          form.attachment = [];

          if (global.utils && global.utils.getStreamFromURL) {
            form.attachment[0] = await global.utils.getStreamFromURL(img);
          } else {
            // Fallback method
            const response = await axios.get(img, { responseType: 'stream', timeout: 15000 });
            form.attachment[0] = response.data;
          }

          message.reply(form);
        } catch (error) {
          console.log(`Cover2 image generation error: ${error.message}`);
          await message.reply("❌ Failed to generate cover image. Please try again later.");
        }
      }
      }
    }
   };