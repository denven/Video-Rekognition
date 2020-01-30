import React from 'react';
import { useState, useEffect } from 'react';
import Switch from '@material-ui/core/Switch';

export default function SwitchesGroup(props) {
  const [state, setState] = useState({ emotions: false });

  useEffect(() => {
    if (state.emotions === true) {
      props.setView("emotions");
    } else {
      props.setView("sex");
    }
  }, [state])

  const handleChange = name => event => {
    setState({ ...state, [name]: event.target.checked });
  };

  return (
    <>
      <span>emotion</span>
      <Switch size='small' checked={state.emotions} onChange={handleChange('emotions')}/>
    </  >
  );
}