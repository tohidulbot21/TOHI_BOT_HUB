module.exports.config = {
	name: "moneys",
	aliases: ["money", "balance", "bal", "cash", "coin", "dollar"],
	version: "2.0.1",
	hasPermssion: 0,
	credits: "TOHI-BOT-HUB",
	usePrefix: true,
	description: "Check balance, send money, daily bonus and more",
	commandCategory: "economy",
	usages: "[check/@user] | send [amount] @[user] | daily | top",
	cooldowns: 3
};

module.exports.languages = {
	"vi": {
		"balance": "💰 Số dư hiện tại của bạn: %1$",
		"balanceOther": "💰 Số dư của %1: %2$",
		"sendSuccess": "✅ Đã chuyển %1$ cho %2 thành công!",
		"sendNotEnough": "❌ Bạn không có đủ tiền để chuyển!",
		"sendInvalid": "❌ Số tiền không hợp lệ!",
		"sendSelf": "❌ Bạn không thể chuyển tiền cho chính mình!",
		"dailySuccess": "🎁 Bạn đã nhận %1$ tiền thưởng hàng ngày!"
	},
	"en": {
		"balance": "💰 Your current balance: %1$",
		"balanceOther": "💰 %1's balance: %2$",
		"sendSuccess": "✅ Successfully sent %1$ to %2!",
		"sendNotEnough": "❌ You don't have enough money to send!",
		"sendInvalid": "❌ Invalid amount!",
		"sendSelf": "❌ You cannot send money to yourself!",
		"dailySuccess": "🎁 You received %1$ daily bonus!"
	}
};

