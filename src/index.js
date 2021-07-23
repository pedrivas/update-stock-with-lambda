const UpdateStock = require('./utils/UpdateStock');

exports.handler = function(event, context, callback) {
  lambda();
}

async function lambda() {
  
  const updateStock = new UpdateStock();
  await updateStock.addItemsToDynamoDB();
  
};
