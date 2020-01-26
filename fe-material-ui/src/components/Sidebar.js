import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

import PeopleIcon from '@material-ui/icons/People';
import UploadIcon from '@material-ui/icons/Backup';
import VideoIcon from '@material-ui/icons/VideoLibrary';
import DashboardIcon from '@material-ui/icons/Dashboard';
import StatisticIcon from '@material-ui/icons/Assessment';

import Panel from './Panel';
import Upload from './Upload';


function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  };
}

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    height: '100vh',
  },
  tabs: {
    borderRight: `2px solid ${theme.palette.divider}`,
  },
  icons: {
    verticalAlign: 'middle',
    // padding: '5px',
    margin: '10px'
  },
  logo: {
    fontSize: 20
  },
  bottom: {
    position: "absolute",
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 10,
    // fontSize: 20
  },
  panels: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100vh',
    width: '88vw'
  }

}));

export default function Sidebar() {

  const classes = useStyles();
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={handleChange}
        className={classes.tabs}
      >
        <Tab label="Smart Retailer" className = {classes.logo} icon={<PeopleIcon/>} disabled = {true} {...a11yProps(0)} />
        <Tab label={<div><DashboardIcon className={classes.icons}/><span>Dashboard</span></div>} {...a11yProps(1)} />
        <Tab label={<div><UploadIcon className={classes.icons}/><span className={classes.icons}> Upload</span></div>} {...a11yProps(2)} />
        <Tab label={<div><VideoIcon className={classes.icons}/><span className={classes.icons}>  Videos</span></div>} {...a11yProps(3)} />
        <Tab label={<div><StatisticIcon className={classes.icons}/>Statistic</div>} className={classes.bottom} {...a11yProps(4)} />
      </Tabs>

      <TabPanel value={value} index={0}>       </TabPanel>

      <TabPanel value={value} index={1} className={classes.panels}>
        <Panel/>
      </TabPanel>

      <TabPanel value={value} index={2} className={classes.panels}>
        <Upload/>
      </TabPanel>

      <TabPanel value={value} index={0} className={classes.panels}>
        <Upload/>
      </TabPanel>
    </div>
  );
}
