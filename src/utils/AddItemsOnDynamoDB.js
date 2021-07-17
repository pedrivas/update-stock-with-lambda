const AwsConfig = require('../configs/Credentials_AWS');
const UpdateStock = require(('./UpdateStock')) ;

const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

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
            this.setItemKey();

            await this.getItem();

            this.setItemParams();
            
            await this.putItem();

        }

    }

    async getItem() {

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
        const data  = await this.DDBclient.send(new PutItemCommand(this.itemParams))
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {
            console.log("Error", error);
        })

    }

    setItemProperties(itemRow, wb){
        let sheetName = wb.SheetNames[0];
        let worksheet = wb.Sheets[sheetName];

        let uuidCellAdress = `A${itemRow}`
        let uuidCell = worksheet[uuidCellAdress];
        this.item.uuid = (uuidCell ? uuidCell.v.toString() : undefined);

        let nameCellAdress = `B${itemRow}`
        let nameCell = worksheet[nameCellAdress];
        this.item.name = (nameCell ? nameCell.v : undefined);
        
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

    setItemParams() {

        if (this.ddbItem) {
            this.item.WC = this.ddbItem.WC ? unmarshall(this.ddbItem.WC) : '';
            this.item.WCVariationOf = this.ddbItem.WCVariationOf ? unmarshall(this.ddbItem.WCVariationOf) : '';
        } 

        let params = {
            "uuid": this.item.uuid, 
            "Name": this.item.name,
            "Price": this.item.price, 
            "Quantity": this.item.quantity,
            "SKU": this.item.SKU,
            "WC": this.item.WC,
            "WCVariationOf": this.item.WCVariationOf,
        };

        this.itemParams = {
            TableName: "products-toca",
            Item: marshall(params), 
            ReturnConsumedCapacity: "TOTAL", 
            TableName: "products-toca"
        };
    }

    setItemKey() {
        this.itemKey = {
            TableName: 'products-toca',
            Key: {
                    uuid: { S: this.item.uuid},
                },
        }
    }

}

module.exports = AddItemsOnDynamoDB