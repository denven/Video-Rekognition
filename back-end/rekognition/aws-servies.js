const AWS = require('aws-sdk');
const path = require("path");
const PATH = path.resolve(__dirname, "../.env");
require('dotenv').config({ path: PATH });

const AWS_DEFAULT_REGION = process.env.AWS_DEFLT_REGION;
const APP_ROLE_ARN = process.env.REK_ROLE_ARN;
const APP_SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const APP_REK_SQS_NAME = process.env.SQS_QUEUE_NAME;
const APP_VIDEO_BUCKET_NAME = process.env.S3_VIDEO_BUCKET;
const APP_FACES_BUCKET_NAME = process.env.S3_FACES_BUCKET;
const APP_FRAMES_BUCKET_NAME = process.env.S3_FRAMES_BUCKET;
const BACK_END_FILES_PATH = process.env.SERVER_FILES_PATH;

const APP_REK_DB_COLLECTION_ID = 'faces-db';
const APP_REK_TEMP_COLLECTION_ID = 'transition';

const BUCKET_MAX_KEYS = 1000;


if (!AWS.config.region) {
  AWS.config.update({region: AWS_DEFAULT_REGION});
}
const s3 = new AWS.S3();
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const rekognition = new AWS.Rekognition();

const createS3Bucket = (bucketName) => {
  var params = {
    Bucket: bucketName, /* required */
    ACL: 'private',
    CreateBucketConfiguration: { LocationConstraint: AWS_DEFAULT_REGION },
    // GrantFullControl: 'STRING_VALUE',
    // GrantRead: 'STRING_VALUE',
    // GrantReadACP: 'STRING_VALUE',
    // GrantWrite: 'STRING_VALUE',
    // GrantWriteACP: 'STRING_VALUE',
    // ObjectLockEnabledForBucket: true || false
  };
  s3.createBucket(params, (err, data) => {
    if (err) console.log(`${bucketName}: ${err.name}`); // an error occurred
    else     console.log(`Created bucket:`, data);           // successful response
  });
}

async function awsServiceStart() {

  console.log(`\n\n\n\nDefault AWS service region: ${AWS_DEFAULT_REGION}`);  
  
  AWS.config.getCredentials((err) => {
    if (err) { console.log(err.stack); } 
    else {
      console.log("Check dev credential passed");
    //   console.log("Access Key:", AWS.config.credentials.accessKeyId);
    //   console.log("Secret Access Key:", AWS.config.credentials.secretAccessKey);
    // console.log("Region:", AWS.config.region);
    }
  });

  if (typeof Promise === 'undefined') {
    AWS.config.setPromisesDependency(require('bluebird'));
  }

  try {
    let p1 = rekognition.createCollection({CollectionId: APP_REK_TEMP_COLLECTION_ID}).promise();
    let p2 = rekognition.createCollection({CollectionId: APP_REK_DB_COLLECTION_ID}).promise();  
    let data = await Promise.all([p1, p2]);
    console.log(`Created Collection, Id: ${data}`);           // excutes when all promises resolved
    // console.log(`Created Collection, Id: ${data.CollectionArn}`);           // successful response
  } catch (error) {
    console.log(`${error.name}: ${error.message}`);  // can only catch the 1st error in Promise.all
  }

  createS3Bucket(APP_VIDEO_BUCKET_NAME);
  createS3Bucket(APP_FRAMES_BUCKET_NAME);
  createS3Bucket(APP_FACES_BUCKET_NAME);

  const bucketParams = {
    Bucket: APP_VIDEO_BUCKET_NAME,
    MaxKeys: BUCKET_MAX_KEYS
  };

  // promise implementation version : test code
  // s3ListBuckets = s3.listBuckets().promise();
  // s3ListObjects = s3.listObjects(bucketParams).promise();
  // await Promise.all([s3ListBuckets, s3ListObjects])
  // .then((data) => {
  //   console.log("List All S3 buckets:");
  //   console.log(data[0].Buckets);
  //   console.log("List Objects in Video Bucket:");
  //   console.log(data[1]);
  // })
  // .catch((err) => console.log(err.stack));

};

////////////////////////////////////////////////////////////////////////
// This function is used to delete and create the collection by a collection ID
// This makes it easier to empty an collection other than deleting all the faces
// in the collection as all faceIds should be found and passed into deletFaces()
async function rebuildCollection (id) {

  try {
    await rekognition.deleteCollection( { CollectionId: id } ).promise();
  } catch (error) {
    console.log(`Failed to Delete the temporary collection, ${error.name} ${error.message}`);
  }

  try {
    await rekognition.createCollection( { CollectionId: id } ).promise();
  } catch (error) {
    console.log(`Failed to Create the temporary collection, ${error.name} ${error.message}`);
  }

}
 
//NOTE: This is the current solution by adding all faces into collection
//      Donot need to do the comparision before addint indexes
async function addFacesIntoCollection (bucketName, folder, collectionId) {

  const bucketParams = { 
    Bucket: bucketName,  /* required */
    Delimiter: '/',
    Prefix: folder + '/', 
    MaxKeys: BUCKET_MAX_KEYS 
  };  

  console.log(`Adding faces(s3 image file objects) into collection ${collectionId} ....`);

  let buckObjs = await s3.listObjectsV2(bucketParams).promise();
  let faceImages = buckObjs.Contents;
  faceImages.splice(0, 1);  // remove the folder object

  let faceIndexPromises = faceImages.map((faceImage) => {
    const params = {
      CollectionId: collectionId,
      DetectionAttributes: ["ALL"],
      ExternalImageId: faceImage.Key.split('/').pop(),
      Image: { S3Object: { Bucket: bucketName, Name: faceImage.Key } },
      MaxFaces: 10,
      QualityFilter: "HIGH"  // change to HIGH may be better
    };

    return rekognition.indexFaces(params).promise();   
  });

  let addRetData = await Promise.all(faceIndexPromises);
  console.log(`Added ${addRetData.length} faces into collection \"${collectionId}\"`);
}