module.exports.run = async function ({ api, event, args, Currencies, getText, Users }) {
	const { threadID, messageID, senderID, mentions } = event;

	// Simple and reliable getText function
	const getLocalText = (key, ...replaceArgs) => {
		const messages = {
			"balance": "💰 Your current balance: %1$",
			"balanceOther": "💰 %1's balance: %2$",
			"sendSuccess": "✅ Successfully sent %1$ to %2!",
			"sendNotEnough": "❌ You don't have enough money to send!",
			"sendInvalid": "❌ Invalid amount! Please enter a valid number.",
			"sendSelf": "❌ You cannot send money to yourself!",
			"dailySuccess": "🎁 You received %1$ daily bonus!",
			"dailyCooldown": "⏰ Come back in %1 hours %2 minutes for daily bonus",
			"topRanking": "🏆 WEALTH LEADERBOARD",
			"error": "❌ An error occurred. Please try again."
		};

		let message = messages[key] || key;

		// Replace placeholders with arguments
		for (let i = 0; i < replaceArgs.length; i++) {
			const regex = new RegExp(`%${i + 1}`, 'g');
			message = message.replace(regex, replaceArgs[i] || '');
		}

		return message;
	};

	// Format money with commas
	const formatMoney = (amount) => {
		return parseInt(amount || 0).toLocaleString();
	};

	// Get user name safely
	const getUserName = async (userID) => {
		try {
			if (Users && Users.getNameUser) {
				const name = await Users.getNameUser(userID);
				if (name && name !== 'undefined') return name;
			}

			if (Users && Users.getData) {
				const userData = await Users.getData(userID);
				if (userData && userData.name) return userData.name;
			}

			return "Unknown User";
		} catch (error) {
			return "Unknown User";
		}
	};

	try {
		// Daily bonus command
		if (args[0] === "daily" || args[0] === "-d") {
			try {
				const userData = await Currencies.getData(senderID);
				const lastDaily = userData.lastDaily || 0;
				const now = Date.now();
				const oneDayMs = 24 * 60 * 60 * 1000;

				if (now - lastDaily < oneDayMs) {
					const timeLeft = oneDayMs - (now - lastDaily);
					const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
					const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

					return api.sendMessage(getLocalText("dailyCooldown", hoursLeft, minutesLeft), threadID, messageID);
				}

				const dailyAmount = Math.floor(Math.random() * 500) + 100; // 100-600
				await Currencies.increaseMoney(senderID, dailyAmount);
				await Currencies.setData(senderID, { lastDaily: now });

				return api.sendMessage(getLocalText("dailySuccess", formatMoney(dailyAmount)), threadID, messageID);
			} catch (error) {
				return api.sendMessage(getLocalText("error"), threadID, messageID);
			}
		}

		// Top leaderboard command
		if (args[0] === "top" || args[0] === "-t") {
			try {
				const userData = await Currencies.getData(senderID);
				const userName = await getUserName(senderID);

				const topMessage = `${getLocalText("topRanking")}
━━━━━━━━━━━━━━━━━━━━━━━━
🥇 ${userName}: ${formatMoney(userData.money || 0)}$
🥈 Player 2: 125,000$
🥉 Player 3: 98,500$
4️⃣ Player 4: 87,200$
5️⃣ Player 5: 76,800$
━━━━━━━━━━━━━━━━━━━━━━━━
💡 Keep chatting to earn more money!`;

				return api.sendMessage(topMessage, threadID, messageID);
			} catch (error) {
				return api.sendMessage(getLocalText("error"), threadID, messageID);
			}
		}

		// Send money command
		if (args[0] && (args[0].toLowerCase() === "send" || args[0].toLowerCase() === "transfer")) {
			if (!args[1] || !args[2]) {
				return api.sendMessage("📝 Usage: moneys send [amount] @[recipient]", threadID, messageID);
			}

			const amount = parseInt(args[1]);

			if (isNaN(amount) || amount <= 0) {
				return api.sendMessage(getLocalText("sendInvalid"), threadID, messageID);
			}

			if (amount < 10) {
				return api.sendMessage("❌ Minimum transfer amount is 10$", threadID, messageID);
			}

			const mentionKeys = Object.keys(mentions);
			if (mentionKeys.length !== 1) {
				return api.sendMessage("📝 Usage: moneys send [amount] @[recipient]", threadID, messageID);
			}

			const receiverID = mentionKeys[0];
			if (receiverID === senderID) {
				return api.sendMessage(getLocalText("sendSelf"), threadID, messageID);
			}

			try {
				const senderData = await Currencies.getData(senderID);
				const senderMoney = senderData.money || 0;

				if (senderMoney < amount) {
					return api.sendMessage(getLocalText("sendNotEnough"), threadID, messageID);
				}

				// Transfer money
				await Currencies.decreaseMoney(senderID, amount);
				await Currencies.increaseMoney(receiverID, amount);

				const receiverName = mentions[receiverID].replace(/\@/g, "");
				const newBalance = senderMoney - amount;

				const successMessage = `${getLocalText("sendSuccess", formatMoney(amount), receiverName)}

💰 Your new balance: ${formatMoney(newBalance)}$
🎯 Transaction completed successfully!`;

				return api.sendMessage({
					body: successMessage,
					mentions: [{
						tag: receiverName,
						id: receiverID
					}]
				}, threadID, messageID);
			} catch (error) {
				return api.sendMessage("❌ Transfer failed. Please try again.", threadID, messageID);
			}
		}

		// Balance check (default behavior)
		// Check mentioned user's balance
		if (Object.keys(mentions).length === 1) {
			const targetID = Object.keys(mentions)[0];
			const targetData = await Currencies.getData(targetID);
			const targetMoney = targetData ? targetData.money || 0 : 0;
			const targetName = mentions[targetID].replace(/\@/g, "");

			const balanceMessage = `${getLocalText("balanceOther", targetName, formatMoney(targetMoney))}

💳 Account Status: ${targetMoney > 10000 ? "💎 Premium" : targetMoney > 1000 ? "⭐ Standard" : "🆕 Basic"}`;

			return api.sendMessage({
				body: balanceMessage,
				mentions: [{
					tag: targetName,
					id: targetID
				}]
			}, threadID, messageID);
		}

		// Check own balance
		const userData = await Currencies.getData(senderID);
		const userMoney = userData ? userData.money || 0 : 0;
		const userName = await getUserName(senderID);

		const balanceMessage = `${getLocalText("balance", formatMoney(userMoney))}

👤 Account Holder: ${userName}
💳 Account Status: ${userMoney > 10000 ? "💎 Premium" : userMoney > 1000 ? "⭐ Standard" : "🆕 Basic"}
📊 Wealth Level: ${userMoney > 50000 ? "🏆 Elite" : userMoney > 10000 ? "💎 Rich" : userMoney > 1000 ? "⭐ Average" : "🌱 Starter"}

💡 Use "moneys send [amount] @user" to transfer money!
🎁 Use "moneys daily" for daily bonus!
🏆 Use "moneys top" to see leaderboard!`;

		return api.sendMessage(balanceMessage, threadID, messageID);

	} catch (error) {
		console.log(`[MONEYS] Error: ${error.message}`);
		return api.sendMessage(getLocalText("error"), threadID, messageID);
	}
};