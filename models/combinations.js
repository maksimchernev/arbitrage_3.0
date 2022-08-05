const mongoose = require('mongoose')
const Schema = mongoose.Schema

const combinationsSchema = new Schema({
    Ticker: {
        type: String,
        required: true,
    },
    Profit: {
        type: Number,
        required: true,
    },
    Match: {
        type: Boolean,
        required: true,
    },
    Min_Quantity: {
        type: Number,
        required: false,
    },
    Min_Quantity_inPairFilter: {
        type: Number,
        required: false,
    },
    Buy_Exchange: {
        type: String,
        required: true,
    },
    Buy_Price: {
        type: Number,
        required: true,
    }, 
    Buy_Quote_Volume: {
        type: Number,
        required: false,
    }, 
    Buy_Spread: {
        type: Number,
        required: false,
    }, 
    Buy_Average_Amount_In_PairFilter_Per_Trade: {
        type: Number,
        required: true,
    },
    Buy_Trade_Frequency_Per_Minute: {
        type: Number,
        required: true,
    },
    Last_ask: {
        type: Array,
        required: true,
    }, 
    Withdraw_Networks_With_Fees: {
        type: Array,
        required: false,
    },
    Withdraw_Available: {
        type: Boolean,
        required: false,
    },
    Sell_Exchange: {
        type: String,
        required: true,
    },
    Sell_Price: {
        type: Number,
        required: true,
    }, 
    Sell_Quote_Volume: {
        type: Number,
        required: false,
    }, 
    Sell_Spread: {
        type: Number,
        required: false,
    }, 
    Sell_Average_Amount_In_PairFilter_Per_Trade: {
        type: Number,
        required: true,
    },
    Sell_Trade_Frequency_Per_Minute: {
        type: Number,
        required: true,
    },
    Last_bid: {
        type: Array,
        required: true,
    }, 
    Deposit_Networks_With_Fees: {
        type: Array,
        required: false,
    },
    Deposit_Available: {
        type: Boolean,
        required: false,
    }
}, {timestamps: true})

const Combinations = mongoose.model('Combinations', combinationsSchema)

module.exports = Combinations;