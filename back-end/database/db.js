const config = require('./knexfile');
const env = process.env.NODE_ENV || 'development';
const knex = require('knex')(config[env]);
const _ = require('lodash');

const { getVideoDuration, getVideoFilmedDate, getVideoS3URL } = require('../rekognition/db-data');

const testDBConnection = () => {
  
  knex.raw("SELECT current_database()")
  .then( (data) => {
    let dbName = data.rows ?  data.rows[0].current_database : `Not Connected`;    
    console.log(`Current Database: ${dbName}`)
  }).then()
  .catch((err) => { console.log(err); throw err });

  knex.raw("SELECT tablename FROM pg_tables WHERE schemaname='public'")
  .then( (data) => {
    console.log('Tables Found in database:', data.rows.map(t => t.tablename).join(', '));
  }).then()
  .catch((err) => { console.log(err); throw err }); 
}

async function addOneVideoFile (videoName)  {
  const duration = await getVideoDuration(videoName);
  const filmedTime = getVideoFilmedDate(videoName); 
  const videoS3Url = getVideoS3URL(videoName);

  const videoRcord = {
    name: videoName, 
    duration: duration, 
    filmed_at: filmedTime,
    s3_url: videoS3Url,
    ana_status: 0  //0: not analyzed; 1-2-3: in-process; 4: done, -1: failed
  };
  
  console.log('File Received, Write a record to videos table')
  knex('videos').insert(videoRcord, ['id']).catch(err => console.log(err));
}

/**
 * If a task(having 4 jobs) has failed due to some job(s), it won't be updated even
 * other jobs succeded.
 * 
 * @param {String} videoName 
 * @param {Integer} status: 1: a job succeded, -1: a job failed
 */
const updateVideoAnaStatus = (videoName, status) => {

  console.log(`update videos table, ${videoName}, ${status}`);

  if(status === 1) {
    knex('videos').select('ana_status').where('name', videoName)
    .then( s => {
      if(s !== -1) {
        knex('videos').where('name', videoName).increment('ana_status', 1)
        .then(s => console.log(`Update Analysis Process: ${s}`))
        .catch(err => console.log(err));
      }
    });
  } else {
    knex('videos').where('name', videoName).update('ana_status', status);
  }

}

/**
 * Insert data analyzed from one video
 * 
 * @param {String} videoName 
 * @param {Array} contentsAnalyzed (could be: faces/recurs/persons/traffic)
 * @param {String} tableName (in database)
 */
const addVideoAnaDataToTable = (videoName, contentsAnalyzed, tableName) => {

  console.log(`update table, ${videoName}, ${contentsAnalyzed.length}, ${tableName}`);

  knex('videos').select('id').where('name', videoName)
    .then( rows => {
      contentsAnalyzed.forEach(content => {
        const row = {...content, video_id: rows[0].id};
        knex(tableName)
          .insert(row, ['id'])
          // .then(data => console.log(data))
          .catch(err => console.log(err));
      });
    });
}




module.exports = { knex, testDBConnection, addOneVideoFile, updateVideoAnaStatus, addVideoAnaDataToTable };