const UpdateStock = require('./UpdateStock');

//exports.handler = async function(event, context, callback) {
  lambda();

  async function lambda() {
    
    const updateStock = new UpdateStock();
    await updateStock.addItemsToDynamoDB();
    
  };

//}