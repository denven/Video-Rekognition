/*
 * This module prepare proper data format for recognition data before writing them to database.
 **/
const _ = require('lodash')
const moment = require('moment');

const { getVideoDimension } = require('../filemanager/videos');
const { AWS_DEFAULT_REGION, APP_VIDEO_BUCKET_NAME } = require('./aws-servies');

/**
 * @param {Array} Emotions: Array of 8 types and values of emotions 
 * '[ {"Type":"CALM","Confidence":1.825882077217102}, ...]'
 * Emotions Value: has 8 types (except "Unknown")
 * HAPPY | SAD | ANGRY | CONFUSED | DISGUSTED | SURPRISED | CALM | UNKNOWN | FEAR
 */
const getMostConfidentEmotion = (Emotions) => {

  let emotions = _.orderBy(Emotions, Number, ['Confidence', 'desc']);
  return emotions[0].Type;

}


const getAgeRangeCategory = (AgeRange) => {

  let medianAge = Math.ceil((AgeRange.Low + AgeRange.High) / 2);

  if (medianAge < 12) return 0; // Pre-Teen

  if (medianAge >= 13 && medianAge < 19) return 1; // Teen

  if (medianAge >= 19 && medianAge < 35) return 2; // Young Adult
  
  if (medianAge >= 35 && medianAge < 55) return 3; // Middle Aged

  if (medianAge >= 55) return 4; // Seniors

}

async function getVideoDuration (videoName) {
  const dimension = await getVideoDimension(videoName);
  return Math.ceil(dimension.duration);
}

const getVideoS3URL = (videoName) => {
  const s3_url = `https://` + APP_VIDEO_BUCKET_NAME + `.s3-` + AWS_DEFAULT_REGION + `.amazonaws.com/` + videoName;
  console.log(s3_url);
  return s3_url;
}

const getVideoFilmedDate = (videoName) => {

    let dateTime = videoName.slice(0, -3).replace(/[^0-9]/ig,"").slice(0,14);
    dateTime = moment( dateTime, 'YYYYMMDDHHmmss', true).format("YYYY-MM-DD[T]HH:mm:ss");
    return (moment(dateTime).utc().format());
}

// helper for calculating the traffic by time
const isPersonStillStaying = (timestamp, visit) => {
  if(timestamp >= visit.show_timestamp && timestamp <= visit.leave_timestamp) {
    return true;
  } else {
    return false;
  }
}

/**
 * Return an array of objects which have the count of traffic by timestamp
 * @param {Array} TrackedPersons returned by startPersonTracking() in rek-traffic
 * @param {String} videoKey
 */
async function getTrackedTraffic (TrackedPersons, videoKey) {

  let traffic = [];

  // let filmed_at = await getVideoFilmedDate(videoKey);
  let dimension = await getVideoDimension(videoKey);

  console.log('durationduration', dimension.duration);

  let allTimestamps = [];

  for(const visit of TrackedPersons) {
    allTimestamps.push({ts: visit.show_timestamp, flag: 'SHOW'}),
    allTimestamps.push({ts: visit.leave_timestamp, flag: 'LEAVE'})
  }

  let count = 0;
  let allVisits = _(allTimestamps).orderBy(['ts', 'asc']);
  
  for(const visit of allVisits) {
    if(Math.abs(dimension.duration * 1000 - visit.ts) > 500) {
      count += ((visit.flag === 'SHOW') ? 1 : -1);
    }    

    let repeatedIndex = _.findIndex(traffic, item => {    
      return (item.timestamp === visit.ts);
    });

    if(repeatedIndex >= 0) {
      traffic[repeatedIndex].count = count;  //update
    }else{
      traffic.push({timestamp: visit.ts, count: count });
    }
  }

  let data = _(traffic).orderBy(['timestamp', 'asc']).value();
  return data;
}


const getAvgRecuringDate = (recurs, videoKey) => {

  let videoVisits = recurs.map(person => {
    if(person.HisVisits.length === 0) {
      return {is_recuring: false, visit_date: 0}
    } else {
        let curVisitDate = moment(videoKey.slice(4, 12));
        let firstHisVisitDate = moment(person.HisVisits[0].Vid.slice(4, 12));      
        let avgDaysPerVisit = curVisitDate.diff(firstHisVisitDate, 'days') / person.HisVisits.length;
        return { is_recuring: true, visit_date: avgDaysPerVisit };
    }
  });

  return videoVisits;
}


module.exports = { 
   getMostConfidentEmotion, 
   getAgeRangeCategory,
   getTrackedTraffic,
   getVideoDuration,
   getVideoFilmedDate,
   getVideoS3URL,
   getAvgRecuringDate
}