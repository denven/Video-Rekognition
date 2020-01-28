import React, { useState } from "react";
import MaterialTable from "material-table";
import Analysis from './Analysis';
 
export default function Videos (props) {

  const [mode, setMode] = useState('TABLE');

  switch(mode) {
    case 'TABLE': 
      return (    
        <div style={{ maxWidth: "100%" }}>
          <MaterialTable
            title="Videos"
            columns={[
              { title: "File Name", field: "name" },
              { title: "Duration", field: "duration" },
              { title: "Analysis Status", field: "status" },
            ]}

            //rows
            data={[
              { name: "VID_20191240_120253", duration: "20", status: 'done' }
            ]}

            actions={[
              {
                icon: 'pageview',
                tooltip: 'View analysis result',
                onClick: (event, rowData) => {setMode('GRAPH')}
              }
            ]}

            options = {
              { actionsColumnIndex: 3 }
            }
          />
        </div>
      );
    case 'GRAPH':
      return (
        <Analysis/>
      );
    default:
      return;
  }
}