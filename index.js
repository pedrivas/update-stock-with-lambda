const AwsConfig = require('./Credentials_AWS')
const WcConfig = require('./Credentials_WC')
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const {
  S3Client,
  GetObjectCommand
} = require("@aws-sdk/client-s3")

const xlsx = require('xlsx');
const awsConfig = new AwsConfig();
const wcConfig = new WcConfig();

const getWorkbookFromS3 = async() => {
	try {
		console.log("> Getting content from S3");

    // Create a helper function to convert a ReadableStream to a string.
    const streamToWorkbook = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => {
          //resolve(Buffer.concat(chunks).toString("utf8"));
          var buffer = Buffer.concat(chunks);
          const workbook = xlsx.read(buffer);
          return workbook;
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
      Key: "DEPARA_PRODUTOS.xlsx",
    };

    // Get the object} from the Amazon S3 bucket. It is returned as a ReadableStream.
    const data  = await s3Client.send(new GetObjectCommand(bucketParams));
      //return data; // For unit tests.

    // Convert the ReadableStream to a workbook.
    const workbook = await streamToWorkbook(data.Body);

    return workbook;

  } catch (err) {
    console.log("Error", err);
  };
}
const workbook = getWorkbookFromS3();

exports.handler = function(event, context, callback) {
   const api = new WooCommerceRestApi({
     url: "http://petshoptocadasraposas.com.br",
     consumerKey: "ck_7827b0e590d572e671b187b63765ba8545a4b077",
     consumerSecret: "cs_4ec3d70b4a2631884bb4b7b4740822135dac4121",
     version: "wc/v3"
   });
      
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
   
   async function updateQuantity(){
     var requestBody = null
     for(var product = 0;product <= dePara.length;product++ ) {
      requestBody = JSON.stringify({
         manage_stock: true,
         stock_quantity: dePara[product][1]
      })
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
   }
};