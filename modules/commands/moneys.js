const moment = require("moment");

module.exports = {
	config: {
		name: "moneys",
		aliases: ["money", "balance", "bal", "cash", "coin", "dollar"],
		version: "3.0.0",
		hasPermssion: 0,
		credits: "Made by Tohidul",
		usePrefix: true,
		description: "Check your balance, send money, claim daily bonus, see leaderboard and more.",
		commandCategory: "economy",
		usages: "[check/@user] | send [amount] @[user] | daily | top",
		cooldowns: 3,
	},

	languages: {
		en: {
			balance: "💰 Your current balance: %1$",
			balanceOther: "💰 %1's balance: %2$",
			sendSuccess: "✅ You sent %1$ to %2!",
			sendNotEnough: "❌ You don't have enough money to send!",
			sendInvalid: "❌ Invalid amount!",
			sendSelf: "❌ You cannot send money to yourself!",
			dailySuccess: "🎁 You received %1$ daily bonus!",
			dailyCooldown: "⏰ Please wait %1 hours %2 minutes before claiming daily bonus again.",
			topRanking: "🏆 Top Richest Users",
			error: "❌ An error occurred. Please try again.",
			noMention: "❌ Please mention one user to check/send money.",
			minSend: "❌ Minimum transfer amount is 10$",
			usageSend: "📝 Usage: moneys send [amount] @[recipient]",
			you: "You",
		}
	},

	onStart: async function({ api, event, args, Currencies, Users }) {
		const { threadID, messageID, senderID, mentions } = event;
		const lang = this.languages.en;

		// Utilities
		const formatMoney = amount => parseInt(amount || 0).toLocaleString();
		const getUserName = async id => {
			try {
				if (Users && Users.getNameUser) {
					const name = await Users.getNameUser(id);
					if (name && name !== 'undefined') return name;
				}
				if (Users && Users.getData) {
					const userData = await Users.getData(id);
					if (userData && userData.name) return userData.name;
				}
				return "Unknown User";
			} catch {
				return "Unknown User";
			}
		};

		try {
			// DAILY BONUS
			if ((args[0] && args[0].toLowerCase() === "daily") || args[0] === "-d") {
				const userData = await Currencies.getData(senderID);
				const lastDaily = userData.lastDaily || 0;
				const now = Date.now();
				const oneDayMs = 24 * 60 * 60 * 1000;
				if (now - lastDaily < oneDayMs) {
					const left = oneDayMs - (now - lastDaily);
					const hours = Math.floor(left / (60 * 60 * 1000));
					const mins = Math.floor((left % (60 * 60 * 1000)) / (60 * 1000));
					return api.sendMessage(lang.dailyCooldown.replace("%1", hours).replace("%2", mins), threadID, messageID);
				}
				const amount = Math.floor(Math.random() * 500) + 100;
				await Currencies.increaseMoney(senderID, amount);
				await Currencies.setData(senderID, { lastDaily: now });
				return api.sendMessage(lang.dailySuccess.replace("%1", formatMoney(amount)), threadID, messageID);
			}

			// TOP LEADERBOARD
			if ((args[0] && args[0].toLowerCase() === "top") || args[0] === "-t") {
				// Fake leaderboard for demo (replace with actual leaderboard logic if available)
				const topUsers = [
					{ id: senderID, name: await getUserName(senderID), money: (await Currencies.getData(senderID)).money || 0 },
					{ id: "2", name: "Player 2", money: 125000 },
					{ id: "3", name: "Player 3", money: 98500 },
					{ id: "4", name: "Player 4", money: 87200 },
					{ id: "5", name: "Player 5", money: 76800 }
				];
				let msg = `${lang.topRanking}\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
				const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
				for (let i = 0; i < topUsers.length; i++)
					msg += `${medals[i]} ${topUsers[i].name}: ${formatMoney(topUsers[i].money)}$\n`;
				msg += "━━━━━━━━━━━━━━━━━━━━━━━━\n💡 Keep chatting to earn more money!";
				return api.sendMessage(msg, threadID, messageID);
			}

			// SEND MONEY
			if (args[0] && ["send","transfer"].includes(args[0].toLowerCase())) {
				if (!args[1] || !args[2] || Object.keys(mentions).length !== 1)
					return api.sendMessage(lang.usageSend, threadID, messageID);

				const amount = parseInt(args[1]);
				if (isNaN(amount) || amount < 10)
					return api.sendMessage(lang.minSend, threadID, messageID);

				const receiverID = Object.keys(mentions)[0];
				if (receiverID === senderID)
					return api.sendMessage(lang.sendSelf, threadID, messageID);

				const senderData = await Currencies.getData(senderID);
				if ((senderData.money || 0) < amount)
					return api.sendMessage(lang.sendNotEnough, threadID, messageID);

				await Currencies.decreaseMoney(senderID, amount);
				await Currencies.increaseMoney(receiverID, amount);

				const receiverName = await getUserName(receiverID);
				const newBalance = (senderData.money || 0) - amount;
				const sendMsg = `${lang.sendSuccess.replace("%1", formatMoney(amount)).replace("%2", receiverName)}\n\n💰 Your new balance: ${formatMoney(newBalance)}$\n🎯 Transaction completed!`;
				return api.sendMessage({ body: sendMsg, mentions: [{ tag: receiverName, id: receiverID }] }, threadID, messageID);
			}

			// CHECK ANOTHER USER'S BALANCE
			if (Object.keys(mentions).length === 1) {
				const targetID = Object.keys(mentions)[0];
				const targetData = await Currencies.getData(targetID);
				const targetMoney = targetData ? targetData.money || 0 : 0;
				const targetName = await getUserName(targetID);
				const status = targetMoney > 10000 ? "💎 Premium" : targetMoney > 1000 ? "⭐ Standard" : "🆕 Basic";
				const body = `${lang.balanceOther.replace("%1", targetName).replace("%2", formatMoney(targetMoney))}\n\n💳 Account Status: ${status}`;
				return api.sendMessage({ body, mentions: [{ tag: targetName, id: targetID }] }, threadID, messageID);
			}

			// CHECK OWN BALANCE
			const userData = await Currencies.getData(senderID);
			const userMoney = userData ? userData.money || 0 : 0;
			const userName = await getUserName(senderID);
			const status = userMoney > 10000 ? "💎 Premium" : userMoney > 1000 ? "⭐ Standard" : "🆕 Basic";
			const level = userMoney > 50000 ? "🏆 Elite" : userMoney > 10000 ? "💎 Rich" : userMoney > 1000 ? "⭐ Average" : "🌱 Starter";
			const body = `${lang.balance.replace("%1", formatMoney(userMoney))}\n\n👤 Account Holder: ${userName}\n💳 Account Status: ${status}\n📊 Wealth Level: ${level}\n\n💡 Use "moneys send [amount] @user" to transfer money!\n🎁 Use "moneys daily" for your daily bonus!\n🏆 Use "moneys top" to see the leaderboard!`;
			return api.sendMessage(body, threadID, messageID);

		} catch (error) {
			console.log("[MONEYS] Error:", error);
			return api.sendMessage(lang.error, event.threadID, event.messageID);
		}
	}
};