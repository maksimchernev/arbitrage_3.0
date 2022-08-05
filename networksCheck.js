'use strict';

const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const ccxt = require ('ccxt');
const { allowedNodeEnvironmentFlags } = require('process');
const { match } = require('assert');
const { Console } = require('console');

const bitrue = new ccxt.bitrue({
    apiKey: process.env.BITRUE_API_KEY,
    secret: process.env.BITRUE_API_SECRET
  });
const kucoin = new ccxt.kucoin({
    apiKey: process.env.KUCOIN_API_KEY,
    secret: process.env.KUCOIN_API_SECRET,
    password: process.env.KUCOIN_PASSWORD
    });
const binance = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_API_SECRET,
});
const mexc = new ccxt.mexc({
    apiKey: process.env.MEXC_API_KEY,
    secret: process.env.MEXC_API_SECRET
  });
const okx = new ccxt.okx({
    apiKey: process.env.OKX_API_KEY,
    secret: process.env.OKX_API_SECRET,
    password: process.env.OKX_PASSWORD
});
const huobi = new ccxt.huobi({
    apiKey: process.env.HUOBI_API_KEY,
    secret: process.env.HUOBI_API_SECRET,
});
const bybit = new ccxt.bybit({
    apiKey: process.env.BYBIT_API_KEY,
    secret: process.env.BYBIT_API_SECRET
});
const gateio = new ccxt.gateio({
    apiKey: process.env.GATEIO_API_KEY,
    secret: process.env.GATEIO_API_SECRET,
});
const bitfinex = new ccxt.bitfinex2({
    apiKey: process.env.BITFINEX_API_KEY,
    secret: process.env.BITFINEX_API_SECRET,
});
const exchanges = ['bitfinex', 'mexc', 'binance', 'okx', 'huobi', 'bitrue', 'bybit', 'kucoin', 'gateio']
const methods = ['fetchTransactionFees', 'fetchCurrencies']

const credentialsChecker =(arr)=> {
    for (let exchange of arr) {
        console.log(eval(exchange+'Client').checkRequiredCredentials())
    } 
}
const getAllFetchCurrencies = async (exchange) => {
    let areNetworksAvailable
    const response = await eval(exchange).fetchCurrencies()
    if (response['USDT'].hasOwnProperty('networks')) {
        areNetworksAvailable = true
    } else {
        areNetworksAvailable = false 
    }
    return({exchange: exchange, info: response, areNetworksAvailable: areNetworksAvailable, method: 'FC'})
}
const getAllFetchTransactionFees = async (exchange) => {
    let areNetworksAvailable
    let response = await eval(exchange).fetchTransactionFees()
    if (response.hasOwnProperty('withdraw')) {
        response = response.withdraw
        areNetworksAvailable = true
    } else {
        areNetworksAvailable = false
    }
    return({exchange: exchange, withdraw: response, areNetworksAvailable: areNetworksAvailable, method: 'FTFs'})
}
//возвращает массив exchange которые поддерживают выбранный метод
const getExchangesThatSupportMethods = (method) => {
    let exchangeClient
    let arr = []
    for (let exchange of exchanges) {
        exchangeClient = eval(exchange)
        if (exchangeClient.has[method] == true) {
            arr.push(exchange)
        }
    }
    return(arr)
}  

const getTransferAvailability = (exchange, baseTicker, AllPairsFC) => {
    let withdraw,
        deposit
    for (let obj of AllPairsFC) {
        if (obj.exchange == exchange) {
            if (obj.info.hasOwnProperty(baseTicker)) {
                withdraw = obj.info[baseTicker].withdraw
                deposit = obj.info[baseTicker].deposit
            } else {
                withdraw = null
                deposit = null
            }
                
        }
    }
    return [withdraw, deposit]
}

