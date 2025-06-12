module.exports.config = {
  name: "age2",
  version: "1.0.0",
  hasPermssion: 0,
  usePrefix: true,
  credits: "Made by Tohidul ✨",
  description: "Calculate your age in detail with style and emojis.",
  commandCategory: "Date Calculation",
  usages: "<day/month/year of birth>",
  cooldowns: 0
};

module.exports.run = function ({ event, args, api }) {
  const input = args[0];
  if (!input) {
    return api.sendMessage(
      `💡 Please enter your birth date in the correct format:\n\n➤ age <day/month/year> 🗓️\n\nExample: age 12/10/2000`,
      event.threadID,
      event.messageID
    );
  } else {
    const axios = require("axios");
    const moment = require("moment-timezone");
    const today = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
    const time = `${input}`;
    axios
      .get(
        `https://le31.glitch.me/other/date-calculator?first=${time}&second=${today}`
      )
      .then((res) => {
        const { years, months, weeks, days, hours, minutes, seconds } = res.data;
        const msg = `
╔═════════════ ⏳ ═════════════╗
   𝓢𝓣𝓨𝓛𝓘𝓢𝓗 𝓐𝓖𝓔 𝓒𝓐𝓛𝓒𝓤𝓛𝓐𝓣𝓞𝓡
╚═════════════════════════════╝

🎂 Date of Birth:  ${input}

🗓️ Until Today:  ${today}

━━━━━━━━━━━━━━━━━━━━━━
⏳ Years:      ${years}
⏳ Months:     ${months}
⏳ Weeks:      ${weeks}
⏳ Days:       ${days}
⏳ Hours:      ${hours}
⏳ Minutes:    ${minutes}
⏳ Seconds:    ${seconds}
━━━━━━━━━━━━━━━━━━━━━━
✨ Made by Tohidul ✨
`;
        return api.sendMessage(msg, event.threadID, event.messageID);
      });
  }
};