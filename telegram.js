const run = require('./app.js');
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');
const token = '5499009668:AAELQB862RizYwxIeuaLTYYSarGGEgHhkQs';
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Write filters like: pairFilter; profitFilter; volumeFilter. Make sure that the volume is specified in the units of the pair filter ")
});
bot.onText(/\/sendresults/, (msg) => {
  bot.sendDocument(msg.chat.id, "../response.json")
});
  
bot.on('message', (msg) => {
  let profitFilter,
        pairFilter,
        volumeFilter
  if (msg.text !== '/start' && msg.text !== '/sendresults') {
    let re = /\s*(?:;|$)\s*/
    let msgArr = msg.text.split(re)
    if ((msg.text.match(/;/g) || []).length !== 2) {
      bot.sendMessage(msg.chat.id, 'invalid format. Make sure it is divided by ;')
    } else if (!isNaN(msgArr[0])){
      bot.sendMessage(msg.chat.id, 'invalid format. Make sure pair filter is a string')
    } else if (isNaN(msgArr[1])){
      bot.sendMessage(msg.chat.id, 'invalid format. Make sure price filter is a number')
    } else if (isNaN(msgArr[2])){
      bot.sendMessage(msg.chat.id, 'invalid format. Make sure volume filter is a number')
    } else {
      pairFilter = msgArr[0].toUpperCase()
      profitFilter = msgArr[1]
      volumeFilter = msgArr[2]
      bot.sendMessage(msg.chat.id, `Pair filter is '${pairFilter}', profit filter is '${profitFilter}'%, volume filter is '${volumeFilter}'. Is it correct?. If not just start over`, {
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
        volumeFilter = requestArray[2]*1
  run(pairFilter, profitFilter, volumeFilter).then(result => {
    console.log(result)
    return fs.writeFile('../response.json', result, err => {
      if (err) {
          console.log('Error writing file', err)
      } else {
          console.log('Successfully wrote file')
          bot.sendMessage(id, 'Successfully wrote file. Type /sendresults to get file')
      }
  })    
  })
  
})

