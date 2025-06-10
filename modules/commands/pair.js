
const { loadImage, createCanvas, registerFont } = require("canvas");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "pair3",
  version: "2.2.0",
  permssion: 0,
  usePrefix: true,
  credits: "TOHI-BOT-HUB & Copilot",
  description: "Custom pair card with background link and random love percentage",
  commandCategory: "fun",
  usages: "<background_image_url>",
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "canvas": ""
  },
  cooldowns: 15
};

module.exports.run = async function ({ args, Users, Threads, api, event }) {
  try {
    // Use given link or default to your provided link, but validate it's a proper URL
    let bgUrl = "https://i.postimg.cc/vB3XWjQv/PARI-FN-1.jpg"; // default

    // Check if args[0] is provided and is a valid URL
    if (args[0] && (args[0].startsWith('http://') || args[0].startsWith('https://'))) {
      bgUrl = args[0];
    }

    const pathImg = __dirname + "/cache/pairlove_bg.png";
    const pathAvt1 = __dirname + "/cache/pairlove_male.png";
    const pathAvt2 = __dirname + "/cache/pairlove_female.png";

    // 1. Download background image
    const bgBuffer = (await axios.get(bgUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(bgBuffer, "utf-8"));

    // 2. Get thread & users info
    const id1 = event.senderID;
    const name1 = await Users.getNameUser(id1);
    const threadInfo = await api.getThreadInfo(event.threadID);
    const allUsers = threadInfo.userInfo;
    const gender1 = allUsers.find(u => u.id == id1)?.gender || "MALE";
    const botID = api.getCurrentUserID();

    // 3. Pick partner
    let gender2 = gender1 === "FEMALE" ? "MALE" : "FEMALE";
    let partnerList = allUsers.filter(u => u.gender == gender2 && u.id !== id1 && u.id !== botID);
    if (partnerList.length === 0) partnerList = allUsers.filter(u => u.id !== id1 && u.id !== botID);
    const partner = partnerList[Math.floor(Math.random() * partnerList.length)];
    const id2 = partner.id;
    const name2 = await Users.getNameUser(id2);

    // 4. Download profile pictures with higher resolution
    const avt1Buffer = (await axios.get(`https://graph.facebook.com/${id1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathAvt1, Buffer.from(avt1Buffer, "utf-8"));
    const avt2Buffer = (await axios.get(`https://graph.facebook.com/${id2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathAvt2, Buffer.from(avt2Buffer, "utf-8"));

    // 5. Load images
    const bg = await loadImage(pathImg);
    const avt1 = await loadImage(pathAvt1);
    const avt2 = await loadImage(pathAvt2);

    // 6. Load custom font if available
    const fontPath = path.join(__dirname, "tohibot_fonts", "CaviarDreams.ttf");
    let fontFamily = "Arial";
    if (fs.existsSync(fontPath)) {
      try {
        registerFont(fontPath, { family: "CaviarDreams" });
        fontFamily = "CaviarDreams";
      } catch (err) {
        console.log("Font loading failed, using Arial");
        fontFamily = "Arial";
      }
    }

    // 7. Setup canvas with proper dimensions based on background
    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext("2d");
    
    // Draw background at full resolution
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // 8. Calculate avatar positions based on canvas size (BIGGER PHOTOS)
    const avatarSize = Math.min(canvas.width, canvas.height) * 0.25; // 25% of smaller dimension (increased from 15%)
    const leftX = canvas.width * 0.12; // 12% from left
    const rightX = canvas.width * 0.63; // 63% from left  
    const avatarY = canvas.height * 0.25; // 25% from top (moved up)

    // Helper function to draw circular avatar with border
    function drawCircularAvatar(image, x, y, size, borderColor) {
      // Draw border
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2 + 8, 0, Math.PI * 2);
      ctx.fillStyle = borderColor;
      ctx.fill();
      ctx.restore();

      // Draw avatar (circular)
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, x, y, size, size);
      ctx.restore();
    }

    // 9. Draw avatars with better positioning
    drawCircularAvatar(avt1, leftX, avatarY, avatarSize, "#FFD700");
    drawCircularAvatar(avt2, rightX, avatarY, avatarSize, "#FF69B4");

    // 10. Draw names below avatars with better styling (BIGGER TEXT)
    const fontSize = Math.max(36, canvas.width * 0.04); // Increased font size
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = Math.max(3, fontSize * 0.12);
    ctx.textAlign = "center";
    
    // Add shadow for text readability
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = fontSize * 0.3;
    ctx.shadowOffsetX = fontSize * 0.1;
    ctx.shadowOffsetY = fontSize * 0.1;
    
    const nameY = avatarY + avatarSize + fontSize * 1.8;
    ctx.strokeText(name1, leftX + avatarSize/2, nameY);
    ctx.fillText(name1, leftX + avatarSize/2, nameY);
    
    ctx.strokeText(name2, rightX + avatarSize/2, nameY);
    ctx.fillText(name2, rightX + avatarSize/2, nameY);

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 11. Draw percentage in center with dynamic sizing (BIGGER PERCENTAGE)
    const percentage = Math.floor(Math.random() * 100) + 1;
    const percentageFontSize = Math.max(72, canvas.width * 0.08); // Increased size
    ctx.font = `bold ${percentageFontSize}px ${fontFamily}`;
    ctx.fillStyle = "#FF1493";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(6, percentageFontSize * 0.1);
    ctx.textAlign = "center";

    // Add glow effect for percentage
    ctx.shadowColor = "#FF1493";
    ctx.shadowBlur = percentageFontSize * 0.5;

    const percentageY = canvas.height * 0.15; // Moved up
    ctx.strokeText(`${percentage}%`, canvas.width / 2, percentageY);
    ctx.fillText(`${percentage}%`, canvas.width / 2, percentageY);

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // 12. Draw wish message at bottom with dynamic sizing
    const messageFontSize = Math.max(20, canvas.width * 0.025);
    ctx.font = `bold ${messageFontSize}px ${fontFamily}`;
    
    // Create gradient for message
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#FFD700");
    gradient.addColorStop(0.5, "#FF69B4");
    gradient.addColorStop(1, "#FF1493");

    ctx.fillStyle = gradient;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(2, messageFontSize * 0.1);
    ctx.textAlign = "center";

    // Add shadow for wish message
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = messageFontSize * 0.3;
    ctx.shadowOffsetX = messageFontSize * 0.08;
    ctx.shadowOffsetY = messageFontSize * 0.08;

    const messageY = canvas.height - (canvas.height * 0.1);
    ctx.strokeText("❤️ নতুন জুটিকে অনেক অনেক শুভেচ্ছা! ❤️", canvas.width / 2, messageY);
    ctx.fillText("❤️ নতুন জুটিকে অনেক অনেক শুভেচ্ছা! ❤️", canvas.width / 2, messageY);

    // 13. Save the final image
    const imgBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imgBuffer);

    // 14. Send message with proper mentions and cleanup
    const messageBody = `✨ Love Percentage: ${percentage}% ✨\n💕 @${name1} ❤️ @${name2} 💕`;
    
    return api.sendMessage({
      body: messageBody,
      mentions: [
        { tag: `@${name1}`, id: id1 },
        { tag: `@${name2}`, id: id2 }
      ],
      attachment: fs.createReadStream(pathImg)
    }, event.threadID, (err) => {
      // Cleanup temp files
      try {
        fs.unlinkSync(pathImg);
        fs.unlinkSync(pathAvt1);
        fs.unlinkSync(pathAvt2);
      } catch(e) {
        console.log("Cleanup error:", e.message);
      }
    }, event.messageID);

  } catch (err) {
    console.error("Pair command error:", err);
    return api.sendMessage("❌ কিছু সমস্যা হয়েছে! আবার চেষ্টা করুন।", event.threadID, event.messageID);
  }
};
