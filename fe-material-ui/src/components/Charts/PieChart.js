import React from 'react';
import { PieChart, Pie, Legend, Cell, Tooltip } from 'recharts';

export default function VideoPieChart(props) {

  const data = [];
  if(props.data) {
    Object.entries(props.data).forEach(([key, value]) => {
      if(value > 0){
        data.push({name: key, value: value});
      }
    });    
  } 

  if(!data.length){
    data.push({name: 'NA', value: 100});  // in case of blank space on page
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {/* {`${(percent * 100).toFixed(0)}%`} */}
        {data[index].value}
      </text>
    );
  };

  return (
    <PieChart width={350} height={250}>
      <Pie 
        isAnimationActive={false} data={data} // if animation is activated, data cannot be shown
        cx={120} cy={120} outerRadius={100} 
        label={renderCustomizedLabel} labelLine={false}>
        { data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />) } 
      </Pie>       
      <Tooltip/>
      <Legend layout={'vertical'} align={'left'} verticalAlign={'top'} height={10}/>
    </PieChart>
  );
}
