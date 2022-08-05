'use strict';
const networkMatch = require('./networksCheck.js');
const ccxt = require ('ccxt')
//console.log (ccxt.exchanges) // print all available exchanges
const binance = new ccxt.binance()
const okx = new ccxt.okx()
const bitfinex = new ccxt.bitfinex2()
const bitrue = new ccxt.bitrue()
const bybit = new ccxt.bybit()
const gateio = new ccxt.gateio()
const huobi = new ccxt.huobi()
const kucoin = new ccxt.kucoin()
const mexc = new ccxt.mexc()
const exchanges = ['bitrue', 'kucoin', 'bitfinex', 'binance', 'okx',  'bybit', 'gateio', 'mexc', 'huobi']
//const exchanges = new ccxt.exchanges
const coinsPidarasi = ['BABYDOGE' , 'QUACK', 'EMPIRE', 'SAITAMA', 'PIG', 'VOLT', 'BRISE', 'PIT']
const coinsHalfPidarasi = ['QI', 'HEC', 'BP', 'REAL', 'MITX', 'ELT', 'TON', 'BTR', 'MDT', 'STRIP', 'AMP']

const getAllExPairs = async (exchange) => {
    const response = await eval(exchange).fetchTickers()
    return({exchange: exchange, pairs: response})
}
//getAllExPairs('binance')
//const exchanges = ['gateio', 'huobi']

const getSpecificPairs = (AllPairs, symbolFilter) => {
    let modifiedTicker,
        spread
    const pairsArray = []
    const specificPairsFactory = (ticker, price, baseVolume, quoteVolume, spread) => {
        return {
            ticker,
            price,
            baseVolume,
            quoteVolume,
            spread
        }
    }
    let specificPair
    for (let ticker in AllPairs) {
            //excluding futures type pairs and coinsPidarasi
            if (ticker.match(/\dL/) == null && ticker.match(/\dS/) == null && !coinsPidarasi.includes(ticker.slice(0, ticker.indexOf('/'))) && !coinsPidarasi.includes(ticker.slice(ticker.indexOf('/')+1, ticker.length))) {
                //removing symbols after ':' if there are any
                if (ticker.indexOf(':') !== -1) {
                    modifiedTicker = ticker.slice(0,ticker.indexOf(':'))
                } else {
                    modifiedTicker = ticker
                }
                //calculating spread
                spread = (AllPairs[ticker].ask-AllPairs[ticker].bid)/AllPairs[ticker].ask * 100

                // replacing base Volume in case of undefined to write as json
                let baseVolume
                if (AllPairs[ticker].baseVolume == undefined) {
                    baseVolume = 'undefined'
                } else {
                    baseVolume = AllPairs[ticker].baseVolume
                }
                // replacing quote Volume in case of undefined to write as json
                let quoteVolume
                if (AllPairs[ticker].quoteVolume == undefined) {
                    quoteVolume = 'undefined'
                } else {
                    quoteVolume = AllPairs[ticker].quoteVolume
                }
                //creating object of pair in case it is matched to pair filter
                if (modifiedTicker.slice(symbolFilter.length*-1-1,modifiedTicker.length) === `/${symbolFilter}` || modifiedTicker.slice(0,symbolFilter.length+1) === `${symbolFilter}/`) {
                    specificPair = specificPairsFactory(modifiedTicker, AllPairs[ticker].last, baseVolume, quoteVolume, spread)
                    pairsArray.push(specificPair)
                }   
            }
    }
    return(pairsArray)
}

const mutuallyAvailablePairs = (pairs1, pairs2, symbolFilter) => {
    const AvailablePairs = []
    let availablePair
    const AvailablePairsFactory = (ticker, price1, price2, baseVolume1, quoteVolume1, baseVolume2, quoteVolume2, spread1, spread2) => {
        return {
            ticker,
            price1,
            price2,
            baseVolume1,
            quoteVolume1,
            baseVolume2,
            quoteVolume2,
            spread1,
            spread2
        }
    }
    const reversedTicker = (ticker) => {
        let first = ticker.slice(0,ticker.indexOf('/'))
        let second = ticker.slice(ticker.indexOf('/')+1,ticker.length)
        return second+'/'+first
    }
    for (let i = 0; i<pairs1.length; i++) {
        for (let j = 0; j<pairs2.length; j++){
            let ticker1 = pairs1[i].ticker
            let ticker2 = pairs2[j].ticker
            //difining whether a ticker  is reversed and make them identical
            if (ticker1.slice(0,ticker1.indexOf('/')) === symbolFilter && ticker2.slice(0,ticker2.indexOf('/')) !== symbolFilter) {
                pairs1[i].ticker = reversedTicker(pairs1[i].ticker)
                pairs1[i].price = 1/pairs1[i].price
                let volume = pairs1[i].quoteVolume
                pairs1[i].quoteVolume = pairs1[i].baseVolume
                pairs1[i].baseVolume = volume
            } else if (ticker2.slice(0,ticker2.indexOf('/')) === symbolFilter && ticker1.slice(0,ticker1.indexOf('/')) !== symbolFilter) {
                pairs2[j].ticker = reversedTicker(pairs2[j].ticker)
                pairs2[j].price = 1/pairs2[j].price
                let volume = pairs2[j].quoteVolume
                pairs2[j].quoteVolume = pairs2[j].baseVolume
                pairs2[j].baseVolume = volume
            }
            //if match create a corresponding object
            if(pairs1[i].ticker === pairs2[j].ticker) {
                availablePair = AvailablePairsFactory (pairs1[i].ticker, pairs1[i].price, pairs2[j].price, pairs1[i].baseVolume, pairs1[i].quoteVolume, pairs2[j].baseVolume, pairs2[j].quoteVolume, pairs1[i].spread, pairs2[j].spread)
                AvailablePairs.push(availablePair)
            }
        }
    }
    return (AvailablePairs)
}


