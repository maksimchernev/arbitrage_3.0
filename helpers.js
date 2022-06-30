const reversedTicker = (ticker) => {
    let first = ticker.slice(0,ticker.indexOf('/'))
    let second = ticker.slice(ticker.indexOf('/')+1,ticker.length)
    return second+'/'+first
}
module.exports = {reversedTicker};


