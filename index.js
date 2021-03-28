require('dotenv').config;
const ccxt = require('ccxt');
const axios = require('axios');

/**
 *  Runs Core Function of Script
 */
const tick = async() => {
    const { asset, base, spread, allocation } = config;
    const market = `${asset}/${base}`;

    const orders = await biananceClient.fetchOpenOrders(market);
    orders.forEach(async order => {
        await biananceClient.cancelOrder(order.id);
    });

    const result = await Promise.all([
        axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'),
        axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd')     
    ]);
    const marketPrice = results[0].data.bitcoin.usd / results[1].data.tether.usd;

    const sellPrice = marketPrice * (1 + spread);
    const buyPrice = marketPrice * (1 - spread);
    const balances = await biananceClient.fetchBalance();
    const assetBalance = balances.free[asset];
    const baseBalance = balances.free[base];
    const sellVolume = assetBalance * allocation;
    const buyVolume = (baseBalance * allocation) / marketPrice;

    await biananceClient.createLimitSellOrder(market, sellVolume, sellPrice);
    await biananceClient.createLimitBuyOrder(market, buyVolume, buyPrice);

    console.log(`
        New Tick for ${market}...
    `)
}
/**
 * Initiate Function
 */
const run = () => {
    const config = {
        asset: 'BTC',
        base: 'USDT',
        allocation: 0.1,
        spread: 0.2,
        tickInterval: 2000
    }
    const biananceClient = new ccxt.binance({
        apiKey: process.env.API_KEY,
        secret: process.env.API_SECRET
    });
    tick(config, biananceClient);
    setInterval(tick, config.tickInterval, config, biananceClient);
};