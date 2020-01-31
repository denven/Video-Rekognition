const helper = require('../helpers/helpers');
const ffmpeg = require('fluent-ffmpeg');
// const getDimensions = require('get-video-dimensions');

const sharp = require('sharp');
const path = require('path');
const shell = require('shelljs');

const s3Client = require('./s3bucket');

const { APP_FACES_BUCKET_NAME, BACK_END_FILES_PATH } = require('../rekognition/aws-servies');
const __demoRootDir = path.join(require('os').homedir(), BACK_END_FILES_PATH);

// Create folders used for processing different type of files 
const prepareDataDirectories = (videoFileName) => {

  shell.mkdir('-p', path.join(__demoRootDir, 'Videos'));
  shell.mkdir('-p', path.join(__demoRootDir, 'Frames'));
  shell.mkdir('-p', path.join(__demoRootDir, 'Faces'));

}

// Get Video Dimension
async function getVideoDimension (videoFileName) {

  const videoFullName = path.join(__demoRootDir, 'Videos', videoFileName);
  // let dimension = await getDimensions(videoFullName);
  const dimension = {};
  ffmpeg.ffprobe(videoFullName, (err, metadata) => {
    if(!err) {
      dimension.width = metadata.streams[0].width;
      dimension.height= metadata.streams[0].height;
      dimension.duration = metadata.streams[0].duration;
      dimension.rotate = metadata.streams[0].tags.rotate;
      if(metadata.streams[0].tags.rotate) {
        dimension.width = metadata.streams[0].height;
        dimension.height= metadata.streams[0].width;
      }
    }
  });

  // can not make ffprobe become a promise, so we use setTimeout
  return new Promise ( (resolve, reject) => {
    setTimeout(() => {
      if(dimension) resolve(dimension);
      else reject(`Failed to get video dimension`)
    }, 1000);
  });

}

// Take screentshots for all the frames which is detected with faces
// and Save the frame images into a folder named by filename in 'Frames' folder
const takeScreenshots = (frames, videoFileName, vidDimension) => {

  let oldTimestamp = -1;
  let framesPromises = [];

  const frameImgPath = path.join(__demoRootDir, 'Frames', videoFileName);
  const videoFullName = path.join(__demoRootDir, 'Videos', videoFileName);
  shell.mkdir('-p', frameImgPath);

  const vidNameOnly = videoFileName.split('.').slice(0, -1).join('.'); // trim file extension
  const sizeByDimension = `${vidDimension.width}x${vidDimension.height}`;
  for(const frame of frames) {

    let newTimestamp = helper.msTohhmmssmmm(frame.Timestamp); 
    if (oldTimestamp !== newTimestamp) {  // take screenshot for different frames
      oldTimestamp = newTimestamp; 
      let promise = new Promise((resolve, reject) => {
        ffmpeg(videoFullName)
          .on('error', (err) => reject(err))
          .on('end', (data) => resolve(data))
          .screenshots({
              timestamps: [newTimestamp],
              filename: `${vidNameOnly}-${newTimestamp}.png`,
              folder: frameImgPath,
              size: sizeByDimension
          });
      });  // return promise
      framesPromises.push(promise);
    }

  }; //for

  return framesPromises;
}

// Crop all the faces from different frames
// and save the images into a folder named by video filename in 'Faces' folder
const cropFacesFromScreenshots = (faces, videoFileName, vidDimension) => {

    let oldTimestamp = -1;
    let sequence = 0;   // No. of face detected in the frame starts from 1
    console.log(`how many faces will be cropped: ${faces.length}`);

    const faceImgPath = path.join(__demoRootDir, 'Faces', videoFileName);
    const frameImgPath = path.join(__demoRootDir, 'Frames', videoFileName);
    shell.mkdir('-p', faceImgPath);

    const vidNameOnly = videoFileName.split('.').slice(0, -1).join('.'); // trim file extension

    console.log(`Cropping:`, videoFileName, vidDimension);
    return faces.map((frame) => {

      let size = helper.getFaceBoundary(frame.Face.BoundingBox, vidDimension);
      frame.Timestamp = helper.msTohhmmssmmm(frame.Timestamp); 

      let newTimestamp = frame.Timestamp;
      if (oldTimestamp !== newTimestamp) {  // same frame
        oldTimestamp = newTimestamp; 
        sequence = 0;  // reset
      }

      sequence++;  // count of faces in one frame
      return new Promise((resolve, reject) => {
        sharp(`${frameImgPath}/${vidNameOnly}-${newTimestamp}.png`)
          .extract({ width: size.Width, height: size.Height, left: size.Left, top: size.Top})
          .toFile(`${faceImgPath}/${vidNameOnly}-${frame.Timestamp}-${sequence}.png`)
          .then(file => resolve(file))
          .catch(err => reject(err));
      })
    });
}

// As there are many async operations, we make this function to make it more synchronously!
// upload all the faces images into s3 buckets after the croping job is done 
// There are 3 frames per second on average from the test video, the number depends on movements in vides
async function cropFacesFromLocalVideo (allFrames, videoFileName) {

  prepareDataDirectories();

  try {
    dimension = await getVideoDimension(videoFileName);
    let frames = await Promise.all(takeScreenshots(allFrames, videoFileName, dimension));
    console.log(`Extracted ${frames.length} frames from video ${videoFileName}`);
  } catch (error) {
    console.log(`Exception when taking video screenshots, ${error}`);
  }

  try {
    let faces = await Promise.all(cropFacesFromScreenshots(allFrames, videoFileName, dimension));  
    console.log(`Cropped ${faces.length} faces from video ${videoFileName}, Done!`);
  } catch (error) {
    console.log(`Exception when cropping faces from video, ${error}`);
  }

  const faceImgPath = path.join(__demoRootDir, 'Faces', videoFileName);
  let faces_bucket = await s3Client.createFolderInBucket(videoFileName, APP_FACES_BUCKET_NAME);
  
  let data = await s3Client.uploadMultiFiles(faceImgPath, APP_FACES_BUCKET_NAME, videoFileName);
  console.log(`Uploaded ${data.length} face images to s3 successfully`);       
 
}

module.exports = { getVideoDimension, cropFacesFromLocalVideo };