const comparePrices = async (exchange1, exchange2, symbolFilter, profitFilter = 0, volumeFilter = 0, spreadFilter = 5) => {
    let profitablePairs = [],
        volume1,
        volume2
    const pairsExOne = getSpecificPairs(exchange1.pairs, symbolFilter);
    const pairsExTwo = getSpecificPairs(exchange2.pairs, symbolFilter);
    const availablePairs = mutuallyAvailablePairs(pairsExOne, pairsExTwo, symbolFilter);
    //console.log(availablePairs)
    for (let pair of availablePairs) {
        //prepare to filtering found combos with volume filter
        if (pair.quoteVolume1 == undefined || pair.quoteVolume2 == undefined) {
            if (pair.baseVolume1 !== undefined && pair.baseVolume2 !== undefined) {
                volume1 = pair.baseVolume1*pair.price1
                volume2 = pair.baseVolume2*pair.price2
            } else {
                volume1 = volume2 = volumeFilter + 1
            }
        } else {
            volume1 = pair.quoteVolume1
            volume2 = pair.quoteVolume2
        } 
        //prepare to filtering found combos with spread filter
        if (pair.spread1 == undefined || pair.spread2 == undefined) {
            pair.commentSpread = 'No spread available'
        }
        //filtering
        if (volume1 > volumeFilter && volume2 > volumeFilter && pair.price1>0 && pair.price2>0 && pair.spread1 <= spreadFilter && pair.spread2 <= spreadFilter) {
            //calculating profit
            if (pair.price1 >= pair.price2 ) {
                pair.profit = (pair.price1/pair.price2 - 1)*100
                pair.route = [exchange2.exchange, exchange1.exchange]
                pair.buyPrice = pair.price2
                pair.buyQuoteVolume = pair.quoteVolume2
                pair.buySpread = pair.spread2
                pair.sellPrice = pair.price1
                pair.sellQuoteVolume = pair.quoteVolume1
                pair.sellSpread = pair.spread1
            } else {
                pair.profit = (pair.price2/pair.price1 - 1)*100
                pair.route = [exchange1.exchange, exchange2.exchange]
                pair.buyPrice = pair.price1
                pair.buyQuoteVolume = pair.quoteVolume1
                pair.buySpread = pair.spread1
                pair.sellPrice = pair.price2
                pair.sellQuoteVolume = pair.quoteVolume2
                pair.sellSpread = pair.spread2
            }
            //final profit filter
            if (pair.profit > profitFilter && pair.profit < 50) {
                profitablePairs.push(pair)
            }
        }  
    }
    if(profitablePairs.join('').length > 0) {
        return(profitablePairs)
    }
}


const run = async (symbolFilter, profitFilter = 0, volumeFilter = 0, spreadFilter = 5) => {
    console.log('starting run')
    let AllPairs = []
    let profitablePairs
    let allProfitablePairs = []
    let matchedPairs
    //getting all pairs from all exchanges
    try {
        await Promise.all(
            exchanges.map
                (async (exchange) => getAllExPairs(exchange)
                    .then(res => AllPairs.push(res))
                    .catch(e => console.log(e))
                )
            )
    } catch(e) {
        throw new Error ('Error in getAllExPairs')
    }   
    console.log('Got all pairs from all exchanges')
    for (let i = 0; i<AllPairs.length; i++) {
        for (let j = i+1; j<AllPairs.length; j++) {
            //let exchange1Ticker = exchanges[i]
            //let exchange2Ticker = exchanges[j]
            //console.log(`Comparing ${exchange1Ticker} and ${exchange2Ticker}`)
            //send to compare prices function
            try {
                profitablePairs = await comparePrices(AllPairs[i], AllPairs[j], symbolFilter, profitFilter, volumeFilter, spreadFilter)
                allProfitablePairs = allProfitablePairs.concat(profitablePairs)
            } catch(e) {
                throw new Error ('Error in comparePrices')
            }   
        }
    }
    //removing null 
    allProfitablePairs = allProfitablePairs.filter((n) => {return n != null});
    if(allProfitablePairs.length > 0) {
        console.log(`Pairs found: ${allProfitablePairs.length}`)
        //console.log(allProfitablePairs)
        //network match block
        try {
            matchedPairs = await networkMatch(allProfitablePairs)
        }catch(e) {
            throw new Error ('Error in matchedPairs')
        }   
        if (matchedPairs.length > 0) {
            console.log(`Matched Pairs found: ${matchedPairs.length}`)
            //let responseJson = JSON.stringify(matchedPairs, null, 2)
            return matchedPairs
        } else {
            throw new Error('no matched combinations')
        }
    } else {
        throw new Error('no matched combinations')
    }
}

module.exports = run;