const getNetworks = async (exchange, baseTicker, AllPairs) => {
    let response
    let networks = []
    let found = false
    for (let obj of AllPairs) {
        if (obj.exchange == exchange && obj.areNetworksAvailable) {
            found = true
            if (obj.method == 'FTFs') {
                if (obj.withdraw.hasOwnProperty(baseTicker)) {
                    response = obj.withdraw[baseTicker]
                    for (let network in response) {
                        if (response[network] !== undefined) {
                            networks.push([network, response[network]])
                        } else {
                            networks.push([network, 'undefined'])
                        }
                    }
                } else {
                    networks = 'no such ticker FTFs'
                }
            } else if (obj.method == 'FC') {
                if (obj.info.hasOwnProperty(baseTicker)) {
                    response = obj.info[baseTicker].networks
                    for (let network in response) {
                        if (response[network].fee !== undefined && exchange == 'okx') {
                            networks.push([response[network].id, response[network].fee])
                        } else if (response[network].fee !== undefined) {
                            networks.push([response[network].network, response[network].fee])
                        } else {
                            networks.push([response[network].network, 'undefined'])
                        }
                    }
                } else {
                    networks = 'no such ticker FC'
                }
            }
        } 
    }
    if (!found) {
        response = await eval(exchange).fetchTransactionFee(baseTicker)
        if (exchange == 'kucoin') {
            response = response.info.data
            networks.push([response.chain, response.withdrawMinFee, 'defaunt network only'])
        } else {
            networks = 'do not know how to process pair for this network'
        }
    }
    return networks
}
const networkBeauty = (arr) => {
    if (Array.isArray(arr)) {
        for (let network of arr) {
            network[0] = network[0].toUpperCase()
            if (network[0].includes('(') && network[0].indexOf('(') > 1) {
                network[0] = network[0].slice(0,network[0].indexOf('('))
            } else if (network[0].includes('(') && network[0].indexOf('(') < 1) {
                network[0] = network[0].slice(network[0].indexOf(')')+1, network[0].length)
            }
            if (network[0].includes('ETH')) {
                network[0] = network[0].replace('ETH', 'ERC20')
            }
            if (network[0].includes('BSC')) {
                network[0] = network[0].replace('BSC', 'BEP20')
            }
            if (network[0].includes('FANTOM')) {
                network[0] = network[0].replace('FANTOM', 'FTM')
            }
        }
    } else {
        arr = null
    }
    return arr
}

const getTrades = async (exchangeBuy, exchangeSell, ticker) => {
    let tickerTradesBuy = await eval(exchangeBuy).fetchTrades(ticker, Date.now()-900000)
	let frequencyBuy = tickerTradesBuy.length/15
	let sumBuy = 0
	tickerTradesBuy.map((trade)=> {
		sumBuy += trade.amount
		return trade.amount
	})
	let averageAmountBuy  = sumBuy/tickerTradesBuy.length

    let tickerTradesSell = await eval(exchangeSell).fetchTrades(ticker, Date.now()-900000)
	let frequencySell = tickerTradesSell.length/15
	let sumSell = 0
	tickerTradesSell.map((trade)=> {
		sumSell += trade.amount
		return trade.amount
	})
	let averageAmountSell  = sumSell/tickerTradesSell.length

    return {averageAmountBuy, frequencyBuy, averageAmountSell, frequencySell}
}


const getLiquidity = async (buyExchange, sellExchange, ticker) => {
    let orderBookBuy = await eval(buyExchange).fetchOrderBook(ticker)
    let liquidityAsk = orderBookBuy.asks[0]

    let orderBookSell = await eval(sellExchange).fetchOrderBook(ticker)
    let liquidityBid = orderBookSell.bids[0]

    return {liquidityAsk, liquidityBid}
}


