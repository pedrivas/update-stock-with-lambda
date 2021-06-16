const AwsConfig = require('../configs/Credentials_AWS');
const UpdateStock = require(('./UpdateStock')) ;

const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

class AddItemsOnDynamoDB {

    items;
    updateStock;    
    itemParams;
    client = new DynamoDBClient({ region: "sa-east-1" });

    constructor() {
        this.items = [];
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

        

        for (var items = 1; items <= numberOfItems; items++  ) {
            this.itemParams = {
                Item: {
                "AlbumTitle": {
                S: "Somewhat Famous"
                }, 
                "Artist": {
                S: "No One You Know"
                }, 
                "SongTitle": {
                S: "Call Me Today"
                }
                }, 
                ReturnConsumedCapacity: "TOTAL", 
                TableName: "Music"
            };

            if (this.veryfyIfItemExists(this.itemParams)) {
                this.updateItem(this.itemParams);
            } else {
                this.putItem(this.itemParams);
            }
        }

    }

    veryfyIfItemExists(item) {
        itemExists = true;

        return itemExists
    }

    putItem(item) {
        dynamodb.putItem(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
            /*
            data = {
            ConsumedCapacity: {
            CapacityUnits: 1, 
            TableName: "Music"
            }
            }
            */
        });
    }

    updateItem(item) {

    }

}

module.exports = AddItemsOnDynamoDB