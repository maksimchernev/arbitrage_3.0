const run = require('./app.js');
const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const token = process.env.TG_KEY;
const bot = new TelegramBot(token, {polling: true});

const mongoose = require('mongoose')

const db = 'mongodb+srv://nuarr2:cHbuUsSC.2YyNDK@cluster0.y1jvm.mongodb.net/arbitrage_by_papix?retryWrites=true&w=majority'
const writeCombinationsToDB = require('./db.js');
const getUniqueCombinations = require('./getUniqueCombinations.js');

let interval = 120000

let nIntervId = null
mongoose
  .connect(db)
  .then((res) => console.log('Connected to DB'))
  .catch((e) => console.log(e))


bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Write filters like: pairFilter; profitFilter; volumeFilter; spreadFilter. Make sure that the volume is specified in the units of the pair filter ")
});

bot.onText(/\/sendresults/, (msg) => {
  bot.sendDocument(msg.chat.id, "../matchedPairs.json")
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
                text: 'Get results instantly',
                callback_data: `${msg.text}`
              }
            ],
            [
              {
                text: 'Subscribe to signals',
                callback_data: `${msg.text} ; signals`
              }
            ],
            [
              {
                text: 'Unsubscribe',
                callback_data: `Unsubscribe`
              }
            ],
          ]
        }
      });
    }
  }
});

bot.on("polling_error", console.log);
bot.on('callback_query', query => {
  const id = query.message.chat.id;
  if (query.data == 'Unsubscribe') {
    if (nIntervId) {
      clearInterval(nIntervId)
      nIntervId = null
      bot.sendMessage(id, 'Unsubscribed!')
    } else {
      bot.sendMessage(id, 'You are not subscribed yet')
    }
    
  } else {
    let re = /\s*(?:;|$)\s*/
    let requestArray = query.data.split(re)
    let profitFilter = requestArray[1]*1,
    pairFilter = requestArray[0].toUpperCase(),
    volumeFilter = requestArray[2]*1,
    spreadFilter = requestArray[3]*1
    console.log(`Filters: ${pairFilter}, ${profitFilter}, ${volumeFilter}, ${spreadFilter}`)
    if (typeof requestArray[4] === 'undefined') {
      run(pairFilter, profitFilter, volumeFilter, spreadFilter).then(async result => {

        let quantity = result.length
        let responseJson = JSON.stringify(result, null, 2)

        //1st async
        fs.writeFile('../matchedPairs.json', responseJson, err => {
          if (err) {
              console.log('Error writing matched pairs file (get results instantly)', err)
          } else {
              console.log('Successfully wrote matched pairs file (get results instantly)')
              bot.sendMessage(id, `Found ${quantity} matched combinations and . . . Successfully wrote file! Type /sendresults to get it or type /sendallresults to get all results with networks`)
          }
        })
        writeCombinationsToDB(result)

      }).catch(e => {
        console.log(e)
        bot.sendMessage(id, e)
      })
    } else {
      if (!nIntervId) {
        bot.sendMessage(id, `Launch interval is ${interval/1000/60}min`);
        nIntervId = setInterval(()=> {
          run(pairFilter, profitFilter, volumeFilter, spreadFilter).then(async currentCombinations => {
            let responseJson = JSON.stringify(currentCombinations, null, 2)
            console.log('got current combinations')

            //1st async
            fs.writeFile('../matchedPairs.json', responseJson, err => {
              if (err) {
                  console.log('Error writing matched pairs file (sub)', err)
              } else {
                  console.log('Successfully wrote matched pairs file (sub)')
              }
            })

            
            //3rd async
            let uniqueCombinations
            try {
              uniqueCombinations = await getUniqueCombinations(currentCombinations)
            } catch (e) {
              console.log('Error getting unique combinations')
            }
             //2nd async

            if (uniqueCombinations.length != 0) {
              console.log('Unique combinations found', uniqueCombinations.length);
              writeCombinationsToDB(uniqueCombinations)
                .then(
                  console.log('successfully written unique pairs to db (sub)')
                ).catch(
                  console.log('error writing unique pairs to db (sub)')
                )
              for (let obj of uniqueCombinations) {
  /*                     console.log('Ticker', obj.Ticker);
                console.log('Buy', obj.BuyExchange.Name);
                console.log('Sell', obj.SellExchange.Name);
                console.log(obj.BuyExchange.Widthdraw_Networks_With_Fees.toString());
                console.log(obj.SellExchange.Deposit_Network.toString()); */
  
                let md = `
                    *Ticker* ${obj.Ticker}
                    *Profit* ${obj.Profit}
                    *Match* ${obj.Match}
                    *Min_Quantity* ${obj.Min_Quantity}
                    *Min_Quantity_inPairFilter* ${obj.Min_Quantity_inPairFilter}
                    *|BuyExchange|* 
                    *Name* ${obj.BuyExchange.Name}
                    *Price* ${obj.BuyExchange.Price}
                    *Spread* ${obj.BuyExchange.Spread}
                    *Average_amount_in_pairFilter_per_trade* ${obj.BuyExchange.Average_amount_in_pairFilter_per_trade}
                    *Trade_frequency_per_minute* ${obj.BuyExchange.Trade_frequency_per_minute}
                    *Last_ask* ${obj.BuyExchange.Last_ask}
                    *Widthdraw_Networks_With_Fees* ${obj.BuyExchange.Widthdraw_Networks_With_Fees}
                    *Withdraw_Available* ${obj.BuyExchange.Withdraw_Available}
                    *|SellExchange|* 
                    *Name* ${obj.SellExchange.Name}
                    *Price* ${obj.SellExchange.Price}
                    *Spread* ${obj.SellExchange.Spread}
                    *Average_amount_in_pairFilter_per_trade* ${obj.SellExchange.Average_amount_in_pairFilter_per_trade}
                    *Trade_frequency_per_minute* ${obj.SellExchange.Trade_frequency_per_minute}
                    *Last_bid* ${obj.SellExchange.Last_bid}
                    *Deposit_Network* ${obj.SellExchange.Deposit_Network}
                    *Deposit_Available* ${obj.SellExchange.Deposit_Available}
                  `;
                bot.sendMessage(id, md, { parse_mode: 'Markdown' });
              }
            } else {
              console.log('no unique combinations found')
              //bot.sendMessage(id, 'no unique combinations found');
            }
          }).catch(e => {
            console.log(e)
            bot.sendMessage(id, e)
          })
        }, interval)
      } else {
        bot.sendMessage(id, 'Already subscribed!')
      }
    }
  }
})

