const AwsConfig = require('../configs/Credentials_AWS')
const Wc = require('../configs/Credentials_WC')

class UpdateStock {

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
          if (update) {
              updateQuantity(wb);
          } else {
              return cb(wb);
          }
        });
    
        return workbook;
    
      } catch (err) {
        console.log("Error", err);
      };
    }
          
  async updateQuantity(wb){
  
      let sheetName = wb.SheetNames[0];
      let worksheet = wb.Sheets[sheetName];
  
      const numberOfItems = parseInt((worksheet["!ref"]).substr(4,3))
  
      var requestBody = null
      for(var product = 2;product <= numberOfItems; product++ ) {
        wcIdCellAdress = `C${product}`
        wcIdCell = worksheet[wcIdCellAdress];
        wcIdValue = (wcIdCell ? wcIdCell.v : undefined);
        productQuantityCellAdress = `G${product}`
        productQuantityCell = worksheet[productQuantityCellAdress];
        productQuantityValue = (productQuantityCell ? productQuantityCell.v : undefined);
        requestBody = JSON.stringify({
            manage_stock: true,
            stock_quantity: productQuantityValue
        })
        requestBody = JSON.parse(requestBody)
        await wc.api.put(`products/${wcIdValue}`,requestBody)
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
}

module.exports = UpdateStock