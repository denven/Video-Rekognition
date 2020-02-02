import React, { useState, useEffect } from "react";
import MaterialTable from "material-table";
import Pageview from '@material-ui/icons/Pageview';
import Analysis from './Analysis';
import axios from 'axios';
 
export default function Videos (props) {

  const [view, setView] = useState('TABLE');  
  const [videos, setVideos] = useState([]);
  const [selVideo, setVideo] = useState({});

  const [listening, setListening ] = useState(false);

<<<<<<< HEAD
  useEffect( () => {
    axios.get(`/videos`).then(data => { setVideos(data.data); })
    .catch(err => console.log(err));
  }, []);

  //for processing server-sent event
  useEffect( () => {

    // axios.get(`/videos`).then(data => setVideos(data.data))
    // .catch(err => console.log(err));

    if (!listening) {
=======
  //for processing server-sent event
  // useEffect( () => {
  //   axios.get(`/videos`).then(data => { setVideos(data.data); })
  //   .catch(err => console.log(err));
  // }, []);

  useEffect( () => {

    axios.get(`/videos`).then(data => setVideos(data.data))
    .catch(err => console.log(err));

    if (!listening) {
      // subscribe for server messages, this only works when the full path put in
      // other than the endpoint short path
>>>>>>> c7c86e92b20e44af74e64cf378e16da6256e3f66
      const sse = new EventSource('/events');

      sse.onmessage = (e) => {
        const needUpdate = JSON.parse(e.data);
        // console.log('Test analysis status:', needUpdate);
        if(needUpdate) {
          axios.get(`/videos`).then(data => setVideos(data.data))
          .catch(err => console.log(err));
        }
      };

<<<<<<< HEAD
      sse.onopen = e => console.log('event is opened', e); 
      sse.onerror = e => console.log('event has errors', e);

      sse.addEventListener("data", e => console.log(e.data));
      setListening(true);

      return () => sse.close();  // cleanup when unmount the component in case of memory leak
    }
  }, [listening]);
=======
      sse.onopen = (e) => { console.log('event is opened', e); }
      sse.onerror = (e) => { console.log('event has errors', e); }

      sse.addEventListener("data", (e) => { console.log(e.data) });
      setListening(true);
    }
  }, []);
>>>>>>> c7c86e92b20e44af74e64cf378e16da6256e3f66

  const getAnalysisStatus = (status) => {
    switch (status) {
      case 0:  return 'Pended';        
      case -1: return 'Failed';        
      case 4:  return 'Success';        
      default: return 'In Process';
    }
  }

  switch(view) {
    case 'TABLE':   // show videos list table
      return (    
        <div style={{ maxWidth: "100%" }}>
          <MaterialTable
            title="Videos Uploaded"
            columns={[
              { title: "File Name", field: "name" },
              { title: "Duration", field: "duration" },
              { title: "Analysis Status", field: "status" },
            ]}

            data = {
              videos.map(item => {
                return { name: item.name, duration: item.duration, status: getAnalysisStatus(item.ana_status) }
              })
            }

            actions={[
              rowData => (
                {
                  //disabled: (rowData.status !== 'Success'),  // the disable prop doesn't work by this way
                  // icon: 'pageview',
                  icon: () => (<Pageview color={ rowData.status === 'Success' ? 'inherit' : 'disabled' } />),
                  tooltip: 'View Analysis Result',
                  onClick: (event, rowData) => {
                    if(rowData.status === 'Success'){
                      setView('GRAPH');
                      setVideo(videos.filter(item => item.name === rowData.name)[0]);
                    } 
                  },
                }
              )
            ]}

            options = {
              { search: true, pageSize: 10, actionsColumnIndex: 3 }
            }
          />
        </div>
      );
    case 'GRAPH':  // show sigle video's analysis data
      return (
        <Analysis video={selVideo}/>
      );
    default:
      return;
  }
}