module.exports.config = {
	name: "moneys",
	aliases: ["money", "balance", "bal"],
	version: "1.0.2",
	hasPermssion: 0,
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

	// Enhanced getText function with proper fallbacks
	const safeGetText = (key, ...replaceArgs) => {
		try {
			// Try to use provided getText first
			if (getText && typeof getText === 'function') {
				const result = getText(key, ...replaceArgs);
				if (result && result !== key) {
					return result;
				}
			}
		} catch (e) {
			// If getText fails, use fallback
		}

		// Enhanced fallback messages
		const fallbackMessages = {
			"sotienbanthan": "💰 Your current balance: %1$",
			"sotiennguoikhac": "💰 %1's current balance: %2$",
			"sendSuccess": "✅ Successfully sent %1$ to %2",
			"sendNotEnough": "❌ You don't have enough money to send",
			"sendInvalid": "❌ Invalid amount",
			"sendSelf": "❌ You cannot send money to yourself",
			"sendUsage": "Usage: moneys send [amount] @[user]"
		};
		
		if (fallbackMessages[key]) {
			let message = fallbackMessages[key];
			for (let i = 0; i < replaceArgs.length; i++) {
				message = message.replace(new RegExp(`%${i + 1}`, 'g'), replaceArgs[i] || '');
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
		try {
			const userData = await Currencies.getData(senderID);
			const money = userData ? userData.money || 0 : 0;
			return api.sendMessage(safeGetText("sotienbanthan", money), threadID, messageID);
		} catch (error) {
			return api.sendMessage("💰 Your current balance: 0$", threadID, messageID);
		}
	} else if (Object.keys(event.mentions).length == 1) {
		try {
			var mention = Object.keys(mentions)[0];
			const userData = await Currencies.getData(mention);
			var money = userData ? userData.money || 0 : 0;
			
			return api.sendMessage({
				body: safeGetText("sotiennguoikhac", mentions[mention].replace(/\@/g, ""), money),
				mentions: [{
					tag: mentions[mention].replace(/\@/g, ""),
					id: mention
				}]
			}, threadID, messageID);
		} catch (error) {
			return api.sendMessage("❌ Unable to fetch user balance", threadID, messageID);
		}
	} else {
		return api.sendMessage("❌ Invalid usage. Use: moneys or moneys @mention", threadID, messageID);
	}
};
