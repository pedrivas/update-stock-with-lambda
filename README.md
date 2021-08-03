# update-stock-with-lambda

This project has the objective of integrate the stock data of a local store with the woocommerce store.

I'm currently developing some improvements to make it work with Puppeteer.

## Technology

☁ Cloud: AWS - S3, Dynamo DB, Lambda, CloudFormation

⬅ Backend: Node js, Serverless Framework

## Getting Started

### Concepts
First of all, there are some concepts that we need to understand. 
The application is going to read from an s3 bucket a xls file with the stock data provided by the ERP of the local store. 
Then, is going to check and update a dynamo db table with the ID relations between the local and the web stores.
Finally, is going to make API requests to copy the data from the dynamo db table to the web store. 

### Addings The First Items to the Dynamo DB
The initial list of ID relations between the local and the web stores was uploaded reading a ,csv file by an CloudFormation, which is available at the aws blog.
https://aws.amazon.com/pt/blogs/database/implementing-bulk-csv-ingestion-to-amazon-dynamodb/

### Data file to S3
Upload the .xls file to the s3 bucket.

## Setup
Git clone this repository, then
```
npm i 
```
Global Install and Configure the serverless Framework
```
npm i -g serverless

serverless config credentials --provider aws --key AKYourKey --secret YourSecret 
```

Deploy the application to your AWS account
```
serverless deploy -v
```

Upload a xls file to the s3 bucket to trigger the lambda function.