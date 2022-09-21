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
    secret: process.env.BITRUE_API_SECRET,
    options: {'defaultType': 'spot' }
  });
const kucoin = new ccxt.kucoin({
    apiKey: process.env.KUCOIN_API_KEY,
    secret: process.env.KUCOIN_API_SECRET,
    password: process.env.KUCOIN_PASSWORD,
    options: {'defaultType': 'spot' }
    });
const binance = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_API_SECRET,
    options: {'defaultType': 'spot' }
});
const mexc = new ccxt.mexc({
    apiKey: process.env.MEXC_API_KEY,
    secret: process.env.MEXC_API_SECRET,
    options: {'defaultType': 'spot' }
  });
const okx = new ccxt.okx({
    apiKey: process.env.OKX_API_KEY,
    secret: process.env.OKX_API_SECRET,
    password: process.env.OKX_PASSWORD,
    options: {'defaultType': 'spot' }
});
const huobi = new ccxt.huobi({
    apiKey: process.env.HUOBI_API_KEY,
    secret: process.env.HUOBI_API_SECRET,
    options: {'defaultType': 'spot' }
});
const bybit = new ccxt.bybit({
    apiKey: process.env.BYBIT_API_KEY,
    secret: process.env.BYBIT_API_SECRET,
    options: {'defaultType': 'spot' }
});
const gateio = new ccxt.gateio({
    apiKey: process.env.GATEIO_API_KEY,
    secret: process.env.GATEIO_API_SECRET,
    options: {'defaultType': 'spot' }
});
const bitfinex = new ccxt.bitfinex2({
    apiKey: process.env.BITFINEX_API_KEY,
    secret: process.env.BITFINEX_API_SECRET,
    options: {'defaultType': 'spot' }
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
                    networks.push(['no such ticker'])
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
                    networks.push(['no such ticker'])
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
            networks.push(['do not know how to process pair for this network'])
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

const getTrades = async (ex1, ex2, ticker1, ticker2, ticker3) => {

    if (ex1 == 'bybit') {
        let first1 = ticker1.slice(0,ticker1.indexOf('/'))
        let second1 = ticker1.slice(ticker1.indexOf('/')+1,ticker1.length)
        ticker1 = first1+second1
        
        let first3 = ticker3.slice(0,ticker3.indexOf('/'))
        let second3 = ticker3.slice(ticker3.indexOf('/')+1,ticker3.length)
        ticker3 = first3+second3
    }
    if (ex2 == 'bybit') {
        let first2 = ticker2.slice(0,ticker2.indexOf('/'))
        let second2 = ticker2.slice(ticker2.indexOf('/')+1,ticker2.length)
        ticker2 = first2+second2
    }
    let frequencyEx1FirstTicker
    let averageAmountEx1FirstTicker
    let tickerTradesEx1FirstTicker = await eval(ex1).fetchTrades(ticker1, Date.now()-900000)
    if (tickerTradesEx1FirstTicker.length != 0) {
        let sumEx1FirstTicker = 0
        tickerTradesEx1FirstTicker.map((trade)=> {
            sumEx1FirstTicker += trade.amount
            return trade.amount
        }) 
        frequencyEx1FirstTicker = tickerTradesEx1FirstTicker.length/15    
	    averageAmountEx1FirstTicker  = sumEx1FirstTicker/tickerTradesEx1FirstTicker.length
    } else {
        frequencyEx1FirstTicker = 'undefuned'
	    averageAmountEx1FirstTicker  = 'undefuned'
    }
    
    let frequencyEx2SecondTicker
    let averageAmountEx2SecondTicker
    let tickerTradesEx2SecondTicker = await eval(ex2).fetchTrades(ticker2, Date.now()-900000)
    if (tickerTradesEx2SecondTicker.length != 0) {
        let sumEx2SecondTicker = 0
        tickerTradesEx2SecondTicker.map((trade)=> {
            sumEx2SecondTicker += trade.amount
            return trade.amount
        })
        frequencyEx2SecondTicker = tickerTradesEx2SecondTicker.length/15
        averageAmountEx2SecondTicker  = sumEx2SecondTicker/tickerTradesEx2SecondTicker.length    
    } else {
        frequencyEx2SecondTicker = 'undefuned'
        averageAmountEx2SecondTicker = 'undefuned'
    }

    let frequencyEx1ThirdTicker
    let averageAmountEx1ThirdTicker
    let tickerTradesEx1ThirdTicker = await eval(ex1).fetchTrades(ticker3, Date.now()-900000)
    if (tickerTradesEx1ThirdTicker.length != 0) {
        let sumEx1ThirdTicker = 0
        tickerTradesEx1ThirdTicker.map((trade)=> {
            sumEx1ThirdTicker += trade.amount
            return trade.amount
        })
        frequencyEx1ThirdTicker = tickerTradesEx1ThirdTicker.length/15
        averageAmountEx1ThirdTicker  = sumEx1ThirdTicker/tickerTradesEx1ThirdTicker.length    
    } else {
        frequencyEx1ThirdTicker = 'undefuned'
        averageAmountEx1ThirdTicker = 'undefuned'
    }

    return {averageAmountEx1FirstTicker, frequencyEx1FirstTicker, averageAmountEx2SecondTicker, frequencyEx2SecondTicker, averageAmountEx1ThirdTicker, frequencyEx1ThirdTicker}
}


const getLiquidity = async (ex1, ex2, ticker1, ticker2, ticker3, firstSymbol, secondSymbol, thirdSymbol) => {

    if (ex1 == 'bybit') {
        let first1 = ticker1.slice(0,ticker1.indexOf('/'))
        let second1 = ticker1.slice(ticker1.indexOf('/')+1,ticker1.length)
        ticker1 = first1+second1
        
        let first3 = ticker3.slice(0,ticker3.indexOf('/'))
        let second3 = ticker3.slice(ticker3.indexOf('/')+1,ticker3.length)
        ticker3 = first3+second3
    }
    if (ex2 == 'bybit') {
        let first2 = ticker2.slice(0,ticker2.indexOf('/'))
        let second2 = ticker2.slice(ticker2.indexOf('/')+1,ticker2.length)
        ticker2 = first2+second2
    }

    let orderBookEx1FirstTicker = await eval(ex1).fetchOrderBook(ticker1)
    let liquidityEx1FirstTicker
    if (ticker1.slice(0, ticker1.indexOf('/')) == firstSymbol) {
        liquidityEx1FirstTicker = orderBookEx1FirstTicker.bids[0]
    } else {
        liquidityEx1FirstTicker = orderBookEx1FirstTicker.asks[0]
    }

    let orderBookEx2SecondTicker = await eval(ex2).fetchOrderBook(ticker2)
    let liquidityEx2SecondTicker
    if (ticker2.slice(0, ticker2.indexOf('/')) == secondSymbol) {
        liquidityEx2SecondTicker = orderBookEx2SecondTicker.bids[0]
    } else {
        liquidityEx2SecondTicker = orderBookEx2SecondTicker.asks[0]
    }

    let orderBookEx1ThirdTicker = await eval(ex1).fetchOrderBook(ticker3)
    let liquidityEx1ThirdTicker
    if (ticker3.slice(0, ticker3.indexOf('/')) == thirdSymbol) {
        liquidityEx1ThirdTicker = orderBookEx1ThirdTicker.bids[0]
    } else {
        liquidityEx1ThirdTicker = orderBookEx1ThirdTicker.asks[0]
    }
    return {liquidityEx1FirstTicker, liquidityEx2SecondTicker, liquidityEx1ThirdTicker}
}


const networkMatch = async (arr) => {
    //const arr = JSON.parse(fs.readFileSync("./data_for_tg/filteredRoutes.json", 'utf-8'))
    let exchangesThatSupportFC = getExchangesThatSupportMethods ('fetchCurrencies')
    let exchangesThatSupportFTFs = getExchangesThatSupportMethods ('fetchTransactionFees')
    let AllPairsFC =[]
    let AllPairsFTFs = []
    let matchedPairs = []
    let AllPairs = []
    let AllPairsWithNetworks = []

    let matchPairsNetworksFactory = (profit, matchComment, minQuantityReverse, ex1, ticker1, price1, minQuantityTr1, quoteVolume1, spread1, averageAmountEx1FirstTicker, frequencyEx1FirstTicker, liquidityEx1FirstTicker, ex1secondSymbolNetworks, ex1secondSymbolTransferAvailability,
        ex2, ticker2, price2, minQuantityTr2, quoteVolume2, spread2, averageAmountEx2SecondTicker, frequencyEx2SecondTicker, liquidityEx2SecondTicker, ex2secondSymbolNetworks, ex2secondSymbolTransferAvailability, ex2thirdSymbolNetworks, ex2thirdSymbolTransferAvailability,
        ticker3, price3, quoteVolume3, spread3, averageAmountEx1ThirdTicker, frequencyEx1ThirdTicker, liquidityEx1ThirdTicker, ex1thirdSymbolNetworks, ex1thirdSymbolTransferAvailability) => {
        return {
            Profit: profit,
            Match: matchComment,
            Min_Quantity_inPairFilter: minQuantityReverse,
            StepOne: {
                Name: ex1,
                Ticker: ticker1,
                Price: price1,
                Min_Quantity: minQuantityTr1,
                Quote_volume: quoteVolume1,
                Spread: spread1,
                Average_amount_per_trade: averageAmountEx1FirstTicker,
                Trade_frequency_per_minute: frequencyEx1FirstTicker,
                Last_ask_or_bid: liquidityEx1FirstTicker, 
                Networks_With_Fees_Withdraw: ex1secondSymbolNetworks,
                Withdraw_Available: ex1secondSymbolTransferAvailability
            },
            StepTwo: {
                Name: ex2,
                Ticker: ticker2,
                Price: price2,
                Min_Quantity: minQuantityTr2,
                Quote_volume: quoteVolume2,
                Spread: spread2,
                Average_amount_per_trade: averageAmountEx2SecondTicker,
                Trade_frequency_per_minute: frequencyEx2SecondTicker,
                Last_ask_or_bid: liquidityEx2SecondTicker, 
                Networks_Deposit: ex2secondSymbolNetworks,
                Deposit_Available: ex2secondSymbolTransferAvailability,
                Networks_With_Fees_Withdraw: ex2thirdSymbolNetworks,
                Withdraw_Available: ex2thirdSymbolTransferAvailability
            },
            StepThree: {
                Name: ex1,
                Ticker: ticker3,
                Price: price3,
                Quote_volume: quoteVolume3,
                Spread: spread3,
                Average_amount_per_trade: averageAmountEx1ThirdTicker,
                Trade_frequency_per_minute: frequencyEx1ThirdTicker,
                Last_ask_or_bid: liquidityEx1ThirdTicker, 
                Networks_Deposit: ex1thirdSymbolNetworks,
                Deposit_Available: ex1thirdSymbolTransferAvailability
            },
        }
    }
    try {
        await Promise.all(exchangesThatSupportFC.map(async (exchange) => getAllFetchCurrencies(exchange).then(res => AllPairsFC.push(res)).catch(e => console.log(e))))
        await Promise.all(exchangesThatSupportFTFs.map(async (exchange) => getAllFetchTransactionFees(exchange).then(res => AllPairsFTFs.push(res)).catch(e => console.log(e))))
    } catch(e) {
        throw new Error ('Error in getAllFetchCurrenscies or getAllFetchTransactionFees')
    }
    for(let obj of arr) {
        let ex1 = obj.ex1,
            ex2 = obj.ex2,
            secondSymbol = obj.secondSymbol,
            thirdSymbol = obj.thirdSymbol,
            matchTr1,
            matchTr2,
            minQuantityTr1,
            minQuantityTr2,
            minQuantityReverseTr1,
            minQuantityReverseTr2,
            match,
            minQuantityReverse
        let ex1secondSymbolTransferAvailability = getTransferAvailability(ex1, secondSymbol, AllPairsFC)
        let ex2secondSymbolTransferAvailability = getTransferAvailability(ex2, secondSymbol, AllPairsFC)
        let ex2thirdSymbolTransferAvailability = getTransferAvailability(ex2, thirdSymbol, AllPairsFC)
        let ex1thirdSymbolTransferAvailability = getTransferAvailability(ex1, secondSymbol, AllPairsFC)
        //exchangesThatSupportFC = exchangesThatSupportFC.filter(ex => !exchangesThatSupportFTFs.includes(ex))
        //exchangesThatSupportFC = exchangesThatSupportFC.filter(ex => !exchangesThatSupportFTF.includes(ex))
        AllPairs = AllPairsFTFs.concat(AllPairsFC)
        let ex1secondSymbolNetworks
        let ex2secondSymbolNetworks
        let ex2thirdSymbolNetworks 
        let ex1thirdSymbolNetworks
        try {
            ex1secondSymbolNetworks = await getNetworks(ex1, secondSymbol, AllPairs)
            ex2secondSymbolNetworks = await getNetworks(ex2, secondSymbol, AllPairs)
            ex2thirdSymbolNetworks = await getNetworks(ex2, thirdSymbol, AllPairs)
            ex1thirdSymbolNetworks = await getNetworks(ex1, thirdSymbol, AllPairs)
        } catch(e) {
            console.log(e)
        }
        ex1secondSymbolNetworks = networkBeauty(ex1secondSymbolNetworks)
        ex2secondSymbolNetworks = networkBeauty(ex2secondSymbolNetworks)
        ex2thirdSymbolNetworks = networkBeauty(ex2thirdSymbolNetworks)
        ex1thirdSymbolNetworks = networkBeauty(ex1thirdSymbolNetworks)
        let breakCheckTr1 = false
        if (ex1secondSymbolNetworks !== null && ex2secondSymbolNetworks!== null) {
            for (let ex1secondSymbolNetwork of ex1secondSymbolNetworks) {
                for (let ex2secondSymbolNetwork of ex2secondSymbolNetworks) {
                    if (ex1secondSymbolNetwork[0].includes(ex2secondSymbolNetwork[0]) || ex2secondSymbolNetwork[0].includes(ex1secondSymbolNetwork[0])) {
                        matchTr1 = true
                        minQuantityTr1 = ex1secondSymbolNetwork[1]/obj.profit * 100
                        minQuantityReverseTr1 = minQuantityTr1*obj.price1
                        breakCheckTr1 = true
                        break
                    } else {
                        matchTr1 = false
                        minQuantityTr1 = undefined
                        minQuantityReverseTr1 = undefined
                    }
                }
                if (breakCheckTr1) break;
            }
        } else {
            matchTr1 = null
        }
        let breakCheckTr2 = false
        if (ex2thirdSymbolNetworks !== null && ex1thirdSymbolNetworks !== null) {
            for (let ex2thirdSymbolNetwork of ex2thirdSymbolNetworks) {
                for (let ex1thirdSymbolNetwork of ex1thirdSymbolNetworks) {
                    if (ex2thirdSymbolNetwork[0].includes(ex1thirdSymbolNetwork[0]) || ex1thirdSymbolNetwork[0].includes(ex2thirdSymbolNetwork[0])) {
                        matchTr2 = true
                        minQuantityTr2 = ex2thirdSymbolNetwork[1]/obj.profit * 100
                        minQuantityReverseTr2 = minQuantityTr2*obj.price3
                        breakCheckTr2 = true
                        break
                    } else {
                        matchTr2 = false
                        minQuantityTr2 = undefined
                        minQuantityReverseTr2 = undefined
                    }
                }
                if (breakCheckTr2) break;
            }
        } else {
            matchTr2 = null
        }
        //console.log(ex2secondSymbolNetworks)
        //console.log(ex1thirdSymbolNetworks)
        if (ex2secondSymbolNetworks) {
            ex2secondSymbolNetworks = ex2secondSymbolNetworks.map(arr => arr[0])
        }
        if(ex1thirdSymbolNetworks) {
            ex1thirdSymbolNetworks = ex1thirdSymbolNetworks.map(arr => arr[0])
        }
        match = matchTr1 && matchTr2
        minQuantityReverseTr1 > minQuantityReverseTr2 ? minQuantityReverse = minQuantityReverseTr1 : minQuantityReverse = minQuantityReverseTr2
        AllPairsWithNetworks.push(matchPairsNetworksFactory(obj.profit, match, minQuantityReverse, ex1, obj.ticker1, obj.price1, minQuantityTr1, obj.quoteVolume1, obj.spread1, 'undefined','undefined', 'undefined', ex1secondSymbolNetworks, ex1secondSymbolTransferAvailability[0], ex2,obj.ticker2, obj.price2, minQuantityTr2, obj.quoteVolume2,obj.spread2, 'undefined','undefined','undefined', ex2secondSymbolNetworks,ex2secondSymbolTransferAvailability[1],ex2thirdSymbolNetworks, ex2thirdSymbolTransferAvailability[0], obj.ticker3, obj.price3, obj.quoteVolume3, obj.spread3, 'undefined', 'undefined','undefined', ex1thirdSymbolNetworks, ex1thirdSymbolTransferAvailability[1]))
        if(match === true && ex1secondSymbolTransferAvailability[0] !== false && ex2secondSymbolTransferAvailability[1] !== false && ex2thirdSymbolTransferAvailability[0] !== false && ex1thirdSymbolTransferAvailability[1] !== false) {
            console.log(`Getting trades and liquidity for ${obj.ex1} -> ${obj.ex2} -> ${obj.ex1}, ${obj.ticker1} -> ${obj.ticker2} -> ${obj.ticker3}`)
            try {
                let {averageAmountEx1FirstTicker, frequencyEx1FirstTicker, averageAmountEx2SecondTicker, frequencyEx2SecondTicker, averageAmountEx1ThirdTicker, frequencyEx1ThirdTicker} = await getTrades(ex1, ex2, obj.ticker1, obj.ticker2, obj.ticker3)
                //console.log('averageAmountEx1FirstTicker', averageAmountEx1FirstTicker, 'frequencyEx1FirstTicker', frequencyEx1FirstTicker, 'averageAmountEx2SecondTicker', averageAmountEx2SecondTicker, 'frequencyEx2SecondTicker', frequencyEx2SecondTicker, 'averageAmountEx1ThirdTicker', averageAmountEx1ThirdTicker, 'frequencyEx1ThirdTicker', frequencyEx1ThirdTicker)
                let {liquidityEx1FirstTicker, liquidityEx2SecondTicker, liquidityEx1ThirdTicker} = await getLiquidity(ex1, ex2, obj.ticker1, obj.ticker2, obj.ticker3, obj.firstSymbol, obj.secondSymbol, obj.thirdSymbol)
                //console.log('liquidityEx1FirstTicker', liquidityEx1FirstTicker, 'liquidityEx2SecondTicker', liquidityEx2SecondTicker, 'liquidityEx1ThirdTicker', liquidityEx1ThirdTicker)
                matchedPairs.push(matchPairsNetworksFactory(obj.profit, match, minQuantityReverse, ex1, obj.ticker1, obj.price1, minQuantityTr1, obj.quoteVolume1, obj.spread1, averageAmountEx1FirstTicker,frequencyEx1FirstTicker, liquidityEx1FirstTicker, ex1secondSymbolNetworks, ex1secondSymbolTransferAvailability[0], ex2,obj.ticker2, obj.price2, minQuantityTr2, obj.quoteVolume2,obj.spread2, averageAmountEx2SecondTicker,frequencyEx2SecondTicker,liquidityEx2SecondTicker, ex2secondSymbolNetworks,ex2secondSymbolTransferAvailability[1],ex2thirdSymbolNetworks, ex2thirdSymbolTransferAvailability[0], obj.ticker3, obj.price3, obj.quoteVolume3, obj.spread3, averageAmountEx1ThirdTicker, frequencyEx1ThirdTicker,liquidityEx1ThirdTicker, ex1thirdSymbolNetworks, ex1thirdSymbolTransferAvailability[1]))
            } catch(e) {
                console.log(e)
            }
        }
    }
    let resultJSONAll = JSON.stringify(AllPairsWithNetworks, null, 2)
    fs.writeFileSync('./data_for_tg/AllRoutesWithNetworks.json', resultJSONAll, err => {
        if (err) {
            console.log('Error writing file AllRoutesWithNetworks', err)
        } else {
            console.log('Successfully wrote file AllRoutesWithNetworks')
        }
    })
    return(matchedPairs)
}
//networkMatch()
module.exports = networkMatch

