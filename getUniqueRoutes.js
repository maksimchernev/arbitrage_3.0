const Routes = require('./models/routes')
var addHours = require('date-fns/addHours')

const getUniqueRoutes = async (currentRoutes) => {
    const time = addHours(new Date(), -2)
    try {
        Routes.deleteMany({createdAt: { $lt: time }})
    } catch(e) {
        throw new Error('Error in deleting old stuff', e)
    }
    
    try {
        const oldRoutes = await Routes.find({ createdAt: { $gte: time } });
        console.log('got oldRoutes');
        let uniqueRoutes = [];

        if (oldRoutes.length != 0) {
          //getting unique Routes
          for (let newObj of currentRoutes) {
            let exists;
            for (let oldObj of oldRoutes) {
              if (newObj.StepOne.Ticker == oldObj.Ticker1 && newObj.StepTwo.Ticker == oldObj.Ticker2 && newObj.StepThree.Ticker == oldObj.Ticker3 && newObj.StepOne.Name == oldObj.Ex1 && newObj.StepTwo.Name == oldObj.Ex2 && newObj.StepThree.Name == oldObj.Ex3) {
                //console.log(` already seen: ${newObj.Ticker} buy at ${newObj.BuyExchange.Name} sell at ${newObj.SellExchange.Name}`);
                exists = true;
                break;
              } else {
                exists = false
              }
            }
            if (!exists) {
                console.log(`Unique! ${newObj.StepOne.Ticker} -> ${newObj.StepTwo.Ticker} -> ${newObj.StepThree.Ticker} exchanges: ${newObj.StepOne.Name} -> ${newObj.StepTwo.Name} -> ${newObj.StepThree.Name}`);
              uniqueRoutes.push(newObj);
            }
          }
        } else {
          throw new Error('no recent old Routes');
        }
        return uniqueRoutes
      } catch (e) {
        throw new Error('ERROR getting old Routes', e);
      }
}

module.exports = getUniqueRoutes;