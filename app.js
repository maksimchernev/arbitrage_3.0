'use strict';

const ccxt = require ('ccxt')

//console.log (ccxt.exchanges) // print all available exchanges
const binance = new ccxt.binance()
const okx = new ccxt.okx()
const bitfinex = new ccxt.bitfinex()
const bitrue = new ccxt.bitrue()
const bybit = new ccxt.bybit()
const gateio = new ccxt.gateio()
const huobi = new ccxt.huobi()
const kucoin = new ccxt.kucoin()
const mexc = new ccxt.mexc()
const exchanges = ['binance', 'mexc', 'binance', 'okx', 'huobi', 'bitrue', 'bybit', 'kucoin', 'gateio']

const getAllExPairs = async (exchange) => {
    try {
        const response = await eval(exchange).fetchTickers()
        return({exchange: exchange, pairs: response})
        } catch (error) {
        console.log(error)
      }
}
//getAllExPairs('binance')
//const exchanges = ['gateio', 'huobi']

const getSpecificPairs = (AllPairs, symbolFilter) => {
    let modifiedTicker
    const pairsArray = []
    const specificPairsFactory = (ticker, price, baseVolume, quoteVolume) => {
        return {
            ticker,
            price,
            baseVolume,
            quoteVolume
        }
    }
    let specificPair
    for (let ticker in AllPairs) {
        if (ticker.slice(ticker.indexOf('/')-2,ticker.indexOf('/')) !== '3L' && ticker.slice(ticker.indexOf('/')-2,ticker.indexOf('/')) !== '3S') {
            if (ticker.indexOf(':') !== -1) {
                modifiedTicker = ticker.slice(0,ticker.indexOf(':'))
            } else {
                modifiedTicker = ticker
            }
            if (modifiedTicker.slice(symbolFilter.length*-1-1,modifiedTicker.length) === `/${symbolFilter}` || modifiedTicker.slice(0,symbolFilter.length+1) === `${symbolFilter}/`) {
                specificPair = specificPairsFactory(modifiedTicker, AllPairs[ticker].last, AllPairs[ticker].baseVolume, AllPairs[ticker].quoteVolume)
                pairsArray.push(specificPair)
            }   
        }
    }
    return(pairsArray)
}

const mutuallyAvailablePairs = (pairs1, pairs2) => {
    const AvailablePairs = []
    let availablePair
    const AvailablePairsFactory = (ticker, price1, price2, baseVolume1, quoteVolume1, baseVolume2, quoteVolume2) => {
        return {
            ticker,
            price1,
            price2,
            baseVolume1,
            quoteVolume1,
            baseVolume2,
            quoteVolume2
        }
    }
    for (let i = 0; i<pairs1.length; i++) {
        for (let j = 0; j<pairs2.length; j++){
            if(pairs1[i].ticker === pairs2[j].ticker) {
                availablePair = AvailablePairsFactory (pairs1[i].ticker, pairs1[i].price, pairs2[j].price, pairs1[i].baseVolume, pairs1[i].quoteVolume, pairs2[j].baseVolume, pairs2[j].quoteVolume)
                AvailablePairs.push(availablePair)
            }
        }
    }
    return (AvailablePairs)
}

const comparePrices =  (exchange1, exchange2, symbolFilter, profitFilter, volumeFilter) => {
    let profitablePairs = [],
        volume1,
        volume2
    const pairsExOne = getSpecificPairs(exchange1.pairs, symbolFilter);
    const pairsExTwo = getSpecificPairs(exchange2.pairs, symbolFilter);
    const availablePairs = mutuallyAvailablePairs(pairsExOne, pairsExTwo);
    //console.log(availablePairs)
    for (let pair of availablePairs) {
        if (pair.quoteVolume1 == undefined || pair.quoteVolume2 == undefined) {
            if (pair.baseVolume1 !== undefined && pair.baseVolume2 !== undefined) {
                volume1 = pair.baseVolume1*pair.price1
                volume2 = pair.baseVolume2*pair.price2
                pair.comment = 'quote volumes are not available'
            } else {
                volume1 = volume2 = volumeFilter + 1
                pair.comment = 'no volumes are available'
            }
        } else {
            volume1 = pair.quoteVolume1
            volume2 = pair.quoteVolume2
        } 
        if (volume1 > volumeFilter && volume2 > volumeFilter && pair.price1>0 && pair.price2>0) {
            if (pair.price1 >= pair.price2 ) {
                pair.profit = (pair.price1/pair.price2 - 1)*100
                pair.route = `${exchange2.exchange}->${exchange1.exchange}`
            } else {
                pair.profit = (pair.price2/pair.price1 - 1)*100
                pair.route = `${exchange1.exchange}->${exchange2.exchange}`
            }
            if (pair.profit > profitFilter ) {
                profitablePairs.push(pair)
            }
         }  
    }
    if(profitablePairs.join('').length > 0) {
        return(profitablePairs)
    } else {
        console.log(`None found in route ${exchange1.exchange}<->${exchange2.exchange} :(`)
    }
}

const run = async (symbolFilter, profitFilter, volumeFilter) => {
    console.log('starting run')
    let AllPairs = []
    let profitablePairs
    const allProfitablePairs = []
    try {
        await Promise.all(exchanges.map(async (exchange) => getAllExPairs(exchange).then(res => AllPairs.push(res)))) 
        console.log('Got all pairs from all exchanges')
        for (let i = 0; i<AllPairs.length; i++) {
            for (let j = i+1; j<AllPairs.length; j++) {
                let exchange1Ticker = exchanges[i]
                let exchange2Ticker = exchanges[j]
                console.log(`Comparing ${exchange1Ticker} and ${exchange2Ticker}`)
                profitablePairs = comparePrices(AllPairs[i], AllPairs[j], symbolFilter, profitFilter, volumeFilter)
                allProfitablePairs.push(profitablePairs)
            }
        }
    } catch(e) {
        console.log(e)
    }
    if(allProfitablePairs.join('').length > 0) {
        let responseJson = JSON.stringify(allProfitablePairs,null, 2)
        //console.log(allProfitablePairs)
        return responseJson
    } else {
        return 'None found :('
    }
}

//run('USDT', 0, 0).then(response => console.log(response))
module.exports = run;