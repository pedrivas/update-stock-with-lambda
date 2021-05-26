const {Readable} = require("stream");
const {createWriteStream} = require("fs");

const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
//import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

/// TENTATIVA NOVA

const {
  S3Client,
  GetObjectCommand
} = require("@aws-sdk/client-s3")

const AWS_ACCESS_KEY_ID = 'AKIATYS6DR2VAR7ZHD7S';
const AWS_SECRET_ACCESS_KEY = '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';

const xlsx = require('xlsx');

const getContent = async() => {
	try {
		console.log("> Getting content from S3");

    // Create a helper function to convert a ReadableStream to a string.
    const streamToString = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => {
          //resolve(Buffer.concat(chunks).toString("utf8"));
          var buffer = Buffer.concat(chunks);
          var workbook = xlsx.read(buffer);
          console.log("workbook", workbook)
        });
      });

    const s3Client = new S3Client({
      region: "sa-east-1",
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
      }
    });

    const bucketParams = {
      Bucket: "excel-products-database-toca-das-raposas",
      Key: "DEPARA_PRODUTOS.xlsx",
    };

    // Get the object} from the Amazon S3 bucket. It is returned as a ReadableStream.
    const data  = await s3Client.send(new GetObjectCommand(bucketParams));
      //return data; // For unit tests.

    // Convert the ReadableStream to a string.
    const bodyContents = await streamToString(data.Body);
    console.log(bodyContents);
    //workbook = XLSX.read(bodyContents);
      return workbook;

  } catch (err) {
    console.log("Error", err);
  };
}
const buffer = getContent();
console.log(buffer);

exports.handler = function(event, context, callback) {
   const api = new WooCommerceRestApi({
     url: "http://petshoptocadasraposas.com.br",
     consumerKey: "ck_7827b0e590d572e671b187b63765ba8545a4b077",
     consumerSecret: "cs_4ec3d70b4a2631884bb4b7b4740822135dac4121",
     version: "wc/v3"
   });
   
   /*
   const Excel = require('exceljs');
   
   const deparaWorkbook = new Excel.Workbook();
   const productsWorkbook = new Excel.Workbook();
   
   var dePara = [];
   
   const deParaFileName = './assets/DEPARA_PRODUTOS.xlsx';
   
   deparaWorkbook.xlsx.readFile(deParaFileName).then(() => {
     var worksheet = deparaWorkbook.getWorksheet("DEPARA");
     var row = null;
     var idWooList = null
     var quantityList = null
   
     var stockQuantityList = null;
     idWooList = worksheet.getColumn(3).values 
     quantityList = worksheet.getColumn(7).values 
   
     for (var numberReg = 2; numberReg <= idWooList.length; numberReg++ ){
       dePara.push([idWooList[numberReg],quantityList[numberReg]])
     }
     updateQuantity();
     }
   )
   */
   updateQuantity();
   
   async function updateQuantity(){
     var requestBody = null
     //for(var product = 0;product <= dePara.length;product++ ) {
    //   requestBody = JSON.stringify({
    //      manage_stock: true,
    //      stock_quantity: dePara[product][1]
    //   })
       requestBody = JSON.stringify({"description": "Lambda Funcionando!"})
       requestBody = JSON.parse(requestBody)
       //await api.put(`products/${dePara[product][0]}`,requestBody)
       await api.put(`products/4060`,requestBody)
       .then((response) => {
             // Successful request
             console.log("Response Status:", response.status);
             console.log("Response Headers:", response.headers);
             console.log("Response Data:", response.data);
             console.log("Total of pages:", response.headers['x-wp-totalpages']);
             console.log("Total of items:", response.headers['x-wp-total']);
           })
           .catch((error) => {
             // Invalid request, for 4xx and 5xx statuses
             console.log("Response Status:", error.response.status);
             console.log("Response Headers:", error.response.headers);
             console.log("Response Data:", error.response.data);
           })
           .finally(() => {
             // Always executed.
           });
   
     //}
   }
};