const networkMatch = async (arr) => {
    //const arr = JSON.parse(fs.readFileSync("./response.json", 'utf-8'))
    let exchangesThatSupportFC = getExchangesThatSupportMethods ('fetchCurrencies')
    let exchangesThatSupportFTFs = getExchangesThatSupportMethods ('fetchTransactionFees')
    let AllPairsFC =[]
    let AllPairsFTFs = []
    let matchedPairs = []
    let AllPairs = []
    let AllPairsWithNetworks = []
    let minQuantityReverse
    let matchPairsNetworksFactory = (ticker, buyExchange, sellExchange, buyPrice, sellPrice, profit, buyQuoteVolume, sellQuoteVolume, buySpread, sellSpread, widthdrawNetworksAndFees, depositNetwork, matchComment, buyTransferAvailability, sellTransferAvailability, minQuantity, minQuantityReverse, averageAmountBuy, frequencyBuy, averageAmountSell, frequencySell, liquidityAsk, liquidityBid) => {
        return {
            Ticker: ticker,
            Profit: profit,
            Match: matchComment,
            Min_Quantity: minQuantity,
            Min_Quantity_inPairFilter: minQuantityReverse,
            BuyExchange: {
                Name: buyExchange,
                Price: buyPrice,
                Quote_volume: buyQuoteVolume,
                Spread: buySpread,
                Average_amount_in_pairFilter_per_trade: averageAmountBuy,
                Trade_frequency_per_minute: frequencyBuy,
                Last_ask: liquidityAsk, 
                Widthdraw_Networks_With_Fees: widthdrawNetworksAndFees,
                Withdraw_Available: buyTransferAvailability
            },
            SellExchange: {
                Name: sellExchange,
                Price: sellPrice,
                Quote_volume: sellQuoteVolume,
                Spread: sellSpread,
                Average_amount_in_pairFilter_per_trade: averageAmountSell,
                Trade_frequency_per_minute: frequencySell,
                Last_bid: liquidityBid, 
                Deposit_Network: depositNetwork,
                Deposit_Available: sellTransferAvailability
            }
        }
    }
    try {
        await Promise.all(exchangesThatSupportFC.map(async (exchange) => getAllFetchCurrencies(exchange).then(res => AllPairsFC.push(res)).catch(e => console.log(e))))
        await Promise.all(exchangesThatSupportFTFs.map(async (exchange) => getAllFetchTransactionFees(exchange).then(res => AllPairsFTFs.push(res)).catch(e => console.log(e))))
    } catch(e) {
        throw new Error ('Error in getAllFetchCurrencies or getAllFetchTransactionFees')
    }
    for(let obj of arr) {
        let buyExchange = obj.route[0],
            sellExchange = obj.route[1],
            baseTicker = obj.ticker.slice(0,obj.ticker.indexOf('/')),
            match,
            minQuantity
        let buyTransferAvailability = getTransferAvailability(buyExchange, baseTicker, AllPairsFC)
        let sellTransferAvailability = getTransferAvailability(sellExchange, baseTicker, AllPairsFC)
        //exchangesThatSupportFC = exchangesThatSupportFC.filter(ex => !exchangesThatSupportFTFs.includes(ex))
        //exchangesThatSupportFC = exchangesThatSupportFC.filter(ex => !exchangesThatSupportFTF.includes(ex))
        AllPairs = AllPairsFTFs.concat(AllPairsFC)
        let buyNetworks
        let sellNetworks 
        try {
            buyNetworks = await getNetworks(buyExchange, baseTicker, AllPairs)
            sellNetworks = await getNetworks(sellExchange, baseTicker, AllPairs)
        } catch(e) {
            throw new Error ('Error in getNetworks')
        }
        buyNetworks = networkBeauty(buyNetworks)
        sellNetworks = networkBeauty(sellNetworks)
        let breakCheck = false
        if (buyNetworks !== null && sellNetworks !== null) {
            for (let buyNetwork of buyNetworks) {
                for (let sellNetwork of sellNetworks) {
                    if (buyNetwork[0].includes(sellNetwork[0]) || sellNetwork[0].includes(buyNetwork[0])) {
                        match = true
                        minQuantity = buyNetwork[1]/obj.profit *100
                        minQuantityReverse = minQuantity*obj.buyPrice
                        breakCheck = true
                        break
                    } else {
                        match = false
                        minQuantity = undefined
                    }
                }
                if (breakCheck) break;
            }
        } else {
            match = null
        }
        sellNetworks = sellNetworks.map(arr => arr[0])
        AllPairsWithNetworks.push(matchPairsNetworksFactory(obj.ticker, buyExchange, sellExchange, obj.buyPrice, obj.sellPrice, obj.profit, obj.buyQuoteVolume, obj.sellQuoteVolume, obj.buySpread, obj.sellSpread, buyNetworks, sellNetworks, match, buyTransferAvailability[0], sellTransferAvailability[1], minQuantity, minQuantityReverse, undefined, undefined, undefined,undefined,undefined,undefined))
        if(match === true && buyTransferAvailability[0] !== false && sellTransferAvailability[1] !== false ) {
            console.log(`Getting trades and liquidity for ${obj.route}, ${obj.ticker}`)
            try {
                let {averageAmountBuy, frequencyBuy, averageAmountSell, frequencySell} = await getTrades(buyExchange, sellExchange, obj.ticker)
                let {liquidityAsk, liquidityBid} = await getLiquidity(buyExchange, sellExchange, obj.ticker)
                matchedPairs.push(matchPairsNetworksFactory(obj.ticker, buyExchange, sellExchange, obj.buyPrice, obj.sellPrice, obj.profit, obj.buyQuoteVolume, obj.sellQuoteVolume, obj.buySpread, obj.sellSpread, buyNetworks, sellNetworks, match, buyTransferAvailability[0], sellTransferAvailability[1], minQuantity, minQuantityReverse, averageAmountBuy, frequencyBuy, averageAmountSell, frequencySell, liquidityAsk, liquidityBid))
            } catch(e) {
                throw new Error ('Error in getLiquidity or getTrades')
            }
        }
    }
    let resultJSON = JSON.stringify(AllPairsWithNetworks, null, 2)
    fs.writeFileSync('../AllPairsWithNetworks.json', resultJSON, err => {
        if (err) {
            console.log('Error writing file AllPairsWithNetworks', err)
        } else {
            console.log('Successfully wrote file AllPairsWithNetworks')
        }
    })
    return(matchedPairs)
}
//networkMatch()
module.exports = networkMatch

