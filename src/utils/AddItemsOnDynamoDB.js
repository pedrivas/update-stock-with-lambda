const AwsConfig = require('../configs/Credentials_AWS');
const UpdateStock = require(('./UpdateStock')) ;

const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");

class AddItemsOnDynamoDB {

    item;
    updateStock;    
    itemParams;
    DDBclient = new DynamoDBClient({ region: "sa-east-1" });
    itemKey;
    itemExists;
    ddbItem;

    constructor() {
        this.updateStock = new UpdateStock();
        this.item = {};
    }

    async addItemsToDynamoDB() {
        await this.updateStock.getWorkbookFromS3(false, (wb) => {
            this.addItems(wb);
        });

    }

    async addItems(wb) {     

        let sheetName = wb.SheetNames[0];
        let worksheet = wb.Sheets[sheetName];
    
        const numberOfItems = parseInt((worksheet["!ref"]).substr(4,3));
        /* This example adds a new item to the Music table. */

        for (var itemRow = 2; itemRow <= numberOfItems; itemRow++  ) {

            this.setItemProperties(itemRow, wb);

            this.itemParams = {
                Item: {
                "uuid": {
                S: this.item.uuid
                }, 
                "Price": {
                N: this.item.price
                }, 
                "Quantity": {
                N: this.item.quantity
                },
                "SKU": {
                S: this.item.SKU
                }
                }, 
                ReturnConsumedCapacity: "TOTAL", 
                TableName: "products-toca"
            };

            this.itemKey = {
                TableName: 'products-toca',
                Key: {
                        uuid: { S: this.item.uuid},
                    },
            }

            let response = await this.getItem();

            if (this.ddbItem) {
                this.updateItem();
            } else {
                this.putItem();
            }
        }

    }

    async getItem() {

        // PARA TESTES
        this.itemKey.Key.uuid.S = '109'

        await this.DDBclient.send(new GetItemCommand(this.itemKey))
        .then((response) => {
            // Successful request
            console.log(response.Item);
            this.ddbItem = response.Item;
            return response.Item;
        })
        .catch((error) => {
            console.log("Error", error);
        })

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

    setItemProperties(itemRow, wb){
        let sheetName = wb.SheetNames[0];
        let worksheet = wb.Sheets[sheetName];

        let uuidCellAdress = `A${itemRow}`
        let uuidCell = worksheet[uuidCellAdress];
        this.item.uuid = (uuidCell ? uuidCell.v.toString() : undefined);
        
        let priceCellAdress = `H${itemRow}`
        let priceCell = worksheet[priceCellAdress];
        this.item.price = (priceCell ? priceCell.v : undefined);

        let quantityCellAdress = `L${itemRow}`
        let quantityCell = worksheet[quantityCellAdress];
        this.item.quantity = (quantityCell ? quantityCell.v : undefined);

        let SKUCellAdress = `C${itemRow}`
        let SKUCell = worksheet[SKUCellAdress];
        this.item.SKU = (SKUCell ? SKUCell.v : undefined);

    }

}

module.exports = AddItemsOnDynamoDB