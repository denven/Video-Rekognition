import React, { useState, useEffect } from "react";
import MaterialTable from "material-table";
import Analysis from './Analysis';
import axios from 'axios';
 
export default function Videos (props) {

  const [view, setView] = useState('TABLE');
  const [videos, setVideos] = useState([]);
  const [selVideo, setVideo] = useState({});

  useEffect(() => {
    axios.get(`/videos`).then(data => { setVideos(data.data); })
    .catch(err => console.log(err));
  },[]);

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
              {
                icon: 'pageview',
                tooltip: 'View analysis result',
                onClick: (event, rowData) => {
                  setView('GRAPH');
                  setVideo( videos.filter(item => item.name === rowData.name)[0] );
                }
              }
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