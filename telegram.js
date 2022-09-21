const run = require('./app.js');
const fs = require('fs')
process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const token = process.env.TG_KEY;
const bot = new TelegramBot(token, {polling: true});

const mongoose = require('mongoose')

const db = 'mongodb+srv://nuarr2:cHbuUsSC.2YyNDK@cluster0.y1jvm.mongodb.net/arbitrage_by_papix_3?retryWrites=true&w=majority'
const writeRoutesToDB = require('./db.js');
const getUniqueRoutes = require('./getUniqueRoutes.js');

let interval = 200000

let nIntervId = null
mongoose
  .connect(db)
  .then((res) => console.log('Connected to DB'))
  .catch((e) => console.log(e))


bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Write filters like: pairFilter; profitFilter; volumeFilter; spreadFilter. Make sure that the volume is specified in the units of the pair filter ")
});

bot.onText(/\/sendresults/, async (msg) => {
  bot.sendDocument(msg.chat.id, "./data_for_tg/matchedRoutes.json")
});
bot.onText(/\/sendallresults/, async (msg) => {
  bot.sendDocument(msg.chat.id, "./data_for_tg/AllRoutesWithNetworks.json")
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
  ///                       !
  //unsubscribe logic       !
  ///                       !
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
    ///                       !
    //get results instantly   !
    ///                       !
      run(pairFilter, profitFilter, volumeFilter, spreadFilter).then(async result => {

        let quantity = result.length
        let responseJson = JSON.stringify(result, null, 2)

        //1st async
        if (!requestArray[4]) {
          fs.writeFile('./data_for_tg/matchedRoutes.json', responseJson, err => {
            if (err) {
                console.log('Error writing matched routes file (get results instantly)', err)
            } else {
                console.log('Successfully wrote matched routes file (get results instantly)')
                bot.sendMessage(id, `Found ${quantity} matched Routes and . . . Successfully wrote file! Type /sendresults to get it or type /sendallresults to get all results with networks`)
            }
          })
          writeRoutesToDB(result)
        }
      }).catch(e => {
        console.log(e)
        bot.sendMessage(id, e)
      })
    ///                       !
    //subscribe to signals    !
    ///                       !
    if (requestArray[4]) {
      if (!nIntervId) {
        bot.sendMessage(id, `Launch interval is ${interval/1000/60}min`);
        let numOfRuns = 0
        nIntervId = setInterval(()=> {
          
          run(pairFilter, profitFilter, volumeFilter, spreadFilter).then(async currentRoutes => {
            if (currentRoutes.length > 0) {
              numOfRuns = numOfRuns +1
              if (numOfRuns == 1) {
                writeRoutesToDB(currentRoutes)
                    .then(
                      console.log('successfully written currentRoutes routes to db (sub)')
                    ).catch(
                      console.log('error writing currentRoutes routes to db (sub)')
                    )
              }
            }
            let responseJson = JSON.stringify(currentRoutes, null, 2)


            console.log('got current Routes')

            //1st async
            fs.writeFile('./data_for_tg/matchedRoutes.json', responseJson, err => {
              if (err) {
                  console.log('Error writing matched routes file (sub)', err)
              } else {
                  console.log('Successfully wrote matched routes file (sub)')
              }
            })

            
            //3rd async
            let uniqueRoutes
            try {
              uniqueRoutes = await getUniqueRoutes(currentRoutes)
            } catch (e) {
              console.log('Error getting unique Routes')
            }
             //2nd async

            if (uniqueRoutes!= undefined && uniqueRoutes.length != 0) {
              console.log('Unique Routes found', uniqueRoutes.length);
              writeRoutesToDB(uniqueRoutes)
                .then(
                  console.log('successfully wrote unique routes to db (sub)')
                ).catch(
                  console.log('error writing unique routes to db (sub)')
                )
              for (let obj of uniqueRoutes) {
  /*                     console.log('Ticker', obj.Ticker);
                console.log('Buy', obj.BuyExchange.Name);
                console.log('Sell', obj.SellExchange.Name);
                console.log(obj.BuyExchange.Widthdraw_Networks_With_Fees.toString());
                console.log(obj.SellExchange.Deposit_Network.toString()); */
  
                let md = `
                    *Profit* ${obj.Profit}
                    *Match* ${obj.Match}
                    *Min_Quantity_inPairFilter* ${obj.Min_Quantity_inPairFilter}
                    *|StepOne|* 
                    *Name* ${obj.StepOne.Name}
                    *Ticker* ${obj.StepOne.Ticker}
                    *Price* ${obj.StepOne.Price}
                    *Min_Quantity* ${obj.StepOne.Min_Quantity}
                    *Quote_volume* ${obj.StepOne.Quote_volume}
                    *Spread* ${obj.StepOne.Spread}
                    *Average_amount_per_trade* ${obj.StepOne.Average_amount_per_trade}
                    *Trade_frequency_per_minute* ${obj.StepOne.Trade_frequency_per_minute}
                    *Last_ask_or_bid* ${obj.StepOne.Last_ask_or_bid}
                    *Networks_With_Fees_Withdraw* ${obj.StepOne.Networks_With_Fees_Withdraw}
                    *Withdraw_Available* ${obj.StepOne.Withdraw_Available}
                    *|StepTwo|* 
                    *Name* ${obj.StepTwo.Name}
                    *Ticker* ${obj.StepTwo.Ticker}
                    *Price* ${obj.StepTwo.Price}
                    *Min_Quantity* ${obj.StepTwo.Min_Quantity}
                    *Quote_volume* ${obj.StepTwo.Quote_volume}
                    *Spread* ${obj.StepTwo.Spread}
                    *Average_amount_per_trade* ${obj.StepTwo.Average_amount_per_trade}
                    *Trade_frequency_per_minute* ${obj.StepTwo.Trade_frequency_per_minute}
                    *Last_ask_or_bid* ${obj.StepTwo.Last_ask_or_bid}
                    *Networks_Deposit* ${obj.StepTwo.Networks_Deposit}
                    *Deposit_Available* ${obj.StepTwo.Deposit_Available}
                    *Networks_With_Fees_Withdraw* ${obj.StepTwo.Networks_With_Fees_Withdraw}
                    *Withdraw_Available* ${obj.StepTwo.Withdraw_Available}
                    *|StepThree|* 
                    *Name* ${obj.StepThree.Name}
                    *Ticker* ${obj.StepThree.Ticker}
                    *Price* ${obj.StepThree.Price}
                    *Quote_volume* ${obj.StepThree.Quote_volume}
                    *Spread* ${obj.StepThree.Spread}
                    *Average_amount_per_trade* ${obj.StepThree.Average_amount_per_trade}
                    *Trade_frequency_per_minute* ${obj.StepThree.Trade_frequency_per_minute}
                    *Last_ask_or_bid* ${obj.StepThree.Last_ask_or_bid}
                    *Networks_Deposit* ${obj.StepThree.Networks_Deposit}
                    *Deposit_Available* ${obj.StepThree.Deposit_Available}
                  `;
                bot.sendMessage(id, md, { parse_mode: 'Markdown' });
              }
            } else {
              console.log('no unique Routes found')
              //bot.sendMessage(id, 'no unique Routes found');
            }
          }).catch(e => {
            console.log(e)
          })
        }, interval)
      } else {
        bot.sendMessage(id, 'Already subscribed!')
      }
    }
  }
})

