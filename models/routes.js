const mongoose = require('mongoose')
const Schema = mongoose.Schema

const routesSchema = new Schema({
    Profit: {
        type: Number,
        required: true,
    },
    Match: {
        type: Boolean,
        required: true,
    },
    Min_Quantity_inPairFilter: {
        type: 'mixed',
        required: false,
    },
    Ex1: {
        type: String,
        required: true,
    },
    Ticker1: {
        type: String,
        required: true,
    },
    Price1: {
        type: Number,
        required: true,
    }, 
    Min_Quantity1: {
        type: 'mixed',
        required: true,
    }, 
    Quote_volume1: {
        type: 'mixed',
        required: false,
    }, 
    Spread1: {
        type: Number,
        required: false,
    }, 
    Average_amount_per_trade1: {
        type: 'mixed',
        required: true,
    },
    Trade_frequency_per_minute1: {
        type: 'mixed',
        required: true,
    },
    Last_ask_or_bid1: {
        type: Array,
        required: true,
    }, 
    Networks_With_Fees_Withdraw1: {
        type: Array,
        required: false,
    },
    Withdraw_Available1: {
        type: Boolean,
        required: false,
    },
    Ex2: {
        type: String,
        required: true,
    },
    Ticker2: {
        type: String,
        required: true,
    },
    Price2: {
        type: Number,
        required: true,
    }, 
    Min_Quantity2: {
        type: 'mixed',
        required: true,
    }, 
    Quote_volume2: {
        type: 'mixed',
        required: false,
    }, 
    Spread2: {
        type: Number,
        required: false,
    }, 
    Average_amount_per_trade2: {
        type: 'mixed',
        required: true,
    },
    Trade_frequency_per_minute2: {
        type: 'mixed',
        required: true,
    },
    Last_ask_or_bid2: {
        type: Array,
        required: true,
    }, 
    Networks_Deposit2: {
        type: Array,
        required: false,
    },
    Deposit_Available2: {
        type: Boolean,
        required: false,
    },
    Networks_With_Fees_Withdraw2: {
        type: Array,
        required: false,
    },
    Withdraw_Available2: {
        type: Boolean,
        required: false,
    },
    Ex3: {
        type: String,
        required: true,
    },
    Ticker3: {
        type: String,
        required: true,
    },
    Price3: {
        type: Number,
        required: true,
    }, 
    Quote_volume3: {
        type: 'mixed',
        required: false,
    }, 
    spread3: {
        type: Number,
        required: false,
    }, 
    Average_amount_per_trade3: {
        type: 'mixed',
        required: true,
    },
    Trade_frequency_per_minute3: {
        type: 'mixed',
        required: true,
    },
    Last_ask_or_bid3: {
        type: Array,
        required: true,
    }, 
    Networks_Deposit3: {
        type: Array,
        required: false,
    },
    Deposit_Available3: {
        type: Boolean,
        required: false,
    }
}, {timestamps: true})

const Routes = mongoose.model('Routes', routesSchema)

module.exports = Routes;