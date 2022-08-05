const Combinations = require('./models/combinations')
const db = 'mongodb+srv://nuarr2:cHbuUsSC.2YyNDK@cluster0.y1jvm.mongodb.net/?retryWrites=true&w=majority'

const writeCombinationsToDB = async (matchedPairs) => {
        for (let combo of matchedPairs) {
            let Ticker = combo.Ticker,
                Profit = combo.Profit,
                Match = combo.Match,
                Min_Quantity= combo.Min_Quantity,
                Min_Quantity_inPairFilter = combo.Min_Quantity_inPairFilter,
                Buy_Exchange = combo.BuyExchange.Name,
                Buy_Price = combo.BuyExchange.Price,
                Buy_Quote_Volume = combo.BuyExchange.Quote_volume,
                Buy_Spread = combo.BuyExchange.Spread,
                Buy_Average_Amount_In_PairFilter_Per_Trade = combo.BuyExchange.Average_amount_in_pairFilter_per_trade,
                Buy_Trade_Frequency_Per_Minute = combo.BuyExchange.Trade_frequency_per_minute,
                Last_ask = combo.BuyExchange.Last_ask,
                Withdraw_Networks_With_Fees = combo.BuyExchange.Widthdraw_Networks_With_Fees,
                Withdraw_Available = combo.BuyExchange.Withdraw_Available,
    
                Sell_Exchange = combo.SellExchange.Name,
                Sell_Price = combo.SellExchange.Price,
                Sell_Quote_Volume = combo.SellExchange.Quote_volume,
                Sell_Spread = combo.SellExchange.Spread,
                Sell_Average_Amount_In_PairFilter_Per_Trade = combo.SellExchange.Average_amount_in_pairFilter_per_trade,
                Sell_Trade_Frequency_Per_Minute = combo.SellExchange.Trade_frequency_per_minute,
                Last_bid = combo.SellExchange.Last_bid,
                Deposit_Networks_With_Fees = combo.SellExchange.Deposit_Network,
                Deposit_Available = combo.SellExchange.Deposit_Available
            const combinations = new Combinations({Ticker, Profit, Match, Min_Quantity, Min_Quantity_inPairFilter, Buy_Exchange, Buy_Price, Buy_Quote_Volume, Buy_Spread, Buy_Average_Amount_In_PairFilter_Per_Trade, Buy_Trade_Frequency_Per_Minute, Last_ask, Withdraw_Networks_With_Fees, Withdraw_Available, Sell_Exchange, Sell_Price, Sell_Quote_Volume, Sell_Spread, Sell_Average_Amount_In_PairFilter_Per_Trade, Sell_Trade_Frequency_Per_Minute, Last_bid, Deposit_Networks_With_Fees, Deposit_Available})
            try {
                await combinations.save()
            } catch(e) {
                console.log(`did not wrote for ${Ticker} buy ${Buy_Exchange} sell ${Sell_Exchange}`, e)
            }
        }
}
module.exports = writeCombinationsToDB