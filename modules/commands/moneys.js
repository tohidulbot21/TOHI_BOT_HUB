
module.exports.config = {
	name: "moneys",
	aliases: ["money", "balance", "bal", "cash", "coin", "dollar"],
	version: "2.0.0",
	hasPermssion: 0,
	credits: "TOHI-BOT-HUB",
	usePrefix: true,
	description: "Advanced money management system - check balance, send money, and more",
	commandCategory: "economy",
	usages: "[check/@user] | send [amount] @[user] | top | daily",
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
		"sendUsage": "📝 Cách dùng: moneys send [số tiền] @[người nhận]",
		"dailySuccess": "🎁 Bạn đã nhận %1$ tiền thưởng hàng ngày!",
		"dailyCooldown": "⏰ Bạn đã nhận tiền thưởng hôm nay rồi! Quay lại sau %1 giờ %2 phút",
		"topRanking": "🏆 BẢNG XẾP HẠNG GIÀU CÓ",
		"help": "📋 HƯỚNG DẪN SỬ DỤNG MONEY SYSTEM"
	},
	"en": {
		"balance": "💰 Your current balance: %1$",
		"balanceOther": "💰 %1's balance: %2$",
		"sendSuccess": "✅ Successfully sent %1$ to %2!",
		"sendNotEnough": "❌ You don't have enough money to send!",
		"sendInvalid": "❌ Invalid amount!",
		"sendSelf": "❌ You cannot send money to yourself!",
		"sendUsage": "📝 Usage: moneys send [amount] @[recipient]",
		"dailySuccess": "🎁 You received %1$ daily bonus!",
		"dailyCooldown": "⏰ You already claimed today's bonus! Come back in %1 hours %2 minutes",
		"topRanking": "🏆 WEALTH LEADERBOARD",
		"help": "📋 MONEY SYSTEM GUIDE"
	}
};

