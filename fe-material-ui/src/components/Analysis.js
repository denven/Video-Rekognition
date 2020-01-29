import React, { useState } from "react";
import '../styles/Analysis.scss'

import ReactPlayer from 'react-player';


import LineChart from './Charts/LineChart';
import PieChart from './Charts/PieChart';
import BarChart from './Charts/BarChart';

export default function Analysis (props) {
  
   return(
    <div className="outerContainer">

      <div className="upperRow">
        <div className="videoPlayerBox">
          <ReactPlayer url='' width='100%' height='100%' controls muted />
        </div>
        <div className='pieChartsBox'>          
          <div className='pieChart'>
            <PieChart/>
          </div>
          <div className='pieChart'>
            <PieChart/>
          </div>
        </div>
      </div>
    
      <div className='bottomRow'>
        <div className='bottomLeft'>
          <div className='tileBox'>
          </div>

          <div className='tileBox'>
          </div>

          <div className='tileBox'>
          </div>
        </div>
        <div className='bottomRight'>
          <LineChart/>
        </div>
      </div>
    
    
    </div>

  );
}

