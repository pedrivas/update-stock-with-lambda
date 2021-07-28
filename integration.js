'use strict';

const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3")
const xlsx = require('xlsx');
const s3Client = new S3Client();

module.exports.handle = async ({ Records: records }) => {
    
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

    try {
        await Promise.all(records.map(async record => {
            const { key } = record.s3.object;
            const sheet  = await s3Client.send(new GetObjectCommand({
                Bucket: process.env.bucket,
                Key: key,
            }).promise());

            const workbook = await streamToWorkbook(sheet.Body, (wb) => {     
                return cb(wb);        
            });

        }));

        return {
            statusCode: 201,
            body: {}
        };
    } catch(err) {
        return err;
    }

    

};
