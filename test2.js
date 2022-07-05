
'use strict';
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const ccxt = require ('ccxt');
const { allowedNodeEnvironmentFlags } = require('process');

const bitrueClient = new ccxt.bitrue({
    apiKey: process.env.BITRUE_API_KEY,
    secret: process.env.BITRUE_API_SECRET
  });
const kucoinClient = new ccxt.kucoin({
    apiKey: process.env.KUCOIN_API_KEY,
    secret: process.env.KUCOIN_API_SECRET,
    password: process.env.KUCOIN_PASSWORD
});
const binanceClient = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_API_SECRET,
});
const mexcClient = new ccxt.mexc({
    apiKey: process.env.MEXC_API_KEY,
    secret: process.env.MEXC_API_SECRET
  });
const okxClient = new ccxt.okx({
    apiKey: process.env.OKX_API_KEY,
    secret: process.env.OKX_API_SECRET,
    password: process.env.OKX_PASSWORD
});
const huobiClient = new ccxt.huobi({
    apiKey: process.env.HUOBI_API_KEY,
    secret: process.env.HUOBI_API_SECRET,
});
const bybitClient = new ccxt.bybit({
    apiKey: process.env.BYBIT_API_KEY,
    secret: process.env.BYBIT_API_SECRET
});
const gateioClient = new ccxt.gateio({
    apiKey: process.env.GATEIO_API_KEY,
    secret: process.env.GATEIO_API_SECRET,
});
const bitfinexClient = new ccxt.bitfinex2({
    apiKey: process.env.BITFINEX_API_KEY,
    secret: process.env.BITFINEX_API_SECRET,
});
const exchanges = ['bitfinex', 'mexc', 'binance', 'okx', 'huobi', 'bitrue', 'bybit', 'kucoin', 'gateio']
const getAllFetchTransactionFees = async (exchange) => {
    try {
        let response = await eval(exchange+'Client').fetchTransactionFees()
        response = response.withdraw
        return({exchange: exchange, withdraw: response})
        } catch (error) {
        console.log(error)
      }
}
const run = async () => {
    let ticker = 'wfwfw2L33L;'
    let matches = ticker.match(/\dL/);
    console.log(matches)

}
run()