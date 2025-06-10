
module.exports.config = {
  name: "uptime",
  version: "1.0.0",
  permission: 0,
  usePrefix: true,
  credits: "TOHI-BOT-HUB",
  description: "Show beautiful uptime/status for TOHI-BOT",
  commandCategory: "admin",
  usages: "",
  cooldowns: 5,
};

function byte2mb(bytes) {
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let l = 0, n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
}

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const timeStart = Date.now();
  
  try {
    // Send initial loading message
    const loadingMsg = await api.sendMessage("⏳ Loading uptime information...", threadID);
    
    // Basic uptime calculation
    const time = process.uptime();
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    const z_1 = (hours < 10) ? '0' + hours : hours;
    const x_1 = (minutes < 10) ? '0' + minutes : minutes;
    const y_1 = (seconds < 10) ? '0' + seconds : seconds;
    
    // Get current time
    const moment = require("moment-timezone");
    const timeNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY || HH:mm:ss");
    const { commands } = global.client;
    
    // Get system stats with fallback
    let stats = { cpu: 0, memory: 0 };
    try {
      const pidusage = require("pidusage");
      stats = await pidusage(process.pid);
    } catch (error) {
      console.log("Could not get system stats:", error.message);
    }
    
    // Compose stylish message
    let msg = `╭━━━[ 🤖 𝚃𝙾𝙷𝙸-𝙱𝙾𝚃 𝚄𝙿𝚃𝙸𝙼𝙴 🤖 ]━━━╮

🟢 Bot Status: 𝙊𝙉𝙻𝙄𝙉𝙴
⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s
📅 Date: ${timeNow}

━━━━━━━━━━━━━━━━━━
👑 𝙊𝙬𝙣𝙚𝙧: 𝚃𝙾𝙷𝙸𝙳𝚄𝙻
🤖 𝘽𝙤𝙩 𝙉𝙖𝙢𝙚: TOHI-BOT
🔗 Prefix: ${global.config.PREFIX}
📂 Commands: ${commands.size}
👥 Users: ${global.data.allUserID.length}
💬 Threads: ${global.data.allThreadID.length}
🧠 CPU: ${stats.cpu.toFixed(1)}%
💾 RAM: ${byte2mb(stats.memory)}
🌐 Ping: ${Date.now() - timeStart}ms
━━━━━━━━━━━━━━━━━━
🌟 Thank you for using TOHI-BOT!
╰━━━━━━━━━━━━━━━━━━━━╯`;

    // Try to create image with canvas (with fallback)
    let attachment = null;
    try {
      const axios = require("axios");
      const fs = require("fs-extra");
      const { loadImage, createCanvas, registerFont } = require("canvas");
      
      // Create cache directory
      const fontDir = __dirname + "/tohibot_fonts";
      if (!fs.existsSync(fontDir)) fs.mkdirSync(fontDir);
      
      // Simple background color
      let canvas = createCanvas(1200, 600);
      let ctx = canvas.getContext("2d");
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 1200, 600);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 600);
      
      // Add text (using default font)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("TOHI-BOT UPTIME", 600, 150);
      
      ctx.font = "36px Arial";
      ctx.fillText(`⏰ ${z_1} : ${x_1} : ${y_1}`, 600, 250);
      
      ctx.font = "24px Arial";
      ctx.fillText("🌐 TOHI-BOT | Owner: TOHIDUL", 600, 350);
      ctx.fillText("💎 Stay awesome with TOHI-BOT!", 600, 400);
      
      ctx.font = "20px Arial";
      ctx.fillText(`Commands: ${commands.size} | Users: ${global.data.allUserID.length}`, 600, 450);
      ctx.fillText(`CPU: ${stats.cpu.toFixed(1)}% | RAM: ${byte2mb(stats.memory)}`, 600, 480);
      ctx.fillText(`Ping: ${Date.now() - timeStart}ms`, 600, 510);
      
      // Save image
      const imageBuffer = canvas.toBuffer();
      const pathImg = `${fontDir}/uptime_simple.png`;
      fs.writeFileSync(pathImg, imageBuffer);
      attachment = fs.createReadStream(pathImg);
      
    } catch (error) {
      console.log("Could not create image:", error.message);
    }
    
    // Remove loading message
    if (loadingMsg && loadingMsg.messageID) {
      try {
        await api.unsendMessage(loadingMsg.messageID);
      } catch (e) {
        console.log("Could not unsend loading message");
      }
    }
    
    // Send final message
    return api.sendMessage({
      body: msg,
      attachment: attachment
    }, threadID, () => {
      // Clean up image file if it exists
      const fs = require("fs-extra");
      const pathImg = __dirname + "/tohibot_fonts/uptime_simple.png";
      if (attachment && fs.existsSync(pathImg)) {
        try {
          fs.unlinkSync(pathImg);
        } catch (e) {
          console.log("Could not clean up image file");
        }
      }
    }, messageID);
    
  } catch (error) {
    console.error("Uptime command error:", error);
    
    // Fallback simple message
    const time = process.uptime();
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    return api.sendMessage(`🤖 TOHI-BOT Status
⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s
🟢 Status: Online
🌐 Ping: ${Date.now() - timeStart}ms
📂 Commands: ${global.client.commands.size}
👥 Users: ${global.data.allUserID.length}
💬 Threads: ${global.data.allThreadID.length}`, threadID, messageID);
  }
};
