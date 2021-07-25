const AwsConfig = require('./configs/Credentials_AWS')
const Wc = require('./configs/Credentials_WC')
const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");

class UpdateStock {

  item;   
  itemParams;
  DDBclient = new DynamoDBClient({ region: "sa-east-1" });
  itemKey;
  itemExists;
  ddbItem;

  constructor() {
    this.item = {};
  }

  async getWorkbookFromS3(update, cb)  {
    try {
      console.log("> Getting content from S3");

      const {
        S3Client,
        GetObjectCommand
      } = require("@aws-sdk/client-s3")
      
      const xlsx = require('xlsx');
      const awsConfig = new AwsConfig();
      const wc = new Wc();
  
      // Create a helper function to convert a ReadableStream to a string.
      const streamToWorkbook = (stream, cb) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("error", reject);
          stream.on("end", () => {
            //resolve(Buffer.concat(chunks).toString("utf8"));
            var buffer = Buffer.concat(chunks);
            const workbook = xlsx.read(buffer);
            return cb(workbook);
          });
        });
  
      const s3Client = new S3Client({
        region: awsConfig.region,
        credentials: {
          accessKeyId: awsConfig.AWS_ACCESS_KEY_ID,
          secretAccessKey: awsConfig.AWS_SECRET_ACCESS_KEY
        }
      });
  
      const bucketParams = {
        Bucket: "excel-products-database-toca-das-raposas",
        Key: "Estoque210237.xls",
      };
  
      // Get the object} from the Amazon S3 bucket. It is returned as a ReadableStream.
      const data  = await s3Client.send(new GetObjectCommand(bucketParams));
        //return data; // For unit tests.
  
      // Convert the ReadableStream to a workbook.
      const workbook = await streamToWorkbook(data.Body, (wb) => {     
          return cb(wb);        
      });
  
      return workbook;
  
    } catch (err) {
      console.log("Error", err);
    };
  }

  async queryDDB() {
    const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");

    const DDBclient = new DynamoDBClient({ region: "sa-east-1" });

    const queryParams = {
      TableName: 'products-toca',
      IndexName: 'WC-index',
      KeyConditionExpression: "WC = :wcValue",
      ExpressionAttributeValues: {
          ":wcValue" : {"S": "3575"}
      },
      "ProjectionExpression": "WC, Price, Quantity",
      "ScanIndexForward": false
    }

    const query  = await DDBclient.send(new QueryCommand(queryParams))
    .then((response) => {
      response.Items.forEach(function (element, index, array) {
        console.log(element.Title.S + " (" + element.Subtitle.S + ")");
      });
      console.log(response);
    })
    .catch((error) => {
      console.log("Error", error);
    })

  }

  async addItemsToDynamoDB() {
    await this.getWorkbookFromS3(false, (wb) => {
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
      
      if (this.item.WC) {
        await this.updateWCItem();
      }

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

    this.item = {};
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
      this.item.WC = this.ddbItem.WC.S ? this.ddbItem.WC.S : '';
      this.item.WCVariationOf = this.ddbItem.WCVariationOf.S ? this.ddbItem.WCVariationOf.S : '';
    } else {
      this.item.WC = '';
      this.item.WCVariationOf = '';
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

  async updateWCItem() {

    const wc = new Wc();

    var requestBody = null

    requestBody = JSON.stringify({
      manage_stock: true,
      stock_quantity: this.item.quantity,
      regular_price: this.item.price.toString()
    })
    requestBody = JSON.parse(requestBody);
    const url = this.item.WCVariationOf ? `products/${this.item.WCVariationOf}/variations/${this.item.WC}` : `products/${this.item.WC}`
    await wc.api.put(url,requestBody)
    .then((response) => {
      console.log("Response Status:", response.status);
      console.log("Response Headers:", response.headers);
      console.log("Response Data:", response.data);
      console.log("Total of pages:", response.headers['x-wp-totalpages']);
      console.log("Total of items:", response.headers['x-wp-total']);
    })
    .catch((error) => {
      console.log("Response Status:", error.response.status);
      console.log("Response Headers:", error.response.headers);
      console.log("Response Data:", error.response.data);
    })
  
  }

}

module.exports = UpdateStock