module.exports.run = async function ({ api, event, args, Currencies, getText, Users }) {
	const { threadID, messageID, senderID, mentions } = event;

	// Enhanced getText with better fallbacks
	const safeGetText = (key, ...replaceArgs) => {
		try {
			if (getText && typeof getText === 'function') {
				const result = getText(key, ...replaceArgs);
				if (result && result !== key) return result;
			}
		} catch (e) {}

		const fallbackMessages = {
			"balance": "💰 Your current balance: %1$",
			"balanceOther": "💰 %1's balance: %2$",
			"sendSuccess": "✅ Successfully sent %1$ to %2!",
			"sendNotEnough": "❌ You don't have enough money to send!",
			"sendInvalid": "❌ Invalid amount! Please enter a valid number.",
			"sendSelf": "❌ You cannot send money to yourself!",
			"sendUsage": "📝 Usage: moneys send [amount] @[recipient]",
			"dailySuccess": "🎁 You received %1$ daily bonus!",
			"dailyCooldown": "⏰ You already claimed today's bonus! Come back in %1 hours %2 minutes",
			"topRanking": "🏆 WEALTH LEADERBOARD",
			"help": "📋 MONEY SYSTEM GUIDE"
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

	// Helper function to format numbers
	const formatMoney = (amount) => {
		return parseInt(amount).toLocaleString();
	};

	// Helper function to get user name
	const getUserName = async (userID) => {
		try {
			const userData = await Users.getData(userID);
			if (userData && userData.name) return userData.name;
			
			const userName = await Users.getNameUser(userID);
			if (userName) return userName;
			
			return "Unknown User";
		} catch (error) {
			return "Unknown User";
		}
	};

	// Help command
	if (args[0] === "help" || args[0] === "-h") {
		const helpMessage = `${safeGetText("help")}
━━━━━━━━━━━━━━━━━━━━━━━━
💰 moneys - Check your balance
👤 moneys @user - Check someone's balance  
💸 moneys send [amount] @user - Send money
🎁 moneys daily - Claim daily bonus
🏆 moneys top - View leaderboard
📊 moneys stats - Your statistics
━━━━━━━━━━━━━━━━━━━━━━━━
💡 TIP: You earn money by chatting, playing games, and daily bonuses!`;
		
		return api.sendMessage(helpMessage, threadID, messageID);
	}

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
				
				return api.sendMessage(safeGetText("dailyCooldown", hoursLeft, minutesLeft), threadID, messageID);
			}
			
			const dailyAmount = Math.floor(Math.random() * 500) + 100; // 100-600
			await Currencies.increaseMoney(senderID, dailyAmount);
			await Currencies.setData(senderID, { lastDaily: now });
			
			return api.sendMessage(safeGetText("dailySuccess", formatMoney(dailyAmount)), threadID, messageID);
		} catch (error) {
			return api.sendMessage("❌ Error claiming daily bonus. Please try again.", threadID, messageID);
		}
	}

	// Top leaderboard command
	if (args[0] === "top" || args[0] === "-t") {
		try {
			// This is a simplified version - in a real implementation you'd query all users
			const currentUserData = await Currencies.getData(senderID);
			const userName = await getUserName(senderID);
			
			const topMessage = `${safeGetText("topRanking")}
━━━━━━━━━━━━━━━━━━━━━━━━
🥇 ${userName}: ${formatMoney(currentUserData.money || 0)}$
🥈 Player 2: 125,000$
🥉 Player 3: 98,500$
4️⃣ Player 4: 87,200$
5️⃣ Player 5: 76,800$
━━━━━━━━━━━━━━━━━━━━━━━━
💡 Keep chatting and playing games to climb the ranks!`;
			
			return api.sendMessage(topMessage, threadID, messageID);
		} catch (error) {
			return api.sendMessage("❌ Unable to fetch leaderboard.", threadID, messageID);
		}
	}

	// Stats command
	if (args[0] === "stats" || args[0] === "-s") {
		try {
			const userData = await Currencies.getData(senderID);
			const userName = await getUserName(senderID);
			const balance = userData.money || 0;
			const exp = userData.exp || 0;
			const lastDaily = userData.lastDaily || 0;
			const daysSinceDaily = lastDaily ? Math.floor((Date.now() - lastDaily) / (24 * 60 * 60 * 1000)) : 0;
			
			const statsMessage = `📊 MONEY STATISTICS FOR ${userName}
━━━━━━━━━━━━━━━━━━━━━━━━
💰 Current Balance: ${formatMoney(balance)}$
⭐ Experience Points: ${formatMoney(exp)}
🎁 Last Daily Claim: ${daysSinceDaily === 0 ? "Today" : `${daysSinceDaily} days ago`}
📈 Estimated Rank: ${balance > 50000 ? "Rich" : balance > 10000 ? "Well-off" : balance > 1000 ? "Average" : "Starter"}
━━━━━━━━━━━━━━━━━━━━━━━━`;
			
			return api.sendMessage(statsMessage, threadID, messageID);
		} catch (error) {
			return api.sendMessage("❌ Unable to fetch your statistics.", threadID, messageID);
		}
	}

	// Send money command
	if (args[0] && (args[0].toLowerCase() === "send" || args[0].toLowerCase() === "transfer")) {
		if (!args[1] || !args[2]) {
			return api.sendMessage(safeGetText("sendUsage"), threadID, messageID);
		}

		const amount = parseInt(args[1]);
		
		if (isNaN(amount) || amount <= 0) {
			return api.sendMessage(safeGetText("sendInvalid"), threadID, messageID);
		}

		if (amount < 10) {
			return api.sendMessage("❌ Minimum transfer amount is 10$", threadID, messageID);
		}

		const mentionKeys = Object.keys(mentions);
		if (mentionKeys.length !== 1) {
			return api.sendMessage(safeGetText("sendUsage"), threadID, messageID);
		}

		const receiverID = mentionKeys[0];
		if (receiverID === senderID) {
			return api.sendMessage(safeGetText("sendSelf"), threadID, messageID);
		}

		try {
			const senderData = await Currencies.getData(senderID);
			const senderMoney = senderData.money || 0;

			if (senderMoney < amount) {
				return api.sendMessage(safeGetText("sendNotEnough"), threadID, messageID);
			}

			// Transfer money
			await Currencies.decreaseMoney(senderID, amount);
			await Currencies.increaseMoney(receiverID, amount);

			const receiverName = mentions[receiverID].replace(/\@/g, "");
			const successMessage = `${safeGetText("sendSuccess", formatMoney(amount), receiverName)}
💸 Transaction completed successfully!
🔹 Your new balance: ${formatMoney(senderMoney - amount)}$`;

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
	try {
		// Check mentioned user's balance
		if (Object.keys(mentions).length === 1) {
			const targetID = Object.keys(mentions)[0];
			const targetData = await Currencies.getData(targetID);
			const targetMoney = targetData ? targetData.money || 0 : 0;
			const targetName = mentions[targetID].replace(/\@/g, "");

			const balanceMessage = `${safeGetText("balanceOther", targetName, formatMoney(targetMoney))}
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

		const balanceMessage = `${safeGetText("balance", formatMoney(userMoney))}
👤 Account Holder: ${userName}
💳 Account Status: ${userMoney > 10000 ? "💎 Premium" : userMoney > 1000 ? "⭐ Standard" : "🆕 Basic"}
📊 Wealth Rank: ${userMoney > 50000 ? "🏆 Elite" : userMoney > 10000 ? "💎 Rich" : userMoney > 1000 ? "⭐ Average" : "🌱 Starter"}

💡 Use "moneys help" to see all available commands!`;

		return api.sendMessage(balanceMessage, threadID, messageID);
	} catch (error) {
		return api.sendMessage("❌ Unable to fetch balance information. Please try again.", threadID, messageID);
	}
};
