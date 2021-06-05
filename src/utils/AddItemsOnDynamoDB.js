const AwsConfig = require('../configs/Credentials_AWS');
const UpdateStock = require(('./UpdateStock')) ;

class AddItemsOnDynamoDB {

    items;
    updateStock;    

    constructor() {
        this.items = [];
        this.updateStock = new UpdateStock();
    }

    async verifyIfExists() {
        const wb = await this.updateStock.getWorkbookFromS3(false);
        console.log(wb);
        let sheetName = wb.SheetNames[0];
        let worksheet = wb.Sheets[sheetName];
    
        const numberOfItems = parseInt((worksheet["!ref"]).substr(4,3))
    }

    addItem() {

    }

}

module.exports = AddItemsOnDynamoDB