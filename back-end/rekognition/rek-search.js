/*
 * By searching faces in collection(We need 2 collections)
 * 1. by comparing selve's faces collection to get uniq faces detail data
 *    delete/empty the indexes in collection before analyzing new video/after one video is analyzed
 * 2. by comparing existed faces collection to get recurred faces for new video 
 * adding new faces into existed collection for future recuring analysis
 **/

const _ = require('lodash');
const inspect = require('util').inspect;

const chalk = require('chalk');
const INFO = chalk.bold.green;
const ERROR = chalk.bold.red;
const HINT = chalk.keyword('orange');
const Chalk = console.log;

const { rekognition, APP_VIDEO_BUCKET_NAME, APP_REK_SQS_NAME, APP_ROLE_ARN, APP_SNS_TOPIC_ARN,
        APP_FACES_BUCKET_NAME, APP_REK_DB_COLLECTION_ID, queryJobStatusFromSQS, addFacesIntoCollection 
      } = require('./aws-servies');
const { getAgeRangeCategory, getMostConfidentEmotion, getAvgRecuringDate } = require('./db-data');
const db = require('../database/db');

/**
 * Return true when collection is empty
 * @param {String} collectionId 
 */
async function isCollectionEmpty (collectionId) {

  rekognition.describeCollection({ CollectionId: collectionId }).promise()
  .then(data => {
    return (data.FaceCount > 0 ? false : true);
  }).catch(err => console.log(err, err.stack));

}

const startFaceSearch = (videoKey, collectionId) => {
  
  return new Promise((resolve, reject) => {

    const params = {
      Video: { /* required */
        S3Object: { Bucket: APP_VIDEO_BUCKET_NAME, Name: videoKey }
      },
      // ClientRequestToken: "startFaceDetectionToken",
      // FaceAttributes: "ALL",  // not supported for this API
      CollectionId: collectionId,
      FaceMatchThreshold: 98,
      JobTag: "startFaceSearch",
      NotificationChannel: {
        RoleArn: APP_ROLE_ARN, 
        SNSTopicArn: APP_SNS_TOPIC_ARN
      }
    }

    rekognition.startFaceSearch(params, (err, task) => {
      if (err) reject(err, err.stack); // an error occurred
      else     resolve(task);           // successful response
    });
  });

};

// Pick 1 face data for each person, no dulplicate faces
const getDistinctPersonsInVideo = (data) => {
  
  let oldIndex = -1;
  let person = {};
  let allPersons = []; 

  console.log(`Get ${data.Persons.length} faces data by searchFaces in collection`)
  for (const item of data.Persons) {   
    
    if(item.Person.Index !== oldIndex) { 
      if(oldIndex >= 0) {
        let newObj = JSON.parse(JSON.stringify(person)); //deep copy
        allPersons.push(newObj);  //record a person
      }
      oldIndex = item.Person.Index;
      person = {
        "Timestamp": item.Timestamp,
        "Index": item.Person.Index,
        "BoundingBox": item.Person.Face.BoundingBox,
        "Confidence": item.Person.Face.Confidence,
        "ExternalImageId": item.FaceMatches.length > 0 ? item.FaceMatches[0].Face.ExternalImageId : '',
        "FaceId": item.FaceMatches.length > 0 ? item.FaceMatches[0].Face.FaceId : '',
        "ImageId": item.FaceMatches.length > 0 ? item.FaceMatches[0].Face.ImageId : ''
      };
    }
  }

  allPersons.push(person); //last person
  return allPersons;

};

// Get persons from multiple videos as recurred customers
// Identify recurring people by finding externalImageIds which contains different video info
// Return the video-frame-time of the former visits
const getDistinctPersonsVisitsData = (personsFaces, curVidName) => {

  let oldIndex = -1;
  let allPersons = [];  
  let person = {Index: '', Timestamp: '', HisVisits: []};

  console.log(`Searching for recuring people from other videos...`)
  for (const item of personsFaces.Persons) {   
    
    if(item.Person.Index !== oldIndex) { 

      if(oldIndex >= 0) {
        let newObj = JSON.parse(JSON.stringify(person));
        allPersons.push(newObj);  //record a person
        person = {};
      }
      oldIndex = item.Person.Index;
      person.Index = item.Person.Index;
      person.Timestamp = item.Timestamp;
      person.HisVisits = [];
    }

    // search for face's externalImageId containing info from other video
    // eg: VID_20200106_191924-00:00:03.469-1.png => VID_20200106_191924      
    for(const face of item.FaceMatches) {
      let faceSrcVideo = face.Face.ExternalImageId.slice(0, -19);
      let faceTimestamp = face.Face.ExternalImageId.slice(-18, -4);
      if ( faceSrcVideo !== curVidName ) {
        let visits = person.HisVisits.filter(item => { return (item.Vid === faceSrcVideo) });
        if (visits.length === 0) {
          person.HisVisits.push({ Vid: faceSrcVideo, Timestamp: faceTimestamp });
        }
      }
    }
  }

  allPersons.push(person); //last person
  return allPersons;
}


