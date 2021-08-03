'use strict';

const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3")
const Wc = require('./configs/Credentials_WC')
const xlsx = require('xlsx');
const s3Client = new S3Client();

module.exports.handle = async ({ Records: records }, context) => {

  var item;   
  var itemParams;
  var DDBclient = new DynamoDBClient({ region: "sa-east-1" });
  var itemKey;
  var ddbItem;

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

  const bucketParams = {
      Bucket: "excel-products-database-toca-das-raposas2",
      Key: "Estoque210237.xls",
    };

  // Get the object} from the Amazon S3 bucket. It is returned as a ReadableStream.
  const data  = await s3Client.send(new GetObjectCommand(bucketParams));
  //return data; // For unit tests.

  // Convert the ReadableStream to a workbook.
  const workbook = await streamToWorkbook(data.Body, (wb) => {     
    addItems(wb);        
  });

  async function addItems(wb) {     

    let sheetName = wb.SheetNames[0];
    let worksheet = wb.Sheets[sheetName];

    const numberOfItems = parseInt((worksheet["!ref"]).substr(4,3));
    /* This example adds a new item to the Music table. */

    for (var itemRow = 2; itemRow <= numberOfItems; itemRow++  ) {

      setItemProperties(itemRow, wb);
      setItemKey();

      await getItem();

      setItemParams();
      
      await putItem();
      
      if (item.WC) {
        await updateWCItem();
      }

    }

  }

  async function getItem() {

      await DDBclient.send(new GetItemCommand(itemKey))
      .then((response) => {
        // Successful request
        console.log(response.Item);
        ddbItem = response.Item;
        return response.Item;
      })
      .catch((error) => {
        console.log("Error", error);
      })

  }

  async function putItem() {
    const data  = await DDBclient.send(new PutItemCommand(itemParams))
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log("Error", error);
    })

  }

  function setItemProperties(itemRow, wb){

    item = {};
    let sheetName = wb.SheetNames[0];
    let worksheet = wb.Sheets[sheetName];

    let uuidCellAdress = `A${itemRow}`
    let uuidCell = worksheet[uuidCellAdress];
    item.uuid = (uuidCell ? uuidCell.v.toString() : undefined);

    let nameCellAdress = `B${itemRow}`
    let nameCell = worksheet[nameCellAdress];
    item.name = (nameCell ? nameCell.v : undefined);
    
    let priceCellAdress = `H${itemRow}`
    let priceCell = worksheet[priceCellAdress];
    item.price = (priceCell ? priceCell.v : undefined);

    let quantityCellAdress = `L${itemRow}`
    let quantityCell = worksheet[quantityCellAdress];
    item.quantity = (quantityCell ? quantityCell.v : undefined);

    let SKUCellAdress = `C${itemRow}`
    let SKUCell = worksheet[SKUCellAdress];
    item.SKU = (SKUCell ? SKUCell.v : undefined);

  }

  function setItemParams() {

    if (ddbItem) {
      item.WC = ddbItem.WC.S ? ddbItem.WC.S : '';
      item.WCVariationOf = ddbItem.WCVariationOf.S ? ddbItem.WCVariationOf.S : '';
    } else {
      item.WC = '';
      item.WCVariationOf = '';
    }

    let params = {
      "uuid": item.uuid, 
      "Name": item.name,
      "Price": item.price, 
      "Quantity": item.quantity,
      "SKU": item.SKU,
      "WC": item.WC,
      "WCVariationOf": item.WCVariationOf,
    };

    itemParams = {
      TableName: "products-toca",
      Item: marshall(params), 
      ReturnConsumedCapacity: "TOTAL", 
      TableName: "products-toca"
    };
  }

  function setItemKey() {
    itemKey = {
      TableName: 'products-toca',
      Key: {
        uuid: { S: item.uuid},
      },
    }
  }

  async function updateWCItem() {

    const wc = new Wc();

    var requestBody = null

    requestBody = JSON.stringify({
      manage_stock: true,
      stock_quantity: item.quantity,
      regular_price: item.price.toString()
    })
    requestBody = JSON.parse(requestBody);
    const url = item.WCVariationOf ? `products/${item.WCVariationOf}/variations/${item.WC}` : `products/${item.WC}`
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

};
