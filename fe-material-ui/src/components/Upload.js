import 'react-dropzone-uploader/dist/styles.css'
import Dropzone from 'react-dropzone-uploader'

import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

import moment from 'moment';

export default function MyUploader () {

  // specify upload params and url for your files
  const getUploadParams = ({ file, meta }) => { 
    const body = new FormData();
    console.log(`This is file and meta from getUPloadParams`, file, meta);
    body.append('VID', file);  //this is one validation
    return { url: '/upload', body };
  }
  
  // called every time a file's `status` changes
  const handleChangeStatus = ({ meta, file }, status) => { 
    // console.log(`status mema file`, status, meta, file) 
    // if (status === 'headers_received') {
    //   toast.info(`${meta.name} uploaded!`, { position: toast.POSITION.BOTTOM_RIGHT });
    // } else if (status === 'aborted') {
    //   toast.warn(`${meta.name}, upload failed...`);
    // }  
    if(status === 'error_validation') {
      // toast.error(xxxx, { position: toast.POSITION.BOTTOM_RIGHT });
    }
  }
  
  const delay = (s) => {

  return new Promise(resolve => {
     setTimeout(() => resolve(1), s * 1000);
  })

}

  // receives array of files that are done uploading when submit button is clicked
  async function handleSubmit (files) { 

    for( const file of files) {
      if (file.meta.status === 'done') { 
        await delay(Math.ceil(file.meta.size/(20*1024*1024)));
        toast.info(`${file.meta.name} uploaded!`, { position: toast.POSITION.BOTTOM_RIGHT });
        await delay(2);
        file.remove();  
      } else if (file.status === 'aborted') {
        toast.warn(`${file.meta.name}, upload failed...`);
      }  
    };

  }

  const Preview = ({ meta }) => {
    const { name, videoHeight, videoWidth, duration } = meta;
    return (
      <span style={{ alignSelf: 'flex-start'}}>
        {name}, Dimension: {videoHeight}x{videoWidth}, Duration:{duration}
      </span>
    )
  }

  //validation for filenames
  const IsInvalidFile = ({ meta }) => {

    let dateTime = meta.name.slice(0, -3).replace(/[^0-9]/ig,"").slice(0,14);
    if(moment(dateTime).isValid()) {
      return false;
    } else {
      return `Invalid filename format, suggested filename example: VID_20200120_123548.mp4`;
    }
  }
 
  return (   
    <div>
      <Dropzone
        getUploadParams={getUploadParams}
        onChangeStatus={handleChangeStatus}
        onSubmit={handleSubmit}
        accept="video/mp4"
        inputContent="Drop Video(mp4) Files to upload!"
        maxSizeBytes={1024*1024*1024}  //1GB
        validate={IsInvalidFile}
        autoUpload={true}
        maxFiles={3}
        submitButtonContent={'Upload files for analysis'}
        inputWithFilesContent={'Add Video Files ...'}
        styles={{
          dropzone: { height: "92vh", border: 'none' },
          dropzoneActive: { borderColor: 'green' },
        }}
      />  
      <ToastContainer autoClose={2000} />
    </div>        
  )
}