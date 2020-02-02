const _ = require('lodash');
const chalk = require('chalk');
const INFO = chalk.bold.green;
const ERROR = chalk.bold.red;
const HINT = chalk.keyword('orange');
const Chalk = console.log;

const { s3, rekognition,
  APP_VIDEO_BUCKET_NAME, APP_FACES_BUCKET_NAME, APP_REK_SQS_NAME,
  APP_REK_TEMP_COLLECTION_ID, APP_REK_DB_COLLECTION_ID, 
  BUCKET_MAX_KEYS, APP_ROLE_ARN, APP_SNS_TOPIC_ARN,
  deleteSQSHisMessages, queryJobStatusFromSQS, rebuildCollection, 
  addFacesIntoCollection } = require('./aws-servies');

const { getPersonDetailsFromVideo, getPersonRecuringAmongVideos } = require('./rek-search');
const { startTrackingAnalysis } = require('./rek-traffic');
const { cropFacesFromLocalVideo } = require('../filemanager/videos');
const db = require('../database/db');

/**
 * Call aws rekognition API to detect all faces(not person) in the video
 * @param {String} videoKey 
 */
const startFaceDetection = (videoKey) => {

  return new Promise((resolve, reject) => {

    const params = {
      Video: { /* required */
        S3Object: { Bucket: APP_VIDEO_BUCKET_NAME, Name: videoKey }
      },
      // ClientRequestToken: "startFaceDetectionToken",
      FaceAttributes: "ALL",  // or "DEFAULT"
      JobTag: "startFaceDetection",
      NotificationChannel: {
        RoleArn: APP_ROLE_ARN, 
        SNSTopicArn: APP_SNS_TOPIC_ARN
      }
    }

    rekognition.startFaceDetection(params, (err, task) => {
      if (err) reject(err, err.stack); // an error occurred
      else     resolve(task);           // successful response
    });
  });

};

/**
 * Get the keys and values we need from FaceDetails Object 
 * @param {Object: FaceDetails} faceData 
 */
const getFacesDetails = (faceData) => {
  
  let facesDetails = [];

  for (const face of faceData.Faces) {
    let newFace = {
      "Timestamp": face.Timestamp,
      "Face": _.pick(face.Face, "Confidence", "Gender", "Emotions", "AgeRange", "BoundingBox", "Smile")
    };
    facesDetails.push(newFace);
  }

  return facesDetails;
};

/**
 * Prepare faces by taking screenshots, cropping faces from screenshots, and then
 * call the Rekognition api to detect faces in the video.
 * @param {String} videoKey 
 */
async function startVideoPreAnalysis (videoKey) {
  
  console.time('Pre-Analysis Job');

  try {
    let job = await startFaceDetection(videoKey);
    let task = { JobName: 'FaceDetection', JobId: job.JobId };  

    // TODO: when total number of faces > 1000 for the long duration videos
    const params = { JobId: task.JobId, MaxResults: 1000};  
    Chalk(HINT(`Starts Job: Face Detection, JobId: ${task.JobId}`));   
          
    let status = await queryJobStatusFromSQS(APP_REK_SQS_NAME, task);  
    console.log(`Job ${status ? 'SUCCEEDED' : 'NOT_DONE'} from SQS query: ${status}`);

    let data = await rekognition.getFaceDetection(params).promise();

    let detailedFaces = getFacesDetails(data);  
    let copyDetailedFaces = _.cloneDeep(detailedFaces); // use more memory
    // let copyDetailedFaces = JSON.parse(JSON.stringify(detailedFaces));

    await cropFacesFromLocalVideo(copyDetailedFaces, videoKey); //comment when test
    await rebuildCollection(APP_REK_TEMP_COLLECTION_ID);
    await addFacesIntoCollection(APP_FACES_BUCKET_NAME, videoKey, APP_REK_TEMP_COLLECTION_ID);

    Chalk(INFO('Job Face Detection Analysis: Done!'));
    console.timeEnd('Pre-Analysis Job');

    return new Promise((resolve, reject) => {
      if(detailedFaces.length > 0) {
        db.updateVideoAnaStatus(videoKey, 1);
        resolve(detailedFaces);
      }
      else {
        db.updateVideoAnaStatus(videoKey, -1);
        reject(`Error when pre-analyzing the video, ${videoKey}`);
      }
    });

  } catch(error) {  
    db.updateVideoAnaStatus(videoKey, -1);
    Chalk(ERROR(`Job Face Detection: Failed to get face details video ${videoKey},`, error.stack));
  }
    
}
/**
 * Entry/Start function used to do a single video analysis by aws rekognition
 * 
 * @param {String} videoKey: video filename without path 
 */
async function startVideoRekognition (videoKey) {

  console.time(`Video Analysis time consumed for ${videoKey}`);
  Chalk(INFO(`Video Analysis for ${videoKey} Started at:`, (new Date()).toLocaleString()));

  Chalk(HINT(`Initilization ... `));
  await deleteSQSHisMessages(APP_REK_SQS_NAME);

  // This task takes too much time, let's start it at first
  startTrackingAnalysis(videoKey);

  // Step 1: Pre-Analyze the video(video/images process, file uploading, face detection) 
  // Traget: To get all faces with details in the video (cannot tell who they are here)
  let detailedFaces = await startVideoPreAnalysis(videoKey);

  // Step 2: Search faces in temporary collection to obtain uniq face for each person
  // Target: Get the demographic attributes for individuals in the video
  getPersonDetailsFromVideo(videoKey, APP_REK_TEMP_COLLECTION_ID, detailedFaces);

  // Step 3: Search faces again in the db-collection to identify recuring people
  getPersonRecuringAmongVideos(videoKey, APP_REK_DB_COLLECTION_ID);
 
};


module.exports = { startVideoRekognition };