
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const app = express();

// Rate limiting
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 50; // 50 requests per minute

function rateLimitMiddleware(req, res, next) {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  if (!rateLimit.has(clientId)) {
    rateLimit.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = rateLimit.get(clientId);
  
  if (now > clientData.resetTime) {
    rateLimit.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ 
      status: false, 
      message: "Rate limit exceeded. Please try again later." 
    });
  }
  
  clientData.count++;
  next();
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimitMiddleware);

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Database file path
const BANK_DATA_FILE = path.join(__dirname, 'includes/database/data/bankData.json');

// Initialize bank data file if it doesn't exist
async function initBankData() {
  try {
    if (!await fs.pathExists(BANK_DATA_FILE)) {
      await fs.outputJson(BANK_DATA_FILE, {
        users: {},
        transactions: [],
        nextAccountNumber: 1000000
      });
    }
  } catch (error) {
    console.log('[BANK-API] Error initializing bank data:', error);
  }
}

// Helper functions
async function getBankData() {
  try {
    return await fs.readJson(BANK_DATA_FILE);
  } catch (error) {
    console.log('[BANK-API] Error reading bank data:', error);
    return { users: {}, transactions: [], nextAccountNumber: 1000000 };
  }
}

async function saveBankData(data) {
  try {
    await fs.outputJson(BANK_DATA_FILE, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.log('[BANK-API] Error saving bank data:', error);
    return false;
  }
}

function generatePassword() {
  return Math.random().toString(36).slice(-8).toUpperCase();
}

function generateAccountNumber(nextNum) {
  return (nextNum + Math.floor(Math.random() * 1000)).toString();
}

// API Routes

// Root route
app.get('/', (req, res) => {
  res.json({
    status: true,
    message: "TOHI-BOT Bank API is running",
    version: "2.0.0",
    endpoints: [
      '/bank/check',
      '/bank/register', 
      '/bank/find',
      '/bank/send',
      '/bank/get',
      '/bank/pay',
      '/bank/top',
      '/bank/password'
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Check if user has bank account
app.get('/bank/check', async (req, res) => {
  try {
    const { ID } = req.query;
    if (!ID) {
      return res.json({ status: false, message: "User ID is required" });
    }

    const bankData = await getBankData();
    const userExists = bankData.users[ID] ? true : false;
    
    res.json({ 
      status: userExists,
      message: userExists ? "User has bank account" : "User doesn't have bank account"
    });
  } catch (error) {
    res.json({ status: false, message: "Server error" });
  }
});

// Register new bank account
app.get('/bank/register', async (req, res) => {
  try {
    const { senderID, name } = req.query;
    if (!senderID || !name) {
      return res.json({ status: false, message: "Missing required parameters" });
    }

    const bankData = await getBankData();
    
    // Check if user already has account
    if (bankData.users[senderID]) {
      return res.json({ status: false, message: "You already have a bank account!" });
    }

    // Create new account
    const password = generatePassword();
    const accountNumber = generateAccountNumber(bankData.nextAccountNumber);
    const decodedName = decodeURI(name);
    
    bankData.users[senderID] = {
      name: decodedName,
      STK: accountNumber,
      money: 0,
      password: password,
      createdAt: new Date().toISOString()
    };
    
    bankData.nextAccountNumber++;
    
    await saveBankData(bankData);
    
    res.json({
      status: true,
      message: {
        noti: "🎉 Bank account created successfully!",
        name: decodedName,
        STK: accountNumber,
        money: 0,
        password: password
      }
    });
  } catch (error) {
    res.json({ status: false, message: "Failed to create account" });
  }
});

// Find user by account number or ID
app.get('/bank/find', async (req, res) => {
  try {
    const { type, STK, ID } = req.query;
    const bankData = await getBankData();
    
    let user = null;
    
    if (type === 'STK' && STK) {
      // Find by account number
      for (const [userId, userData] of Object.entries(bankData.users)) {
        if (userData.STK === STK) {
          user = { id: userId, ...userData };
          break;
        }
      }
    } else if (type === 'ID' && ID) {
      // Find by user ID
      if (bankData.users[ID]) {
        user = { id: ID, ...bankData.users[ID] };
      }
    }
    
    if (!user) {
      return res.json({ status: false, message: "User not found" });
    }
    
    res.json({
      status: true,
      message: {
        name: user.name,
        data: {
          STK: user.STK,
          money: user.money
        }
      }
    });
  } catch (error) {
    res.json({ status: false, message: "Server error" });
  }
});

// Deposit money to bank
app.get('/bank/send', async (req, res) => {
  try {
    const { senderID, money } = req.query;
    if (!senderID || !money) {
      return res.json({ status: false, message: "Missing parameters" });
    }
    
    const amount = parseInt(money);
    if (isNaN(amount) || amount <= 0) {
      return res.json({ status: false, message: "Invalid amount" });
    }
    
    const bankData = await getBankData();
    
    if (!bankData.users[senderID]) {
      return res.json({ status: false, message: "Bank account not found" });
    }
    
    bankData.users[senderID].money += amount;
    
    // Add transaction record
    bankData.transactions.push({
      type: 'deposit',
      from: senderID,
      amount: amount,
      timestamp: new Date().toISOString()
    });
    
    await saveBankData(bankData);
    
    res.json({
      status: true,
      message: {
        noti: "💰 Money deposited successfully!",
        name: bankData.users[senderID].name,
        money: bankData.users[senderID].money
      }
    });
  } catch (error) {
    res.json({ status: false, message: "Deposit failed" });
  }
});

// Withdraw money from bank
app.get('/bank/get', async (req, res) => {
  try {
    const { ID, money, password } = req.query;
    if (!ID || !money || !password) {
      return res.json({ status: false, message: "Missing parameters" });
    }
    
    const amount = parseInt(money);
    if (isNaN(amount) || amount <= 0) {
      return res.json({ status: false, message: "Invalid amount" });
    }
    
    const bankData = await getBankData();
    
    if (!bankData.users[ID]) {
      return res.json({ status: false, message: "Bank account not found" });
    }
    
    const user = bankData.users[ID];
    
    if (user.password !== password) {
      return res.json({ status: false, message: "Incorrect password" });
    }
    
    if (user.money < amount) {
      return res.json({ status: false, message: "Insufficient balance" });
    }
    
    bankData.users[ID].money -= amount;
    
    // Add transaction record
    bankData.transactions.push({
      type: 'withdraw',
      from: ID,
      amount: amount,
      timestamp: new Date().toISOString()
    });
    
    await saveBankData(bankData);
    
    res.json({
      status: true,
      message: {
        noti: "💸 Money withdrawn successfully!",
        name: user.name,
        money: bankData.users[ID].money
      }
    });
  } catch (error) {
    res.json({ status: false, message: "Withdrawal failed" });
  }
});

// Transfer money between accounts
app.get('/bank/pay', async (req, res) => {
  try {
    const { type, senderID, STK, userID, money, password } = req.query;
    if (!senderID || !money || !password) {
      return res.json({ status: false, message: "Missing parameters" });
    }
    
    const amount = parseInt(money);
    if (isNaN(amount) || amount <= 0) {
      return res.json({ status: false, message: "Invalid amount" });
    }
    
    const bankData = await getBankData();
    
    if (!bankData.users[senderID]) {
      return res.json({ status: false, message: "Your bank account not found" });
    }
    
    const sender = bankData.users[senderID];
    
    if (sender.password !== password) {
      return res.json({ status: false, message: "Incorrect password" });
    }
    
    if (sender.money < amount) {
      return res.json({ status: false, message: "Insufficient balance" });
    }
    
    let receiverID = null;
    
    if (type === 'STK' && STK) {
      // Find receiver by account number
      for (const [userId, userData] of Object.entries(bankData.users)) {
        if (userData.STK === STK) {
          receiverID = userId;
          break;
        }
      }
    } else if (type === 'ID' && userID) {
      receiverID = userID;
    }
    
    if (!receiverID || !bankData.users[receiverID]) {
      return res.json({ status: false, message: "Receiver account not found" });
    }
    
    if (receiverID === senderID) {
      return res.json({ status: false, message: "Cannot transfer to yourself" });
    }
    
    const receiver = bankData.users[receiverID];
    
    // Transfer money
    bankData.users[senderID].money -= amount;
    bankData.users[receiverID].money += amount;
    
    // Add transaction record
    bankData.transactions.push({
      type: 'transfer',
      from: senderID,
      to: receiverID,
      amount: amount,
      timestamp: new Date().toISOString()
    });
    
    await saveBankData(bankData);
    
    res.json({
      status: true,
      message: {
        noti: "💳 Transfer successful!",
        data: {
          message: `Transferred $${amount} from ${sender.name} to ${receiver.name}`
        }
      }
    });
  } catch (error) {
    res.json({ status: false, message: "Transfer failed" });
  }
});

// Get top richest users
app.get('/bank/top', async (req, res) => {
  try {
    const bankData = await getBankData();
    
    const users = Object.entries(bankData.users)
      .map(([id, user]) => ({ id, ...user }))
      .sort((a, b) => b.money - a.money)
      .slice(0, 10);
    
    if (users.length === 0) {
      return res.json({ status: false, message: "No users found" });
    }
    
    const ranking = users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      money: user.money
    }));
    
    res.json({
      status: true,
      message: "🏆 Top Richest Users:",
      ranking: ranking
    });
  } catch (error) {
    res.json({ status: false, message: "Failed to get rankings" });
  }
});

// Password management
app.get('/bank/password', async (req, res) => {
  try {
    const { bka, dka, fka } = req.query;
    
    if (!dka) {
      return res.json({ status: false, message: "User ID required" });
    }
    
    const bankData = await getBankData();
    
    if (!bankData.users[dka]) {
      return res.json({ status: false, message: "Bank account not found" });
    }
    
    const user = bankData.users[dka];
    
    if (bka === 'get') {
      // Get current password
      res.json({
        status: true,
        message: {
          password: user.password
        }
      });
    } else if (bka === 'recovery' && fka) {
      // Set new password
      const newPassword = fka.trim();
      if (newPassword.length < 4) {
        return res.json({ status: false, message: "Password must be at least 4 characters" });
      }
      
      bankData.users[dka].password = newPassword;
      await saveBankData(bankData);
      
      res.json({
        status: true,
        message: {
          noti: "🔐 Password changed successfully!",
          name: user.name,
          password: newPassword
        }
      });
    } else {
      res.json({ status: false, message: "Invalid operation" });
    }
  } catch (error) {
    res.json({ status: false, message: "Password operation failed" });
  }
});

// Initialize and start server
async function startBankAPI() {
  await initBankData();
  
  const PORT = process.env.BANK_API_PORT || 3001;
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`⫸ TBH ➤ [ BANK-API ] Bank API server running on port ${PORT}`);
  });
  
  server.on('error', (error) => {
    console.log(`⫸ TBH ➤ [ BANK-API ] Server error: ${error.message}`);
  });
  
  return server;
}

module.exports = { app, startBankAPI };

// Start server if this file is run directly
if (require.main === module) {
  startBankAPI();
}
