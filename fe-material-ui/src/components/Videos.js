import React from "react";
import MaterialTable from "material-table";
 
export default function Videos () {
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
            onClick: (event, rowData) => alert("You saved")
          }
        ]}

        options = {
          { actionsColumnIndex: 3}
        }
      />
    </div>
  );
}