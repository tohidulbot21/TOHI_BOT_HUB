module.exports.config = {
  name: "love2",
  version: "1.0.0",
  permission: 0,
  credits: "TOHI-BOT-HUB",
  description: "",
  usePrefix: true,
  commandCategory: "Love",
  usages: "love2 @",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "canvas": ""
  }
};

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { loadImage, createCanvas } = require('canvas');

module.exports.onLoad = async () => {
  const cachePath = path.join(__dirname, "cache");
  const imgPath = path.join(cachePath, "frtwb.png");

  if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

  if (!fs.existsSync(imgPath)) {
    const imgUrl = "https://i.postimg.cc/59BcbrFV/lov2.jpg";
    const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, Buffer.from(res.data));
  }
};

async function makeImage({ one, two }) {
  const basePath = path.join(__dirname, "cache");
  const baseImg = await loadImage(path.join(basePath, "frtwb.png"));
  const canvas = createCanvas(baseImg.width, baseImg.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(baseImg, 0, 0);

  const avatarOnePath = path.join(basePath, `avt_${one}.png`);
  const avatarTwoPath = path.join(basePath, `avt_${two}.png`);
  const outPath = path.join(basePath, `frtwb_${one}_${two}.png`);

  try {
    // Download avatar 1
    const res1 = await axios.get(
      `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    );
    fs.writeFileSync(avatarOnePath, Buffer.from(res1.data));

    // Download avatar 2
    const res2 = await axios.get(
      `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    );
    fs.writeFileSync(avatarTwoPath, Buffer.from(res2.data));
  } catch (e) {
    throw new Error("Avatar download error: " + e.message);
  }

  const avatar1 = await loadImage(avatarOnePath);
  const avatar2 = await loadImage(avatarTwoPath);

  // Draw circular avatars
  // First avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(200, 360, 80, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar1, 120, 280, 160, 160);
  ctx.restore();

  // Second avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(600, 360, 80, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar2, 520, 280, 160, 160);
  ctx.restore();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);

  // Cleanup
  fs.unlinkSync(avatarOnePath);
  fs.unlinkSync(avatarTwoPath);

  return outPath;
}

module.exports.run = async function ({ event, api, args }) {
  const { threadID, messageID, senderID, mentions } = event;
  const mentionId = Object.keys(mentions)[0];
  const mentionTag = mentions[mentionId]?.replace('@', '') || null;

  if (!mentionId) {
    return api.sendMessage('Please tag 1 person.', threadID, messageID);
  }

  try {
    const imgPath = await makeImage({ one: senderID, two: mentionId });

    api.sendMessage({
      body: `🫣 @${mentionTag} love you so much 🤗🥀`,
      mentions: [{ tag: mentionTag, id: mentionId }],
      attachment: fs.createReadStream(imgPath)
    }, threadID, () => fs.unlinkSync(imgPath), messageID);

  } catch (e) {
    console.error("Image generate error:", e);
    api.sendMessage("Image generate korte problem hocche! " + e.message, threadID, messageID);
  }
};
