const Combinations = require('./models/combinations')
var addHours = require('date-fns/addHours')

const getUniqueCombinations = async (currentCombinations) => {
    const time = addHours(new Date(), -2)
    try {
        Combinations.deleteMany({createdAt: { $lt: time }})
    } catch(e) {
        throw new Error('Error in deleting old stuff', e)
    }
    
    try {
        const oldCombinations = await Combinations.find({ createdAt: { $gte: time } });
        console.log('got oldCombinations');
        let uniqueCombinations = [];

        if (oldCombinations.length != 0) {
          //getting unique combinations
          for (let newObj of currentCombinations) {
            let exists;
            for (let oldObj of oldCombinations) {
              if (newObj.Ticker == oldObj.Ticker && newObj.BuyExchange.Name == oldObj.Buy_Exchange && newObj.SellExchange.Name == oldObj.Sell_Exchange) {
                //console.log(` already seen: ${newObj.Ticker} buy at ${newObj.BuyExchange.Name} sell at ${newObj.SellExchange.Name}`);
                exists = true;
                break;
              } else {
                exists = false
              }
            }
            if (!exists) {
                console.log(`Unique! ${newObj.Ticker} buy at ${newObj.BuyExchange.Name} sell at ${newObj.SellExchange.Name}`);
              uniqueCombinations.push(newObj);
            }
          }
        } else {
          throw new Error('no recent old combinations');
        }
        return uniqueCombinations
      } catch (e) {
        throw new Error('ERROR getting old combinations', e);
      }
}

module.exports = getUniqueCombinations;