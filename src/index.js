const AddItemsOnDynamoDB = require('./utils/AddItemsOnDynamoDB');
const UpdateStock = require('./utils/UpdateStock');

lambda();

//exports.handler = function(event, context, callback) {
async function lambda() {
  
  const updateStock = new UpdateStock();
  const addItemsOnDynamoDB = new AddItemsOnDynamoDB();

  await addItemsOnDynamoDB.addItemsToDynamoDB();
  await updateStock.getWorkbookFromS3(true);
  
};
