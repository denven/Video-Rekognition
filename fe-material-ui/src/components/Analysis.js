import React, { useState, useEffect } from "react";
import ReactPlayer from 'react-player'
import '../styles/Analysis.scss'
import LineChart from './Charts/LineChart';
import PieChart from './Charts/PieChart';
import BarChart from './Charts/BarChart';
import DataTile from './Charts/DataTile';
import Switch from './Charts/Switch';

import axios from 'axios';
import _ from 'lodash';

export default function Analysis (props) {

  // const [anaResults, setResults] = useState({});
  const [sexData, setSexData] = useState({});
  const [emotions, setEmotions] = useState({});
  const [ageData, setAgeData] = useState({});
  const [avgRecur, setRecurs] = useState('');
  const [recursVsTotal, setRecurRatio] = useState('');
  const [avgDuration, setDuration] = useState('');
  const [traffic, setTraffic] = useState([]);  
  const [pieView, setView] = useState('sex');

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
      'HAPPY': _.filter(data, {emotion: 'HAPPY'}).length,
      'SAD': _.filter(data, {emotion: 'SAD'}).length,
      'ANGRY': _.filter(data, {emotion: 'ANGRY'}).length,
      'CONFUSED': _.filter(data, {emotion: 'CONFUSED'}).length,
      'DISGUSTED': _.filter(data, {emotion: 'DISGUSTED'}).length,
      'SURPRISED': _.filter(data, {emotion: 'SURPRISED'}).length,
      'CALM': _.filter(data, {emotion: 'CALM'}).length,
      'FEAR': _.filter(data, {emotion: 'FEAR'}).length,
      'UNKNOWN': _.filter(data, {emotion: 'UNKNOWN'}).length
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

  const getTrafficData = (data) => {

    const timeFormat = (ts) => { 

      let hour = Math.floor(ts / (60*60*1000));
      let min = Math.floor((ts % (60*60*1000))/(60*1000));
      let sec = Math.floor((ts % (60*1000)) / 1000);

      if(hour > 0) {
        return hour + ':'+ min + ':' + sec + 's'; 
      } else if(min > 0) {
        return min + `'` + sec + `"`;  
      } else {
        return sec + `"`;
      }
    }

    return data.map(item => {
      return {time: timeFormat(item.timestamp), count: item.count};
    });
  }

  useEffect(() => {
    let pFaces = axios.get(`/faces/${props.video.id}`);
    let pRecurs = axios.get(`/recurs/${props.video.id}`);
    let pTracks = axios.get(`/track/${props.video.id}`);

    Promise.all([pFaces, pRecurs, pTracks]).then(data => {
      // setResults({faces: data[0].data, recurs: data[1].data, persons: data[2].data.persons, traffic: data[2].data.traffic});
      setAgeData(getAgesGroup(data[0].data));
      setSexData(getGenderData(data[0].data));
      setEmotions(getEmotionData(data[0].data));
      setRecurs(getAvgRecurDays(data[1].data));
      setRecurRatio(getRecursVsTotal(data[1].data));
      setDuration(getAvgStayDuration(data[2].data.persons));
      setTraffic(getTrafficData(data[2].data.traffic));
    }).catch(err => console.log(err));
  },[]); 

  console.log('1111111111', pieView, emotions);

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
            <PieChart data={(pieView === 'sex') ? sexData : emotions}/>
          </div>
          <div className='pieToggle'>
            <Switch setView={setView}/>
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
          <LineChart data={traffic}/>
        </div>
      </div>
    
    </div>
  );
}

