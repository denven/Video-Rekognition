/**
 * express routes for intercation with react front end
 */
"use strict";
const _ = require('lodash')
const path = require('path');
const express = require('express');
const router  = express.Router();

const db = require('../database/db');
const knex = db.knex;

const s3Client = require('../filemanager/s3bucket');
const { APP_VIDEO_BUCKET_NAME, BACK_END_FILES_PATH } = require('../rekognition/aws-servies');
const __dirhome = require('os').homedir();
const __dirupload = path.join(__dirhome, BACK_END_FILES_PATH, 'Videos');

// multer configurations
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirupload);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);  // do not change name
  }
})

const options = {
  storage: storage,
  limits: {
    files: 3, // allow up to 3 files per request,
    fieldSize: 1024 * 1024 * 1024 // 1GB (max file size)
  },

  //up load validations 
  fileFilter: async (req, file, cb) => {
    if (file.mimetype !== 'video/mp4') {
      return cb(null, false);
    }    

    let videoFiles = await knex('videos').select('name').where('name', file.originalname);
    if(videoFiles.some( video => video.name === file.originalname)) {
      console.log('DO NOT up load the same file again:', file.originalname);
      return cb(null, false);   // file with the same name are not allowed
    }

    cb(null, true);
  }
}

const upload = multer(options);


// ENDPOINTS DEFINITNIONS
module.exports = function() {

  // server EventSource endpoint
  router.get('/events', async (req, res) => {

    // setup headers for the response in order to get the persistent HTTP connection
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
    });
     
    // compose the message
    let anaStatus = [];
    const interval = setInterval(() => {
      //check pended or in-process videos
      knex('videos').select('name').whereIn('ana_status', [0,1,2,3]).then( videos => {   
        let curAnaStatus = [];     
        videos.forEach(video => curAnaStatus.push(video.ana_status));
        res.write(`data: ${!(_.isEqual(anaStatus, curAnaStatus))}\n\n`);  
        anaStatus = _.cloneDeep(curAnaStatus);
      })
    }, 3000);

    req.connection.addListener("close", () => {
        clearInterval(interval);
    }, false);

  });
 

  // get days having videos (filmed) uploaded, query videos table and get all the video_ids
  router.get('/videos', (req, res) => {
    console.log(`videos get`);
    knex('videos')
        .select('*')
        .orderBy('id', 'desc')
        .then( videos => {
          res.json(videos);
        })
        .catch(err => {
          console.log(err);
        });
  });

  // route for get all data from db
  router.get('/all', (req, res) => {
 
    try{
      let pVideos = knex('videos').select('*').orderBy('id', 'desc');
      let pFaces = knex('faces').select('*').orderBy('video_id', 'asc');
      let pRecurs = knex('recurs').select('*').orderBy('video_id', 'asc');
      let pPersons = knex('persons').select('*').orderBy('video_id', 'asc');
      let pTraffic = knex('traffic').select('*').join('videos', 'traffic.video_id', 'videos.id').orderBy('video_id', 'asc');

      Promise.all([pVideos, pFaces, pRecurs, pPersons, pTraffic])
      .then(data => res.json({videos: data[0], faces: data[1], recurs: data[2], persons: data[3], traffic: data[4]}))
      .catch(err => console.log(err));
    } catch(error) {console.log(error)};

  });


  // query recurs table with video_id
  router.get('/recurs/:vid', (req, res) => {
    knex('recurs')
        .select('*')
        .where('video_id', req.params.vid)
        .then(result => {
          res.json(result);
        })
        .catch(err => {
          console.log(err);
        });
  });

 
  // query traffic and persons table with video_id
  router.get('/track/:vid', (req, res) => {

    let track = {};
    knex('persons').select('*').where('video_id', req.params.vid)
      .then( persons => {
        track.persons = persons;
        return knex('traffic').select('*').where('video_id', req.params.vid);
      })
      .then( traffic => { 
        track.traffic = _(traffic).orderBy('timestamp', 'asc');
        res.json(track); 
      })
      .catch(err => {
        console.log(err);
      });

  });   
  
  // query faces table with video_id
  router.get('/faces/:vid', (req, res) => {
    
    let vid = parseInt(req.params.vid);
    if(vid > 0) {
      knex('faces').select('*').where('video_id', vid)
        .then( faces => { res.json(faces); })
        .catch(err => { console.log(err); });
    } else {
      // console.log('NOT VALID request',typeof(req.params.vid));
      res.json([]);
    }

  });  


  // db reset endpoints
  router.get('/reset/:type', (req, res) => {

    if (req.params.type === 'all') {
      knex('videos').select('id').orderBy('id', 'desc').then( ids => {
        console.log(ids);
        let deletes = ids.map(id => {
          return knex('videos').where('id', id.id).del();
        });
        Promise.all(deletes).then(data => {
          res.end('All videos analysis records are removed:', data);
        })
        .catch(err => {
          console.log(err);
        });
      });

    } else {

      knex('videos').select('*').orderBy('id', 'desc').then( ids => {
        if(ids.length > 0) {
          knex('videos').where('id', ids[0].id).del()
          .then( data => res.end('The last video analysis records is removed:', data));
        }          
      })
      .catch(err => {
        console.log(err);
      }); 

    }

  });


  // for upload a single video file
  router.post('/upload', upload.single('VID'), async (req, res, next) => {

    const file = req.file;

    if (!file) {
      return res.json({ Error: "File is not accepted!" });
    } else {
      console.log(`Received a video file: ${file.originalname}`);
      const fullpathname = path.join(__dirupload, file.originalname);
      res.json('File Received!');

      let data = await s3Client.uploadOneFile(fullpathname, APP_VIDEO_BUCKET_NAME);
      console.log(`Uploaded video file ${file.originalname} to s3 successfully`);  
      db.addOneVideoFile(file.originalname);

      // startVideoRekognition(file.originalname);      // moved to task manager
    }

  })

  router.post('/uploads', upload.array('VID', 3), (req, res, next) => {
    const files = req.files
    if (!files) {
      const error = new Error('Please choose files')
      error.httpStatusCode = 400
      return next(error)
    }
    res.send(files)
  
  })
  
  return router;   // this router must be returned when used as a router division

};