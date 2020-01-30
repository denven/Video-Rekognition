import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

export default function VideoLineChart(props) {

  const data = props.data;

  return (
    <LineChart width={800} height={400} data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
      <Line type="monotone" dataKey="count" stroke="#8884d8" />
      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
      <XAxis dataKey="time"/>
      <YAxis/>
      {/* <Legend/> */}
      <Tooltip/>
    </LineChart>
  );
}
