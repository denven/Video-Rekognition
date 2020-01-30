import React from 'react';
import { useState, useEffect } from 'react';
import Switch from '@material-ui/core/Switch';

export default function SwitchesGroup(props) {
  const [state, setState] = useState({ switched: false });  // not enabled by default

  useEffect(() => {
    if (state.switched === true) {
      props.toggleView(false);
    } else {
      props.toggleView(true);
    }
  }, [state])

  const handleChange = name => event => {
    setState({ ...state, [name]: event.target.checked });
  };

  return (
    <>
      <span>{props.type === 'dataType' ? 'emotion' : 'BarChart'}</span>
      <Switch size='small' checked={state.switched} onChange={handleChange('switched')}/>
    </  >
  );
}