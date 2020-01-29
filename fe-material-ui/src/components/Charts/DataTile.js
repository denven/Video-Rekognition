
import React from 'react';
import '../../styles/Analysis.scss'

export default function DataTile (props) {
  return (
    <div>
      <p>{props.number}</p> 
      <p className='textSize'>{props.title}</p> 
    </div>
  );
}