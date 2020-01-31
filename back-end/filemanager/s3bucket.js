// functions to process files in s3 buckets
const fs = require('fs');
const path = require('path');

const AWS = require('aws-sdk');
const s3Client = new AWS.S3();

const listFilesInFolder = (bucketName, folder) => {

  var params = {
    Bucket: bucketName, /* required */
    Delimiter: '/',
    Prefix: folder + '/'  //your folder name
  };
  s3Client.listObjectsV2(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}

// upload a file to s3
const uploadOneFile = (fileName, bucketName) => {

    // Read content from the file
    // const fileData = fs.readFileSync(fileName);
    const stream = fs.createReadStream(fileName);

    // Setting up upload parameters
    const params = {
        Bucket: bucketName,
        Key: fileName.split('/').pop(),  // key filename only by removing path
        Body: stream,
        ACL:'public-read' //grant video access permision
    };

    // Uploading files to the bucket
    const s3UploadPromise = s3Client.upload(params).promise();    
    s3UploadPromise
    .then((data) => console.log(`File uploaded successfully: ${data.Location}`))
    .catch((err) => console.log(`Failed to Upload file to s3: `, err.name));

    return s3UploadPromise;
};

// upload multiple files to s3
// this function is used to upload multiple cropped face images to s3
const uploadMultiFiles = (imagesPath, targetBucket, bucketFolder) => {

  const fileNames = fs.readdirSync(imagesPath);
  // console.log(fileNames);
  const files = fileNames.map((fileName) => {    
    return {
      key: `${bucketFolder}/${fileName}`,
      stream: fs.createReadStream(path.join(imagesPath, fileName))
    };
  });
  
  return Promise.all( files.map((file) => {
    const params = {
      Bucket: targetBucket,
      Key: file.key,
      Body: file.stream
    };
    return s3Client.upload(params).promise();
  }));
}

// create one folder for each video file in the faces root bucket
async function createFolderInBucket(videoName, targetBucket) {

  const bucketFolder = targetBucket + '/' + videoName;
  const params = {Bucket: targetBucket, Key: videoName + '/', ACL: 'public-read', Body: videoName};

  try{
    let data = await s3Client.upload(params).promise(); 
    if(data) console.log(`Folder for storing face images Created Successfully on S3: ${data.Location}`);
  }catch(error){
    console.log(`Error creating the folder: ${error}`);
  }

  return bucketFolder;
}

module.exports = {
  uploadOneFile,
  uploadMultiFiles,
  createFolderInBucket
}