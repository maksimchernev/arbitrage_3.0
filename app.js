'use strict';
const networkMatch = require('./networksCheck.js');
const ccxt = require ('ccxt');
const { isThisSecond } = require('date-fns');
const { fi } = require('date-fns/locale');
const fs = require('fs')

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
const exchanges = ['kucoin','huobi', 'bitrue', 'bitfinex', 'binance', 'okx',  'bybit', 'gateio', 'mexc']
//const exchanges = new ccxt.exchanges
const coinsPidarasi = ['BABYDOGE' , 'QUACK', 'EMPIRE', 'SAITAMA', 'PIG', 'VOLT', 'BRISE', 'PIT']
const coinsHalfPidarasi = ['QI', 'HEC', 'BP', 'REAL', 'MITX', 'ELT', 'TON', 'BTR', 'MDT', 'STRIP', 'AMP']
const fiat = ['RUB', 'EUR', 'USD', 'TRY', 'CNY', 'GBP', 'UAH']
const getAllExPairs = async (exchange) => {
    const response = await eval(exchange).fetchTickers()
    return({exchange: exchange, pairs: response})
}
//getAllExPairs('binance')
//const exchanges = ['gateio', 'huobi']

const getSpecificTickers = (AllPairs, symbolFilter) => {
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

    let newFiatArr
    if (fiat.includes(symbolFilter)) {
        let i = fiat.indexOf(symbolFilter)
        newFiatArr = fiat.filter(( element,index) => {
            return index != i
        })
    } else {
        newFiatArr = fiat
    }

    for (let ticker in AllPairs) {
            //excluding futures type pairs and coinsPidarasi
            if (ticker.match(/\dL/) == null && ticker.match(/\dS/) == null && !coinsPidarasi.includes(ticker.slice(0, ticker.indexOf('/'))) && !coinsPidarasi.includes(ticker.slice(ticker.indexOf('/')+1, ticker.length)) && !newFiatArr.includes(ticker.slice(0, ticker.indexOf('/'))) && !newFiatArr.includes(ticker.slice(ticker.indexOf('/')+1, ticker.length))) {
                //removing symbols after ':' if there are any
                if (ticker.indexOf(':') !== -1) {
                    modifiedTicker = ticker.slice(0,ticker.indexOf(':'))
                } else {
                    modifiedTicker = ticker
                }
                if (AllPairs[ticker].ask, AllPairs[ticker].bid != 0) {
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
    }
    return(pairsArray)
}

const volumesCheck = (quoteVolume, baseVolume, volumeFilter, price) => {
    let volume
    if (quoteVolume == 'undefined' && baseVolume == 'undefined') {
        volume = volumeFilter + 1
    } else if(quoteVolume == 'undefined' && baseVolume != 'undefined') {
        volume = baseVolume*price
    } else {
        volume = quoteVolume
    } 
    return volume
}

const filterRoutes = (availableRoutes, volumeFilter, spreadFilter) => {
    let filteredRoutes = []
    let volume1
    let volume2
    let volume3
    for (let route of availableRoutes) {
        //prepare to filtering found combos with volume filter
        volume1 = volumesCheck(route.quoteVolume1, route.baseVolume1, volumeFilter, route.price1)
        volume2 = volumesCheck(route.quoteVolume2, route.baseVolume2, volumeFilter, route.price2)
        volume3 = volumesCheck(route.quoteVolume3, route.baseVolume3, volumeFilter, route.price3)
        //filtering
        if (volume1 > volumeFilter && volume2 > volumeFilter && volume3 > volumeFilter && route.spread1 <= spreadFilter && route.spread2 <= spreadFilter && route.spread3 <= spreadFilter) {
            filteredRoutes.push(route)
        }  
    }
    return(filteredRoutes)
}


const run = async (symbolFilter, profitFilter = 0, volumeFilter = 0, spreadFilter = 5) => {

    console.log('starting run')
    let AllPairs = []

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

    let firstSymbol = symbolFilter
    let secondSymbol
    let thirdSymbol

    let firstExchangeName
    let secondExchangeName

    let tickersFirstExchange
    let tickersSecondExchange

    let firstPrice
    let secondPrice
    let thirdPrice

    let availableRoutes = []
    const routePairsFactory = (ex1,ex2, profit, ticker1,ticker2,ticker3,price1,price2,price3, quoteVolume1,quoteVolume2,quoteVolume3,baseVolume1,baseVolume2,baseVolume3,spread1,spread2,spread3, firstSymbol, secondSymbol, thirdSymbol) => {
        return {
            ex1,
            ex2,
            profit,
            ticker1,
            ticker2,
            ticker3,
            price1,
            price2,
            price3,
            quoteVolume1,
            quoteVolume2,
            quoteVolume3,
            baseVolume1,
            baseVolume2,
            baseVolume3,
            spread1,
            spread2,
            spread3,
            firstSymbol, 
            secondSymbol, 
            thirdSymbol
        }
    } 
    for (let i = 0; i<AllPairs.length; i++) {
        //get specific pairs from an i exchange

        tickersFirstExchange = getSpecificTickers(AllPairs[i].pairs, firstSymbol)
        firstExchangeName = AllPairs[i].exchange

        //remove an i exchange
        let AllPairsWithRemovedExchange = AllPairs.filter(( element,index) => {
            return index != i
        })
        for (let tickerFirstExchange of tickersFirstExchange) {
            //find symbol to searchNext
            if (tickerFirstExchange.price != 0) {
                let tickerNameFirstExchange = tickerFirstExchange.ticker
                if (tickerNameFirstExchange.slice(0,tickerNameFirstExchange.indexOf('/')) == firstSymbol) {
                    firstPrice = 1/tickerFirstExchange.price
                    secondSymbol = tickerNameFirstExchange.slice(tickerNameFirstExchange.indexOf('/')+1, tickerNameFirstExchange.length)
                } else {
                    firstPrice = tickerFirstExchange.price
                    secondSymbol = tickerNameFirstExchange.slice(0,tickerNameFirstExchange.indexOf('/'))
                }
    
                //get specific pairs of symbol to search next
                for (let exchange of AllPairsWithRemovedExchange) {
    
                    tickersSecondExchange = getSpecificTickers(exchange.pairs, secondSymbol)
                    secondExchangeName = exchange.exchange

                    
                    for (let tickerSecondExchange of tickersSecondExchange) {
                        //find final symbol to sell on first exchange
                        if (tickerSecondExchange.price != 0) {
                            let tickerNameSecondExchange = tickerSecondExchange.ticker
                            if (tickerNameSecondExchange.slice(0,tickerNameSecondExchange.indexOf('/')) == secondSymbol) {
                                secondPrice = tickerSecondExchange.price
                                thirdSymbol = tickerNameSecondExchange.slice(tickerNameSecondExchange.indexOf('/')+1, tickerNameSecondExchange.length)
                            } else {
                                secondPrice = 1/tickerSecondExchange.price
                                thirdSymbol = tickerNameSecondExchange.slice(0,tickerNameSecondExchange.indexOf('/'))
                            }
                            
                            if (thirdSymbol != firstSymbol) {
                                for (let finalTickerFirstExchange of tickersFirstExchange) {
                                    if (finalTickerFirstExchange.price != 0) {
                                        let finalTickerNameFirstExchange = finalTickerFirstExchange.ticker
                                        if (finalTickerNameFirstExchange == `${firstSymbol}/${thirdSymbol}` || finalTickerNameFirstExchange == `${thirdSymbol}/${firstSymbol}`) {
                                            if (finalTickerNameFirstExchange == `${firstSymbol}/${thirdSymbol}`) {
                                                thirdPrice = 1/finalTickerFirstExchange.price
                                            } else {
                                                thirdPrice = finalTickerFirstExchange.price
                                            }
                                            let profit
                                            if (secondPrice, thirdPrice, firstPrice != Infinity) {
                                                profit = ((secondPrice*thirdPrice)/firstPrice - 1) * 100
                                            }
                                            if (profit > profitFilter) {
                                                const route = routePairsFactory(firstExchangeName, secondExchangeName, profit, tickerNameFirstExchange, tickerNameSecondExchange, finalTickerNameFirstExchange, tickerFirstExchange.price, tickerSecondExchange.price, finalTickerFirstExchange.price, tickerFirstExchange.quoteVolume, tickerSecondExchange.quoteVolume, finalTickerFirstExchange.quoteVolume, tickerFirstExchange.baseVolume, tickerSecondExchange.baseVolume, finalTickerFirstExchange.baseVolume, tickerFirstExchange.spread, tickerSecondExchange.spread, finalTickerFirstExchange.spread, firstSymbol, secondSymbol, thirdSymbol)
                                                availableRoutes.push(route)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    let filteredRoutes = filterRoutes(availableRoutes, volumeFilter, spreadFilter)
    let resultJSON = JSON.stringify(filteredRoutes, null, 2)
    fs.writeFileSync('./data_for_tg/filteredRoutes.json', resultJSON, err => {
        if (err) {
            console.log('Error writing file filteredRoutes', err)
        } else {
            console.log('Successfully wrote file filteredRoutes')
        }
    })
    let matchedRoutes
    if (filteredRoutes.length > 0 ) {
        console.log('filteredRoutes found: ', filteredRoutes.length)
        try {
            matchedRoutes = await networkMatch(filteredRoutes)
        }catch(e) {
            console.log(e)
        }  
        if (matchedRoutes.length > 0) {
            console.log(`Matched Routes found: ${matchedRoutes.length}`)
            //let responseJson = JSON.stringify(matchedPairs, null, 2)
            return matchedRoutes
        } else {
            throw new Error('no matched combinations')
        }
    }
}
module.exports = run;