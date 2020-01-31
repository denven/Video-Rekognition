const fs = require('fs');

// pad a number from begining with 0 to a a fixed length of string 
const padNumber = (num, size) => {
  let s = num + "";
  while (s.length < size) {
    s = "0" + s;
  }
  return s;
};

// format a millisecond timestamp to hh:mm:ss.xxx
const msTohhmmssmmm = ( msTimestamp ) => {

    let seconds = msTimestamp / 1000;
    let hours = parseInt( seconds / 3600 );           // 3,600 seconds is 1 hour
    let minutes = parseInt( (seconds % 3600) / 60 );  // 60 seconds is 1 minute

    seconds = parseInt(seconds % 60);         // seconds remaining less than 60 (1 minute)
    let  millisec = msTimestamp % 1000;

    hours = padNumber(hours, 2);
    minutes = padNumber(minutes, 2);
    seconds = padNumber(seconds, 2);
    millisec = padNumber(millisec, 3);

    return( hours + ":" + minutes + ":" + seconds + "." + millisec );
}

// get face position in frame picture
const getFaceBoundary = (boundingBox, vidDimension) => {

  let videoWidth = vidDimension.width;
  let videoHeight = vidDimension.height;

  let size = boundingBox;
  size.Left = parseInt(size.Left * videoWidth);
  size.Top = parseInt(size.Top * videoHeight);

  size.Width = parseInt(size.Width * videoWidth);
  size.Height = parseInt(size.Height * videoHeight);

  let enlargeRatio = 0.2;
  // a second process for enlarging crop box area
  let incWidth = parseInt(size.Width * enlargeRatio / 2);
  let incHeight = parseInt(size.Height * enlargeRatio / 2);

  if(size.Left - incWidth > 0) {
    size.Left -= incWidth;
    size.Width += 2 * incWidth;
  } else {
    size.Left = 0;
    size.Width = size.Width + 2 * size.Left;
  }

  if(size.Top - incHeight > 0) {
    size.Top -= incHeight;
    size.Height += 2 * incHeight;
  } else {
    size.Top = 0;
    size.Height = size.Height + 2 * size.Top;
  }

  return size;
}

module.exports = {
  padNumber,
  msTohhmmssmmm,
  getFaceBoundary
}