module.exports.config = {
  name: "bank",
  version: "2.0.5",
  usePrefix: true,
  hasPermssion: 0,
  credits: "Made by Tohidul",
  description: "For users: virtual bank system",
  commandCategory: "User",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { senderID, messageID, threadID } = event;
  const axios = require('axios');
  const checkBank = (await axios.get(`https://api.sdwdewhgdjwwdjs.repl.co/bank/check?ID=${senderID}`)).data   
  const { createReadStream } = require(`fs-extra`);
  switch(args[0]) {
      case 'register':
      case '-r':
      case 'r': {
          const res = (await axios.get(`https://api.sdwdewhgdjwwdjs.repl.co/bank/register?senderID=${senderID}&name=${encodeURI((await Users.getData(senderID)).name)}`)).data
          if(res.status == false) return api.sendMessage(res.message, threadID, messageID);
          api.sendMessage('Your bank password is: ' + res.message.password, senderID);
          return api.sendMessage(`=== [ ${res.message.noti} ] ===\n👤 Account holder: ${res.message.name}\n💳 Account Number: ${res.message.STK}\n💰 Balance: ${res.message.money}\n🔐  Password: sent to your private messages, please check your inbox (or spam)`, threadID, messageID)
      }
      case "find":
      case "-f": {
          if (checkBank.status == false) api.sendMessage("You don't have a bank account yet!", threadID, messageID)
          if (args[1] != "stk" && args[1] != "id") {
              api.sendMessage("Please choose a valid type (stk/id)", threadID, messageID)
          }
          let { data } = (await axios.get(`https://api.sdwdewhgdjwwdjs.repl.co/bank/find?type=${args[1].toUpperCase()}&${args[1].toUpperCase()}=${args[2]}`))
          const name = data.message.name
          const stk = data.message.data.STK
          const soDu = data.message.data.money
          return api.sendMessage(`=== [ MB BANK ] ===\n👤 Account holder: ${name}\n💳 Account Number: ${stk}\n💰 Balance: ${soDu}$`, threadID, messageID)
      }
      case 'info':
      case '-i':
      case 'check':
      case '-c': {
          var a = event.senderID;
          if(checkBank.status == false) return api.sendMessage("You don't have a bank account yet!", threadID, messageID);
          const res = (await axios.get(`https://api.sdwdewhgdjwwdjs.repl.co/bank/find?type=ID&ID=${a}`)).data  
          return api.sendMessage(`=== [ BANK KING ] ===\n👤 Account holder: ${res.message.name}\n💳 Account Number: ${res.message.data.STK}\n💰 Balance: ${res.message.data.money}$`, threadID, messageID)
      }
      case 'get':
      case 'withdraw': {
          if(checkBank.status == false) return api.sendMessage("You don't have a bank account yet!", threadID, messageID);
          if(!args[1]) return api.sendMessage('Please use: get [amount]', threadID, messageID);
          api.sendMessage('Final step sent to your inbox', threadID, messageID);
          return api.sendMessage('Please reply to this message with your bank password to withdraw!', senderID, (error, info) => 
              global.client.handleReply.push({
                  name: this.config.name,
                  type: 'getMoney',
                  messageID: info.messageID,
                  author: event.senderID,
                  money: args[1],
                  threadID: threadID
              })
          );
      }
      case 'top':
      case '-t':{
          if(checkBank.status == false) return api.sendMessage("You don't have a bank account yet!", threadID, messageID);
          const res = (await axios.get(`https://api.sdwdewhgdjwwdjs.repl.co/bank/top`)).data  
          if(res.status == false) return api.sendMessage('No data currently available!', threadID, messageID);
          var msg = res.message + '\n'
          for (let i of res.ranking) {
              msg += `${i.rank}. ${i.name} \n» 💰 Balance: ${i.money}$\n===========\n`
          }
          return api.sendMessage(msg, threadID, messageID);
      }
      case 'pay':
      case '-p': {
          if(checkBank.status == false) return api.sendMessage("You don't have a bank account yet!", threadID, messageID);
          if(!args[1] || !args[2] || !args[3]) return api.sendMessage('Please use: pay stk [recipient account number] [amount]', threadID, messageID);
          if(args[1] == 'stk') {
              api.sendMessage('Final step sent to your inbox', threadID, messageID);
              return api.sendMessage('Please reply to this message with your bank password to transfer!', senderID, (error, info) => 
                  global.client.handleReply.push({
                      name: this.config.name,
                      type: 'paySTK',
                      messageID: info.messageID,
                      author: event.senderID,
                      STK: args[2],
                      money: args[3],
                      threadID: threadID
                  })
              );
          }
          if(args[1] == 'id') {
              api.sendMessage('Final step sent to your inbox', threadID, messageID);
              return api.sendMessage('Please reply to this message with your bank password to transfer!', senderID, (error, info) => 
                  global.client.handleReply.push({
                      name: this.config.name,
                      type: 'payID',
                      messageID: info.messageID,
                      author: event.senderID,
                      ID: args[2],
                      money: args[3],
                      threadID: threadID
                  })
              );
          }
          break;
      }
      case 'send':
      case 'deposit':
      case 'topup': {
          if(checkBank.status == false) return api.sendMessage("You don't have a bank account yet!", threadID, messageID);
          if(!args[1]) return api.sendMessage('Please enter the amount to deposit!\nsend [amount]', threadID, messageID);
          var check = await checkMoney(senderID, args[1])
          if (check == false) return api.sendMessage("You don't have enough money to deposit!", threadID, messageID);
          await Currencies.decreaseMoney(senderID, parseInt(args[1]))
          const res = (await axios.get(`https://api.sdwdewhgdjwwdjs.repl.co/bank/send?senderID=${senderID}&money=${args[1]}`)).data  
          return api.sendMessage(`${res.message.noti}\n👤 Account holder: ${res.message.name}\n💰 Current balance: ${res.message.money}$`, threadID, messageID)
      }
      case 'password':
      case 'pw': {
          if(checkBank.status == false) return api.sendMessage("You don't have a bank account yet!", threadID, messageID);
          var type = args[1];
          switch(type) {
              case 'get': {
                  const res = (await axios.get(`https://api.sdwdewhgdjwwdjs.repl.co/bank/password?bka=${type}&dka=${senderID}`)).data 
                  api.sendMessage('Your password has been sent to your inbox', threadID, messageID);
                  return api.sendMessage(`Your bank password is: ${res.message.password}`, senderID);
              }
              case 'recovery':
              case 'new': {
                  api.sendMessage('Final step sent to your inbox', threadID, messageID);
                  return api.sendMessage('Please reply to this message to set a new password!', senderID, (error, info) => 
                      global.client.handleReply.push({
                          name: this.config.name,
                          type: 'newPassword',
                          messageID: info.messageID,
                          author: event.senderID,
                          threadID: threadID
                      })
                  );
              }
              default: {
                  return api.sendMessage("Use 'get' to retrieve your password or 'new' to set a new password.", threadID, messageID);
              }
          }
      }
      default: {
          const picture = (await axios.get(`https://i.imgur.com/5hkQ2CC.jpg`, { responseType: "stream"})).data
          return api.sendMessage({
              body: `=== 「 BANK SYSTEM 」 ===\n--------\n» register » Register a new account\n» info » View your account info\n» find » Find a bank account\n» get » Withdraw money\n» top » View top users\n» pay » Transfer money\n» send » Deposit money to your account\n» pw » Retrieve or change your password\n---------`,
              attachment: (picture)
          }, threadID, messageID);
      }
  }
  async function checkMoney(senderID, maxMoney) {
      var i, w;
      i = (await Currencies.getData(senderID)) || {};
      w = i.money || 0
      if (w < parseInt(maxMoney)) return false;
      else return true;
  }
}