////////////////////////////////////////////////////////////////////////
// functions use SQS are below

const getRekSQSMessageUrl = (queName) => {
  return new Promise ((resolve, reject) => {
    sqs.getQueueUrl({ QueueName: queName }).promise()
    .then((data) => {
      resolve(data.QueueUrl); 
    }).catch(err => reject(`Failed to get SQS name: , ${err}`));
  });
}

/**
 * Delete all the job messages whose job status is suceeded in SQS before starting
 * tasks for a new video analysis.
 * 
 * NOTE: It takes time if there are many message left in SQS since it loop to query 
 * all messages from SQS until there is no message left. 
 * So call it once for each video analysis (jobs) instead of each Rekognition job.
 *
 * @param {String} queName
 */
async function deleteSQSHisMessages(queName) {

  let sqsFullUrl = await getRekSQSMessageUrl(queName);
  const params = {
    AttributeNames: ["All"],
    MaxNumberOfMessages: 10,
    MessageAttributeNames: ["All"],
    QueueUrl: sqsFullUrl,
    VisibilityTimeout: 30,  // NOTE: DO NOT SET THIS TOO LARGE!!!
    WaitTimeSeconds: 5     // test timeout
  };

  console.log('Checking history SQS messages...');
  
  let msgEntries = []; 
  let queryStop = false;

  try {

    while (queryStop === false) {

      await sqs.receiveMessage(params).promise().then((data) => {
        if(data.Messages) {          
          console.log(`Found ${data.Messages.length} history messages in SQS`);
          for(const msg of data.Messages) {
            // if (msgContent.Status === 'SUCCEEDED') {
              msgEntries.push({ Id: msg.MessageId, ReceiptHandle: msg.ReceiptHandle });
            // }
          };

        } else {   
          queryStop = true;  // no more messages
        } 
      }).catch((err) => queryStop = true);

    }

    if(msgEntries.length > 0) {

      //NOTE: the max messages number is 10 when doing a batch delete
      if(msgEntries.length > 10) msgEntries.splice(10); 
      const deleteParams = { Entries: msgEntries, QueueUrl: params.QueueUrl }
      sqs.deleteMessageBatch(deleteParams, (err) => {
        if (err) console.log(`Error when deleting SQS Message: ${err}`);
        else console.log(`Deleted ${deleteParams.Entries.length} history messages(from completed jobs) in SQS`); 
      }); 

    } else { console.log(`No queued messages in SQS`) }

  } catch(error) { 
    console.log(`SQS History Msg Polling Error:`, error);
  };

}


/**
 * Query the Rekognition Job status from SQS message content.
 * 
 * @param {String} queName 
 * @param {Object} task {JobName, JobId}
 */
async function queryJobStatusFromSQS(queName, task) {

  let sqsFullUrl = await getRekSQSMessageUrl(queName);
  const params = {
    AttributeNames: ["SenderId"],
    MaxNumberOfMessages: 10,
    MessageAttributeNames: ["All"],
    QueueUrl: sqsFullUrl,
    VisibilityTimeout: 30,    // NOTE: There is bug here, if you set it greater, you nay not be able get message from SQS
    WaitTimeSeconds: 20       // test timeout, max allowed value is 20
  };    

  let jobDone = false;  //
  try {
    while(jobDone === false) {
      await sqs.receiveMessage(params).promise().then((data) => {
        if(data.Messages) {
          for(const msg of data.Messages) {
            const msgContent = JSON.parse(JSON.parse(msg.Body).Message);
            if (msgContent.JobId === task.JobId) {

              if (msgContent.Status === 'SUCCEEDED') {
                console.log(`Rekognition Job Status: ${msgContent.Status}, JobName: ${task.JobName}`);

                // Delete the message right away when we get a successful job status
                sqs.deleteMessage( { QueueUrl: sqsFullUrl, ReceiptHandle: msg.ReceiptHandle }, 
                  (err, data) => { if(err) console.log(err, err.stack) });
                jobDone = true;
              } else {
                console.log(`Rekognition Job Status: ${msgContent.Status}, continue polling... JobName: ${task.JobName}`);
              }
            }
          } // end of for  
        } else {
          console.log(`Timeout when getting JobStatus msg in ${params.WaitTimeSeconds} seconds from SQS, try another time...\
          JobName: ${task.JobName}`);
        }
      })
    }
  }
  catch(error) { 
    console.log("SQS New Task Status Msg Receive Error:", error); 
  };
  
  return jobDone;
}

module.exports = {
  AWS, s3, rekognition, 
  AWS_DEFAULT_REGION,
  APP_VIDEO_BUCKET_NAME,
  APP_FACES_BUCKET_NAME,
  APP_FRAMES_BUCKET_NAME,
  APP_ROLE_ARN,
  APP_SNS_TOPIC_ARN,
  APP_REK_SQS_NAME,
  APP_REK_DB_COLLECTION_ID,
  APP_REK_TEMP_COLLECTION_ID,
  BUCKET_MAX_KEYS,
  BACK_END_FILES_PATH,
  awsServiceStart,
  deleteSQSHisMessages,
  queryJobStatusFromSQS,
  rebuildCollection,
  addFacesIntoCollection
}