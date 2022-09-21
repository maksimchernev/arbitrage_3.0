const Routes = require('./models/routes')

const writeRoutesToDB = async (matchedRoutes) => {
        for (let route of matchedRoutes) {
            let Profit = route.Profit,
                Match = route.Match,
                Min_Quantity_inPairFilter = route.Min_Quantity_inPairFilter,

                Ex1 = route.StepOne.Name,
                Ticker1 = route.StepOne.Ticker,
                Price1 = route.StepOne.Price,
                Min_Quantity1 = route.StepOne.Min_Quantity,
                Quote_volume1 = route.StepOne.Quote_volume,
                Spread1 = route.StepOne.Spread,
                Average_amount_per_trade1 = route.StepOne.Average_amount_per_trade,
                Trade_frequency_per_minute1 = route.StepOne.Trade_frequency_per_minute,
                Last_ask_or_bid1 = route.StepOne.Last_ask_or_bid,
                Networks_With_Fees_Withdraw1 = route.StepOne.Networks_With_Fees_Withdraw,
                Withdraw_Available1 = route.StepOne.Withdraw_Available,

                Ex2 = route.StepTwo.Name,
                Ticker2 = route.StepTwo.Ticker,
                Price2 = route.StepTwo.Price,
                Min_Quantity2 = route.StepTwo.Min_Quantity,
                Quote_volume2 = route.StepTwo.Quote_volume,
                Spread2 = route.StepTwo.Spread,
                Average_amount_per_trade2 = route.StepTwo.Average_amount_per_trade,
                Trade_frequency_per_minute2 = route.StepTwo.Trade_frequency_per_minute,
                Last_ask_or_bid2 = route.StepTwo.Last_ask_or_bid,
                Networks_Deposit2 = route.StepTwo.Networks_Deposit,
                Deposit_Available2 = route.StepTwo.Deposit_Available,
                Networks_With_Fees_Withdraw2 = route.StepTwo.Networks_With_Fees_Withdraw,
                Withdraw_Available2 = route.StepTwo.Withdraw_Available,

                Ex3 = route.StepThree.Name,
                Ticker3 = route.StepThree.Ticker,
                Price3 = route.StepThree.Price,
                Quote_volume3 = route.StepThree.Quote_volume,
                spread3 = route.StepThree.Spread,
                Average_amount_per_trade3 = route.StepThree.Average_amount_per_trade,
                Trade_frequency_per_minute3 = route.StepThree.Trade_frequency_per_minute,
                Last_ask_or_bid3 = route.StepThree.Last_ask_or_bid,
                Networks_Deposit3 = route.StepThree.Networks_Deposit,
                Deposit_Available3 = route.StepThree.Deposit_Available
            const routes = new Routes({Profit, Match, Min_Quantity_inPairFilter, Ex1, Ticker1, Price1, Min_Quantity1, Quote_volume1, Spread1, Average_amount_per_trade1, Trade_frequency_per_minute1, Last_ask_or_bid1, Networks_With_Fees_Withdraw1, Withdraw_Available1, Ex2, Ticker2, Price2, Min_Quantity2, Quote_volume2, Spread2, Average_amount_per_trade2, Trade_frequency_per_minute2, Last_ask_or_bid2, Last_ask_or_bid2, Networks_Deposit2, Deposit_Available2, Networks_With_Fees_Withdraw2,Withdraw_Available2, Ex3,Ticker3,Price3,Quote_volume3,spread3, Average_amount_per_trade3, Trade_frequency_per_minute3,Last_ask_or_bid3,  Networks_Deposit3, Deposit_Available3   })
            try {
                await routes.save()
            } catch(e) {
                console.log(`did not wrote for  ${route.StepOne.Ticker} -> ${route.StepTwo.Ticker} -> ${route.StepThree.Ticker} exchanges: ${route.StepOne.Name} -> ${route.StepTwo.Name} -> ${route.StepThree.Name}`, e)
            }
        }
}
module.exports = writeRoutesToDB