// when job succeeded in sqs, call this function
async function getFaceSearch (jobId, videoKey, type) {
    
  let nextToken = '';
  let allPersons = [];

  do { 
    const params = { JobId: jobId, MaxResults: 1000, NextToken: nextToken, SortBy: "INDEX" }; 
    let data = await rekognition.getFaceSearch(params).promise();

    if (type === 'NEW_SEARCH') {
      let pagePersons = getDistinctPersonsInVideo(data);  
      allPersons.push.apply(allPersons, pagePersons);
    }

    if (type === 'RECUR_SEARCH') {
      const vidNameOnly = videoKey.slice(0, -4);  //remove extension of filename
      let pagePersons = getDistinctPersonsVisitsData(data, vidNameOnly);
      allPersons.push.apply(allPersons, pagePersons);
    }
  
    nextToken = data.NextToken || '';

  } while (nextToken);

  if(type === 'NEW_SEARCH') { 

    Chalk(INFO(`Recognized ${allPersons.length} persons in video ${videoKey}`));

  } else {

    let personVisits = _.filter(allPersons, (person) => {return person.HisVisits.length > 0} );
    console.log(`Recuring Seraching results:`, inspect(personVisits, false, null, true));
    Chalk(INFO(`Recognized ${personVisits.length} recurring from ${allPersons.length} persons in video ${videoKey}`));
   
  }

  return allPersons;
}


/**
 * Get demographic data per person
 * 
 * @param {Array} persons returned by getFaceSearch()
 * @param {Array} faceDetails returned by getFaceDetection()
 */
const getPersonsWithDetails = (persons, faceDetails) => {

  let detailedPersons = [];
  console.log('Target faces for comparision in collection pool:', faceDetails.length);
  faceDetails.forEach((face) => {

    for(const person of persons) {
      if (_.isEqual(face.Face.BoundingBox, person.BoundingBox)) {

        // change the keys string according to db table keys name convention
        detailedPersons.push( {
          // the person.attributes below come from searchFaces in collection
          // index: person.Index,
          // timestamp: person.Timestamp,
          // face_id: person.FaceId,
          // image_id: person.ImageId,
          // confidence: person.Confidence,
          external_id: person.ExternalImageId,

          // the face.attributes below come from faceDetection(no collection compared)
          sex: face.Face.Gender.Value,
          age: getAgeRangeCategory(face.Face.AgeRange),
          smile: face.Face.Smile.Value,
          emotion: getMostConfidentEmotion(face.Face.Emotions)
        });
      }
    } // for

  });

  console.log(`Unique Persons With Detailed Face Data:`, inspect(detailedPersons, false, null, true));
  return detailedPersons;
}

// entry function for call api startFaceSearch
async function getPersonDetailsFromVideo (videoKey, collectionId, detailedFaces) {

  console.time('Job Person Details Analysis');

  try {
    let job = await startFaceSearch(videoKey, collectionId);
    let task = { JobName: 'PersonSearch', JobId: job.JobId };  
    Chalk(HINT(`Starts Job: Person Search, JobId: ${task.JobId}`));   

    let status = await queryJobStatusFromSQS(APP_REK_SQS_NAME, task);
    console.log(`Job ${status ? 'SUCCEEDED' : 'NOT_DONE'} from SQS query: ${status}`);
    
    let persons = await getFaceSearch(task.JobId, videoKey, 'NEW_SEARCH'); // this is async 
    let personsWithDetails = getPersonsWithDetails(persons, detailedFaces);    
    // //TODO: Write into database (faces, visits, video-faces tables)

    Chalk(INFO('Job Person Search Analysis: Done!'));
    console.timeEnd('Job Person Details Analysis');
    db.updateVideoAnaStatus(videoKey, 1);
    db.addVideoAnaDataToTable(videoKey, personsWithDetails, 'faces');
    // return persons; 

  } catch (error) {
    Chalk(ERROR(`Job Person Search: Failed to search persons in video ${videoKey},`, error.stack));
    db.updateVideoAnaStatus(videoKey, -1);
  }
   
};

// entry function for call api startFaceSearch
async function getPersonRecuringAmongVideos (videoKey, collectionId) {

  if(await isCollectionEmpty(collectionId)) {
    Chalk(HINT(`Recuring analysis is not needed as ${videoKey} is the first video`));   
    db.updateVideoAnaStatus(videoKey, 1);
    return;
  }

  console.time('Job Person Recuring Analysis');
  try {

    let job = await startFaceSearch(videoKey, collectionId);
    let task = { JobName: 'RecuringSearch', JobId: job.JobId }; 
    Chalk(HINT(`Starts Job: Person Recuring Search, JobId: ${task.JobId}`));   

    let status = await queryJobStatusFromSQS(APP_REK_SQS_NAME, task);
    console.log(`Job ${status ? 'SUCCEEDED' : 'NOT_DONE'} from SQS query: ${status}`);
    
    let visits = await getFaceSearch(task.JobId, videoKey, 'RECUR_SEARCH'); // this is async 
    let visitDates = getAvgRecuringDate(visits, videoKey);
    db.updateVideoAnaStatus(videoKey, 1);
    db.addVideoAnaDataToTable(videoKey, visitDates, 'recurs');
   
    addFacesIntoCollection(APP_FACES_BUCKET_NAME, videoKey, APP_REK_DB_COLLECTION_ID);

    Chalk(INFO('Job Person Recuring Search: Done!'));
    console.timeEnd('Job Person Recuring Analysis');
    // return persons; 

  } catch (error) {
    Chalk(ERROR(`Job Person Recuring Search: Failed to search persons in video ${videoKey},`, error.stack));
    db.updateVideoAnaStatus(videoKey, -1);
  }

};

module.exports = { getPersonDetailsFromVideo, getPersonRecuringAmongVideos };