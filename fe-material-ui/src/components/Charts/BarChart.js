import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function VideoBarChart(props) {

  const data = props.data;

  return (
    <BarChart
      width={800}
      height={400}
      data={data}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3"/>
      <XAxis dataKey="time" />
      <YAxis/>
      <Tooltip/>
      <Legend/>
      <Bar dataKey="count" fill="#8884d8"/>
    </BarChart>
  );
}