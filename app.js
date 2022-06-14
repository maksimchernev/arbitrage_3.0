'use strict';

var ccxt = require ('ccxt')
//console.log (ccxt.exchanges) // print all available exchanges
const binance = new ccxt.binance()
const okx = new ccxt.okx()
const bitfinex = new ccxt.bitfinex()
const bitrue = new ccxt.bitrue()
const bybit = new ccxt.bybit()
const coinbase = new ccxt.coinbase()
const cryptocom = new ccxt.cryptocom()
const gateio = new ccxt.gateio()
const huobi = new ccxt.huobi()
const kraken = new ccxt.kraken()
const kucoin = new ccxt.kucoin()
const mexc = new ccxt.mexc()
const exchanges = ['binance', 'okx', 'huobi', 'bitfinex', 'bitrue', 'bybit', 'coinbase', 'cryptocom', 'gateio', 'kucoin', 'mexc']

const getSpecificPairs = (AllPairs, symbolFilter) => {
    const pairsArray = []
    const specificPairsFactory = (ticker, price, askVolume, bidVolume) => {
        return {
            ticker,
            price,
            askVolume,
            bidVolume
        }
    }
    let specificPair
    for (let ticker in AllPairs) {
        if(AllPairs[ticker].symbol.slice(symbolFilter.length*-1-1,ticker.length) === `/${symbolFilter}` || AllPairs[ticker].symbol.slice(0,symbolFilter.length+1) === `${symbolFilter}/`) {
            specificPair = specificPairsFactory(AllPairs[ticker].symbol, AllPairs[ticker].last, AllPairs[ticker].askVolume, AllPairs[ticker].bidVolume)
            pairsArray.push(specificPair)
        }
    }
    return(pairsArray)
}

const mutuallyAvailablePairs = (pairs1, pairs2) => {
    const AvailablePairs = []
    const AvailablePairsFactory = (ticker, price1, price2, askVolume1, askVolume2, bidVolume1, bidVolume2) => {
        return {
            ticker,
            price1,
            price2,
            askVolume1,
            askVolume2,
            bidVolume1,
            bidVolume2
        }
    }
    for (let i = 0; i<pairs1.length; i++) {
        for (let j = 0; j<pairs2.length; j++){
            if(pairs1[i].ticker === pairs2[j].ticker) {
                let availablePair = AvailablePairsFactory (pairs1[i].ticker, pairs1[i].price, pairs2[j].price, pairs1[i].askVolume, pairs2[j].askVolume, pairs1[i].bidVolume, pairs2[j].bidVolume)
                AvailablePairs.push(availablePair)
            }
        }
    }
    return (AvailablePairs)
}

const comparePrices = async (exchange1, exchange2, symbolFilter, profitFilter, volumeFilter, exOneTicker, exTwoTicker) => {
    let AllPairs1,
        AllPairs2,
        baseTicker,
        profitablePairs = []
    try {
        AllPairs1 = await exchange1.fetchTickers();
        AllPairs2 = await exchange2.fetchTickers();
    } catch(error) {
        console.log(error)
    }
    const pairsExOne = getSpecificPairs(AllPairs1, symbolFilter);
    const pairsExTwo = getSpecificPairs(AllPairs2, symbolFilter);
    const availablePairs = mutuallyAvailablePairs(pairsExOne, pairsExTwo);
    //console.log(availablePairs)
    for (let pair of availablePairs) {
        if (pair.askVolume1 > volumeFilter && pair.askVolume2 > volumeFilter && pair.bidVolume1 > volumeFilter && pair.bidVolume2 > volumeFilter && pair.price1>0 && pair.price2>0) {
            if (pair.price1 >= pair.price2 ) {
                pair.profit = (pair.price1/pair.price2 - 1)*100
                pair.route = `${exTwoTicker}->${exOneTicker}`
            } else {
                pair.profit = (pair.price2/pair.price1 - 1)*100
                pair.route = `${exOneTicker}->${exTwoTicker}`
            }
            if (pair.profit > profitFilter ) {
                baseTicker = pair.ticker.slice(0,pair.ticker.indexOf('/')+1)
                if( baseTicker === 'USDT/') {
                    pair.comment1 = pair.comment2 = 'all is ok'
                } else if (!AllPairs1.hasOwnProperty(`${baseTicker}USDT`)) {
                    pair.comment1 = 'volumes in USDT are unavailable (no such pair)'
                } else if (!AllPairs2.hasOwnProperty(`${baseTicker}USDT`)) {
                    pair.comment2 = 'volumes in USDT are unavailable (no such pair)'
                } else {
                    let basePrice1 = AllPairs1[`${baseTicker}USDT`].last
                    let basePrice2 = AllPairs2[`${baseTicker}USDT`].last
                    pair.askVolume1 = pair.askVolume1 * basePrice1
                    pair.bidVolume1 = pair.bidVolume1 * basePrice1
                    pair.askVolume2 = pair.askVolume2 * basePrice2
                    pair.bidVolume2 = pair.bidVolume2 * basePrice2 
                    
                    pair.comment1 = pair.comment2 = 'all is ok'
                }
                profitablePairs.push(pair)
            }
        }  
    }
    if(profitablePairs.length > 0) {
        return(profitablePairs)
    } else {
        return(`None found in route ${exOneTicker}<->${exTwoTicker} :(`)
    }
    
    
}

const run = async (symbolFilter, profitFilter, volumeFilter) => {
    let profitablePairs
    let profitableExPairs = []
    for (let i = 0; i<exchanges.length; i++) {
        for(let j = i+1; j< exchanges.length; j++) {
            const exchange1Ticker = exchanges[i]
            const exchange2Ticker = exchanges[j]
            console.log(exchange1Ticker, exchange2Ticker)
            profitablePairs = await comparePrices(eval(exchange1Ticker), eval(exchange2Ticker), symbolFilter, profitFilter, volumeFilter, exchange1Ticker, exchange2Ticker)
            profitableExPairs.push(profitablePairs)
        }
    }
    if(profitableExPairs.length > 0) {
        console.log(profitableExPairs)
    } else {
        console.log('None found :(')
    }
}
run('USDT', 2, 1)
