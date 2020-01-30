import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function VideoBarChart(props) {

  const data = props.data;

  return (
    <BarChart width={800} height={400} data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="5 5"/>
      <XAxis dataKey="time" />
      <YAxis/>
      <Tooltip/>
      {/* <Legend/> */}
      <Bar dataKey="count" fill="#8884d8"/>
    </BarChart>
  );
}