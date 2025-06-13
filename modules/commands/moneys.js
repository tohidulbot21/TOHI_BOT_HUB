module.exports.config = {
	name: "moneys",
	aliases: ["money", "balance", "bal"],
	version: "1.0.2",
	permission: 0,
	credits: "TOHI-BOT-HUB",
	usePrefix: true,
	description: "check the amount of yourself or the person tagged, or send money",
	commandCategory: "economy",
	usages: "[tag] | send [amount] @[user]",
	cooldowns: 5
};

module.exports.languages = {
	"vi": {
		"sotienbanthan": "Số tiền bạn đang có: %1$",
		"sotiennguoikhac": "Số tiền của %1 hiện đang có là: %2$",
		"sendSuccess": "Đã chuyển %1$ cho %2",
		"sendNotEnough": "Bạn không có đủ tiền để chuyển",
		"sendInvalid": "Số tiền không hợp lệ",
		"sendSelf": "Bạn không thể chuyển tiền cho chính mình",
		"sendUsage": "Sử dụng: moneys send [số tiền] @[người dùng]"
	},
	"en": {
		"sotienbanthan": "your current balance : %1$",
		"sotiennguoikhac": "%1's current balance : %2$.",
		"sendSuccess": "Successfully sent %1$ to %2",
		"sendNotEnough": "You don't have enough money to send",
		"sendInvalid": "Invalid amount",
		"sendSelf": "You cannot send money to yourself",
		"sendUsage": "Usage: moneys send [amount] @[user]"
	}
};

module.exports.run = async function ({ api, event, args, Currencies, getText, Users, Threads }) {
	const {
		threadID,
		messageID,
		senderID,
		mentions
	} = event;

	// Fallback getText function if not provided
	const safeGetText = getText || function(key, ...args) {
		const fallbackMessages = {
			"sotienbanthan": "your current balance : %1$",
			"sotiennguoikhac": "%1's current balance : %2$.",
			"sendSuccess": "Successfully sent %1$ to %2",
			"sendNotEnough": "You don't have enough money to send",
			"sendInvalid": "Invalid amount",
			"sendSelf": "You cannot send money to yourself",
			"sendUsage": "Usage: moneys send [amount] @[user]"
		};
		
		if (fallbackMessages[key]) {
			let message = fallbackMessages[key];
			for (let i = 0; i < args.length; i++) {
				message = message.replace(new RegExp(`%${i + 1}`, 'g'), args[i] || '');
			}
			return message;
		}
		return key;
	};

	// Check if it's a send command
	if (args[0] && args[0].toLowerCase() === "send") {
		const amount = parseInt(args[1]);
		
		// Validate amount
		if (isNaN(amount) || amount <= 0) {
			return api.sendMessage(safeGetText("sendInvalid"), threadID, messageID);
		}
		
		// Check if user mentioned someone
		if (Object.keys(mentions).length !== 1) {
			return api.sendMessage(safeGetText("sendUsage"), threadID, messageID);
		}
		
		const receiverID = Object.keys(mentions)[0];
		
		// Check if trying to send to self
		if (receiverID === senderID) {
			return api.sendMessage(safeGetText("sendSelf"), threadID, messageID);
		}
		
		// Get sender's money
		const senderMoney = (await Currencies.getData(senderID)).money;
		
		// Check if sender has enough money
		if (senderMoney < amount) {
			return api.sendMessage(safeGetText("sendNotEnough"), threadID, messageID);
		}
		
		// Transfer money
		await Currencies.decreaseMoney(senderID, amount);
		await Currencies.increaseMoney(receiverID, amount);
		
		return api.sendMessage({
			body: safeGetText("sendSuccess", amount, mentions[receiverID].replace(/\@/g, "")),
			mentions: [{
				tag: mentions[receiverID].replace(/\@/g, ""),
				id: receiverID
			}]
		}, threadID, messageID);
	}
	
	// Original balance check functionality
	if (!args[0]) {
		const money = (await Currencies.getData(senderID)).money;
		return api.sendMessage(safeGetText("sotienbanthan", money), threadID, messageID);
	} else if (Object.keys(event.mentions).length == 1) {
		var mention = Object.keys(mentions)[0];
		var money = (await Currencies.getData(mention)).money;
		if (!money) {
			money = 0;
		}
		return api.sendMessage({
			body: safeGetText("sotiennguoikhac", mentions[mention].replace(/\@/g, ""), money),
			mentions: [{
				tag: mentions[mention].replace(/\@/g, ""),
				id: mention
			}]
		}, threadID, messageID);
	} else {
		return global.utils.throwError(this.config.name, threadID, messageID);
	}
};
