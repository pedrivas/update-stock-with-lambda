const AwsConfig = require('../configs/Credentials_AWS');
const UpdateStock = require(('./UpdateStock')) ;

const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

class AddItemsOnDynamoDB {

    item;
    updateStock;    
    itemParams;
    DDBclient = new DynamoDBClient({ region: "sa-east-1" });
    itemKey;
    itemExists;

    constructor() {
        this.updateStock = new UpdateStock();
    }

    async addItemsToDynamoDB() {
        const wb = await this.updateStock.getWorkbookFromS3(false, (wb) => {
            console.log(wb);
            this.addItems(wb);
        });

    }

    addItems(wb) {
        let sheetName = wb.SheetNames[0];
        let worksheet = wb.Sheets[sheetName];

        
    
        const numberOfItems = parseInt((worksheet["!ref"]).substr(4,3));
        /* This example adds a new item to the Music table. */

        

        for (var itemRow = 2; itemRow <= numberOfitemRow; itemRow++  ) {

            this.setItemProperties(itemRow)

            this.itemParams = {
                Item: {
                "uuid": {
                S: "118"
                }, 
                "WC": {
                S: "No One You Know"
                }, 
                "SongTitle": {
                S: "Call Me Today"
                }
                }, 
                ReturnConsumedCapacity: "TOTAL", 
                TableName: "products-toca"
            };

            this.itemKey = {
                TableName: 'products-toca',
                Key: {'uuid': '118'},
            }

            if (this.getItem()) {
                this.updateItem();
            } else {
                this.putItem();
            }
        }

    }

    getItem() {

    }

    async putItem() {
        // dynamodb.putItem(params, function(err, data) {
        //     if (err) console.log(err, err.stack); // an error occurred
        //     else     console.log(data);           // successful response
        //     /*
        //     data = {
        //     ConsumedCapacity: {
        //     CapacityUnits: 1, 
        //     TableName: "Music"
        //     }
        //     }
        //     */
        // });
        const data  = await this.DDBclient.send(new PutItemCommand(this.itemParams));
        console.log(data);

    }

    updateItem() {

    }

    setItemProperties(itemRow){
        let uuidCellAdress = `A${itemRow}`
        let uuidCell = worksheet[uuidCellAdress];
        this.item.uuid = (uuidCell ? uuidCell.v : undefined);
        
        let priceCellAdress = `H${itemRow}`
        let priceCell = worksheet[priceCellAdress];
        this.item.price = (priceCell ? priceCell.v : undefined);
    }

}

module.exports = AddItemsOnDynamoDB