import React, { useState, useEffect } from "react";
import ReactPlayer from 'react-player'
import '../styles/Analysis.scss'
import LineChart from './Charts/LineChart';
import PieChart from './Charts/PieChart';
import BarChart from './Charts/BarChart';
import DataTile from './Charts/DataTile';

import axios from 'axios';
import _ from 'lodash';

export default function Analysis (props) {

  // const [anaResults, setResults] = useState({});
  const [sexData, setSexData] = useState({});
  const [ageData, setAgeData] = useState({});
  const [avgRecur, setRecurs] = useState('');
  const [recursVsTotal, setRecurRatio] = useState('');
  const [avgDuration, setDuration] = useState('');
  

  const getAgesGroup = (data) => {
    return {
      'Pre-Teen': _.filter(data, {age: 0}).length,
      'Teen': _.filter(data, {age: 1}).length,
      'Youn Adult': _.filter(data, {age: 2}).length,
      'Middle Aged': _.filter(data, {age: 3}).length,
      'Senior': _.filter(data, {age: 4}).length,
    };     
  }

  const getGenderData = (data) => {
    let femaleCount = _.filter(data, {sex: 'Female'}).length;
    return {Female: femaleCount, Male: data.length - femaleCount};     
  }

  const getEmotionData = (data) => {
    return {
      'HAPPY': _.filter(data, {HAPPY: 0}).length,
      'SAD': _.filter(data, {SAD: 1}).length,
      'ANGRY': _.filter(data, {ANGRY: 2}).length,
      'CONFUSED': _.filter(data, {CONFUSED: 3}).length,
      'DISGUSTED': _.filter(data, {DISGUSTED: 4}).length,
      'SURPRISED': _.filter(data, {SURPRISED: 1}).length,
      'CALM': _.filter(data, {CALM: 2}).length,
      'FEAR': _.filter(data, {FEAR: 3}).length,
      'UNKNOWN': _.filter(data, {UNKNOWN: 4}).length,
    };  
  }

  const getAvgRecurDays = (data) => {
    let total_days = 0;
    let recurs_count = _.filter(data, {is_recuring: true}).length;

    for(const item of data) {
      if(item.is_recuring) {
        total_days += item.visit_date;
      }
    }

    return recurs_count ? Math.ceil(total_days/recurs_count) : 0;    
  }

  const getRecursVsTotal = (data) => {
    let recurs_count = _.filter(data, {is_recuring: true}).length;
    return `${recurs_count} / ${data.length}`;    
  }

  const getAvgStayDuration = (data) => {
    let total_seconds = 0;

    for(const item of data) {
      if(item.stay_duration) {
        total_seconds += item.stay_duration;
      }
    }

    return data.length > 0 ? Math.ceil(total_seconds/data.length) : 0;    
  }

  useEffect(() => {
    let pFaces = axios.get(`/faces/${props.video.id}`);
    let pRecurs = axios.get(`/recurs/${props.video.id}`);
    let pTracks = axios.get(`/track/${props.video.id}`);

    Promise.all([pFaces, pRecurs, pTracks]).then(data => {
      console.log('xxxxxxxxxxxxxxxxxxxxx', data[2].data.traffic);
      // setResults({faces: data[0].data, recurs: data[1].data, persons: data[2].data.persons, traffic: data[2].data.traffic});

      setSexData(getGenderData(data[0].data));
      setAgeData(getAgesGroup(data[0].data));
      setRecurs(getAvgRecurDays(data[1].data));
      setRecurRatio(getRecursVsTotal(data[1].data));
      setDuration(getAvgStayDuration(data[2].data.persons));

    }).catch(err => console.log(err));
  },[]); 

  // console.log('1111111111', anaResults);

  return(
    <div className="outerContainer">

      <div className="upperRow">
        <div className="videoPlayerBox">
          <ReactPlayer url='https://www.youtube.com/watch?v=9Ka1fcn74Hg' width='100%' height='100%' controls muted />
        </div>
        <div className='pieChartsBox'>          
          <div className='pieChart'>
            <PieChart data={ageData}/>
          </div>
          <div className='pieChart'>
            <PieChart data={sexData}/>
          </div>
        </div>
      </div>
    
      <div className='bottomRow'>
        <div className='bottomLeft'>
          <div className='tileBox'>
            <DataTile
              number={recursVsTotal}
              title={'Recuring Customers vs Total Customers'}
            />
          </div>
          <div className='tileBox'> 
            <DataTile
              number={avgDuration + ' s'}
              title={'Average Time in Store'}
            />
          </div>
          <div className='tileBox'>
            <DataTile
              number={avgRecur + ' days'}
              title={'Average Days Recurring Customers take to return'}
            />
          </div>
        </div>
        <div className='bottomRight'>
          <LineChart/>
        </div>
      </div>
    
    </div>
  );
}

