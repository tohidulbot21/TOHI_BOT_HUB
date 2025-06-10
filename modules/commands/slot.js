module.exports.config = {
  name: "slot",
  version: "1.0.1",
  permission: 0,
  credits: "TOHI-BOT-HUB",
  usePrefix: true,
  description: "slot game",
  commandCategory: "game",
  usages: "slot (amount)",
  cooldowns: 5
};

module.exports.languages = {
  "vi": {
    "missingInput": "[ SLOT ] Số tiền đặt cược không được để trống hoặc là số âm",
    "moneyBetNotEnough": "[ SLOT ] Số tiền bạn đặt lớn hơn hoặc bằng số dư của bạn!",
    "limitBet": "[ SLOT ] Số coin đặt không được dưới 50$!",
    "returnWin": "🎰 %1 | %2 | %3 🎰\nBạn đã thắng với %4$",
    "returnLose": "🎰 %1 | %2 | %3 🎰\nBạn đã thua và mất %4$"
  },
  "en": {
    "missingInput": "the bet money must not be blank or a negative number.",
    "moneyBetNotEnough": "the money you betted is bigger than your balance.",
    "limitBet": "your bet is too low, the minimum is 50 pesos.",
    "returnWin": "%1 | %2 | %3 \nyou won %4$",
    "returnLose": "%1 | %2 | %3\nyou lost %4$"
  }
};

module.exports.run = async function ({
  api,
  event,
  args,
  Currencies,
  getText
}) {
  const { threadID, messageID, senderID } = event;
  const { getData, increaseMoney, decreaseMoney } = Currencies;

  const slotItems = ["🖕", "❤️", "👉", "👌", "🥀", "🍓", "🍒", "🍌", "🥝", "🥑", "🌽"];
  const moneyUser = (await getData(senderID)).money;
  const moneyBet = parseInt(args[0]);

  if (isNaN(moneyBet) || moneyBet <= 0) {
    return api.sendMessage(getText("missingInput"), threadID, messageID);
  }
  if (moneyBet > moneyUser) {
    return api.sendMessage(getText("moneyBetNotEnough"), threadID, messageID);
  }
  if (moneyBet < 50) {
    return api.sendMessage(getText("limitBet"), threadID, messageID);
  }

  const number = [];
  let win = false;
  for (let i = 0; i < 3; i++) {
    number[i] = Math.floor(Math.random() * slotItems.length);
  }

  let reward = moneyBet;
  if (number[0] === number[1] && number[1] === number[2]) {
    reward *= 9;
    win = true;
  } else if (number[0] === number[1] || number[0] === number[2] || number[1] === number[2]) {
    reward *= 2;
    win = true;
  }

  const slotDisplay = `${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]}`;
  if (win) {
    await increaseMoney(senderID, reward);
    return api.sendMessage(getText("returnWin", slotItems[number[0]], slotItems[number[1]], slotItems[number[2]], reward), threadID, messageID);
  } else {
    await decreaseMoney(senderID, moneyBet);
    return api.sendMessage(getText("returnLose", slotItems[number[0]], slotItems[number[1]], slotItems[number[2]], moneyBet), threadID, messageID);
  }
};
