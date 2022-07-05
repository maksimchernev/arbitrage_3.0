const run = require('./app.js');
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const token = process.env.TG_KEY;
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Write filters like: pairFilter; profitFilter; volumeFilter; spreadFilter. Make sure that the volume is specified in the units of the pair filter ")
});
bot.onText(/\/sendresults/, (msg) => {
  bot.sendDocument(msg.chat.id, "../response.json")
});
bot.onText(/\/sendallresults/, (msg) => {
  bot.sendDocument(msg.chat.id, "../AllPairsWithNetworks.json")
});
  
bot.on('message', (msg) => {
  let profitFilter,
        pairFilter,
        volumeFilter,
        spreadFilter
  if (msg.text !== '/start' && msg.text !== '/sendresults' && msg.text !== '/sendallresults') {
    let re = /\s*(?:;|$)\s*/
    let msgArr = msg.text.split(re)
    if ((msg.text.match(/;/g) || []).length !== 3) {
      bot.sendMessage(msg.chat.id, 'invalid format. Make sure it is divided by ;')
    } else if (!isNaN(msgArr[0])){
      bot.sendMessage(msg.chat.id, 'invalid format. Make sure pair filter is a string')
    } else if (isNaN(msgArr[1])){
      bot.sendMessage(msg.chat.id, 'invalid format. Make sure price filter is a number')
    } else if (isNaN(msgArr[2])){
      bot.sendMessage(msg.chat.id, 'invalid format. Make sure volume filter is a number')
    } else if (isNaN(msgArr[3])){
      bot.sendMessage(msg.chat.id, 'invalid format. Make sure spread filter is a number')
    }else {
      pairFilter = msgArr[0].toUpperCase()
      profitFilter = msgArr[1]
      volumeFilter = msgArr[2]
      spreadFilter = msgArr[3]
      bot.sendMessage(msg.chat.id, `Pair filter is '${pairFilter}', profit filter is '${profitFilter}%', volume filter is '${volumeFilter}${pairFilter}', spread filter is '${spreadFilter}%'. Is it correct?. If not just start over`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Yess',
                callback_data: `${msg.text}`
              }
            ]
          ]
        }
      });
    }
  }
});

bot.on("polling_error", console.log);
bot.on('callback_query', query => {
  const id = query.message.chat.id;
  let re = /\s*(?:;|$)\s*/
  let requestArray = query.data.split(re)
  let profitFilter = requestArray[1]*1,
        pairFilter = requestArray[0].toUpperCase(),
        volumeFilter = requestArray[2]*1,
        spreadFilter = requestArray[3]*1
  console.log(`Filters: ${pairFilter}, ${profitFilter}, ${volumeFilter}, ${spreadFilter}`)
  run(pairFilter, profitFilter, volumeFilter, spreadFilter).then(result => {
    let quantity = result.length
    let responseJson = JSON.stringify(result, null, 2)
    
    if (responseJson === 'None found :(') {
      bot.sendMessage(id, 'None found :(')
    } else {
      return fs.writeFile('../response.json', responseJson, err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
            bot.sendMessage(id, `Found ${quantity} matched combinations and . . . Successfully wrote file! Type /sendresults to get it or type /sendallresults to get all results with networks`)
        }
    })  
    }
  
  }).catch(e => {
    console.log(e)
    bot.sendMessage(id, 'Whoops something went very wrong. Probable an exchange failed to respond on time. Try again!')
  })
  
})

