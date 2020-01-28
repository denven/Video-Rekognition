import React, { useState } from "react";
import MaterialTable from "material-table";
import ReactPlayer from 'react-player';
import LineChart from './Charts/LineChart';
import PieChart from './Charts/PieChart';
import BarChart from './Charts/BarChart';

export default function Analysis (props) {
  
   return(
     <div>
      <ReactPlayer url='https://www.youtube.com/watch?v=9Ka1fcn74Hg' width='100%' height='100%' controls muted />
      <LineChart/>
    </div>
  );
}

