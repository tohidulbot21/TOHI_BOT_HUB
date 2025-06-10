const moment = require("moment-timezone");

module.exports.config = {
  name: "info",
  version: "1.2.7",
  hasPermssion: 0,
  credits: "TOHI-BOT-HUB",
  description: "Show bot & owner info with uptime",
  usePrefix: true,
  commandCategory: "For users",
  hide: true,
  usages: "",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args, Users, Threads }) {
  const request = global.nodemodule["request"];
  const fs = global.nodemodule["fs-extra"];

  // Config & Data
  const { configPath } = global.client;
  delete require.cache[require.resolve(configPath)];
  const config = require(configPath);
  const ADMINBOT = config.ADMINBOT || [];
  const PREFIX = config.PREFIX;
  const namebot = "TOHI-BOT";
  const { commands } = global.client;
  const threadSetting = (await Threads.getData(String(event.threadID))).data || {};
  const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;

  // Uptime Calculation
  const time = process.uptime();
  const hours = Math.floor(time / (60 * 60));
  const minutes = Math.floor((time % (60 * 60)) / 60);
  const seconds = Math.floor(time % 60);

  // Static image (if you want, use your own image link)
  const imgURL = "https://i.postimg.cc/nhM2PPjW/admin.png";
  const imgPath = __dirname + "/cache/tohibot-info.jpg";

  // Owner/Admin Info (only name)
  let adminList = [];
  let i = 1;
  for (const idAdmin of ADMINBOT) {
    if (parseInt(idAdmin)) {
      const name = await Users.getNameUser(idAdmin);
      adminList.push(`${i++}/ ${name} - ${idAdmin}`);
    }
  }

  // Message
  const msg = 
`╔══════════════════╗
     🤖 TOHI-BOT 🤖
╚══════════════════╝

• Prefix (system): ${PREFIX}
• Prefix (box)   : ${prefix}
• Total Modules  : ${commands.size}
• Ping           : ${Date.now() - event.timestamp}ms

👑 BOT OWNER 👑
• Name     : TOHIDUL
• Facebook : https://www.facebook.com/profile.php?id=100092006324917
• WhatsApp : 017628120**

⏰ BOT UPTIME ⏰
• ${hours}h ${minutes}m ${seconds}s

📊 STATISTICS 📊
• Total Users : ${global.data.allUserID.length}
• Total Groups: ${global.data.allThreadID.length}

💌 Thanks for using TOHI-BOT!
`;

  // Send message with image
  const sendMsg = () =>
    api.sendMessage(
      {
        body: msg,
        attachment: fs.createReadStream(imgPath),
      },
      event.threadID,
      () => fs.unlinkSync(imgPath)
    );

  // Download image and send
  request(encodeURI(imgURL))
    .pipe(fs.createWriteStream(imgPath))
    .on("close", sendMsg);
};