module.exports.handleReply = async function ({ api, event, handleReply, Currencies }) {
  const axios = require('axios')
  const { senderID, messageID, threadID , body } = event;
  switch(handleReply.type) {
      case 'paySTK': {
          const res = (await axios.get(`https://api.sdwdewhgdjwwdjs.repl.co/bank/pay?type=STK&senderID=${senderID}&STK=${handleReply.STK}&money=${handleReply.money}&password=${body}`)).data 
          if(res.status == false) return api.sendMessage(res.message, threadID, messageID);
          api.sendMessage(`${res.message.noti}\n${res.message.data.message}`, threadID, messageID);
          return api.sendMessage(`${res.message.noti}\n\n${res.message.data.message}`, handleReply.threadID);
      }
      case 'payID': {
          const res = (await axios.get(`https://api.sdwdewhgdjwwdjs.repl.co/bank/pay?type=ID&senderID=${senderID}&userID=${handleReply.ID}&money=${handleReply.money}&password=${body}`)).data 
          if(res.status == false) return api.sendMessage(res.message, threadID, messageID);
          api.sendMessage(`${res.message.noti} ${res.message.data.message}`, threadID, messageID);
          return api.sendMessage(`${res.message.noti}\n\n${res.message.data.message}`, handleReply.threadID);
      }
      case 'getMoney': {
          const res = (await axios.get(`https://api.sdwdewhgdjwwdjs.repl.co/bank/get?ID=${senderID}&money=${handleReply.money}&password=${body}`)).data  
          if(res.status == false) return api.sendMessage(res.message, threadID, messageID);
          await Currencies.increaseMoney(senderID, parseInt(handleReply.money))
          api.sendMessage(`${res.message.noti}\n👤 Account holder: ${res.message.name}\n💰 Remaining balance: ${res.message.money}`, threadID, messageID);
          return api.sendMessage(`${res.message.noti}\n👤 Account holder: ${res.message.name}\n💰 Remaining balance: ${res.message.money}`, handleReply.threadID);
      }
      case 'newPassword': {
          const res = (await axios.get(`https://api.sdwdewhgdjwwdjs.repl.co/bank/password?bka=recovery&dka=${senderID}&fka=${body}`)).data  
          if(res.status == false) return api.sendMessage(res.message, threadID, messageID);
          api.sendMessage(`${res.message.noti}\n👤 Account holder: ${res.message.name}`, handleReply.threadID);
          return api.sendMessage(`Password changed successfully!\nCurrent password: ${res.message.password}`, threadID, messageID)
      }
  }
}