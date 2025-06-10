module.exports = function ({ models, Users }) {
	const { readFileSync, writeFileSync } = require("fs-extra");
	var path = __dirname + "/data/usersData.json";
    try {
        var Currencies = require(path)
    } catch {
        writeFileSync(path, "{}", { flag: 'a+' });
    }

	async function saveData(data) {
        try {
            if (!data) throw new Error('Data cannot be left blank');
            writeFileSync(path, JSON.stringify(data, null, 4))
            return true
        } catch (error) {
            return false
        }
    }
	async function getData(userID) {
		try {
			if (!userID) throw new Error("User ID cannot be blank");
            if (isNaN(userID)) throw new Error("Invalid user ID");
            
            // Check if user exists in currencies data, if not try to get from Users
            if (!Currencies.hasOwnProperty(userID)) {
                console.log(`User ID: ${userID} does not exist in Database, attempting to create...`);
                
                // Try to create user data
                try {
                    await Users.createData(userID);
                } catch (createError) {
                    console.log(`Failed to create user ${userID}: ${createError.message}`);
                }
            }
            
			const data = await Users.getData(userID);
			return data || { userID: userID, money: 0, exp: 0 };
		} 
		catch (error) {
			console.log(`Error getting currency data for ${userID}: ${error.message}`);
			// Return default data instead of false
			return { userID: userID, money: 0, exp: 0 };
		};
	}

	async function setData(userID, options = {}) {
		try {
            if (!userID) throw new Error("User ID cannot be blank");
            if (isNaN(userID)) throw new Error("Invalid user ID");
            if (!userID) throw new Error("userID cannot be empty");
            if (!Currencies.hasOwnProperty(userID)) throw new Error(`User ID: ${userID} does not exist in Database`);
            if (typeof options != 'object') throw new Error("The options parameter passed must be an object");
            Currencies[userID] = {...Currencies[userID], ...options};
            await saveData(Currencies);
            return Currencies[userID];
        } catch (error) {
            return false
        }
	}

	async function delData(userID, callback) {
		try {
            if (!userID) throw new Error("User ID cannot be blank");
            if (isNaN(userID)) throw new Error("Invalid user ID");
            if (!Currencies.hasOwnProperty(userID)) throw new Error(`User ID: ${userID} does not exist in Database`);
            Currencies[userID].money = 0;
            await saveData(Currencies);
            if (callback && typeof callback == "function") callback(null, Currencies);
            return Currencies;
        } catch (error) {
            if (callback && typeof callback == "function") callback(error, null);
            return false
        }
	}

	async function increaseMoney(userID, money) {
		if (typeof money != 'number') throw global.getText("currencies", "needNumber");
		try {
			let balance = (await getData(userID)).money;
			await setData(userID, { money: balance + money });
			return true;
		}
		catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}

	async function decreaseMoney(userID, money) {
		if (typeof money != 'number') throw global.getText("currencies", "needNumber");
		try {
			let balance = (await getData(userID)).money;
			if (balance < money) return false;
			await setData(userID, { money: balance - money });
			return true;
		} catch (error) {
			throw new Error(error);
		}
	}

	return {
		getData,
		setData,
		delData,
		increaseMoney,
		decreaseMoney
	};
};