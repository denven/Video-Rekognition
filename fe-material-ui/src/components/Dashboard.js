import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%'
  },
  heading: {
    fontSize: '24px',
    fontWeight: theme.typography.fontWeightRegular,
  },
  newRoot: {
    display: 'flex',
    padding: '0 24px 0 24px',
    'min-height': '128px',
    transition: 'min-height 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'
  },
  'newroot.Mui-expanded': {
    'min-height': '164px',
  },
  column: {
    flexDirection: 'column',
  }
}));

export default function SimpleExpansionPanel() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <ExpansionPanel defaultExpanded={true}>        
        <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2a-content"
            id="panel2a-header"
          >
          <Typography className={classes.heading}>About</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.column}>
          <Typography>
            Smart-Retailer is a web application that uses facial recognition software to extrapolate simple business analytics 
            from videos for the day to day operations. This is only a small portion of what Amazon's AWS Rekgonition is 
            capable of, we personally have not had much experience in our personal lives when it comes to facial recognition interactions from
            our day to day. However we believe that this disruptive technology is on the rise and we should be posing questions on its ethics 
            and boundaries. 
          </Typography>
          <Typography>
            WARNING: DO NOT USE SOFTWARE IF YOU DO NOT WANT AMAZON TO HAVE YOUR PERSONAL DATA.
          </Typography>
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <ExpansionPanel >
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2a-content"
          id="panel2a-header"
        >
          <Typography className={classes.heading}>How to use</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.column}>
          <Typography>
            1. Just hit that Upload button.
          </Typography>
          <Typography>
            2. Drag and drop mp4 files
          </Typography>
          <Typography>
            3. Upload and wait!
          </Typography>
          <Typography>
            Extracted Information by our APP: 
            Number of people in the video, 
            age, sex, emotions (physical), 
            average time in video, 
            recurrences of previously analyzed people in videos, 
            average time before recurrences
          </Typography>
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <ExpansionPanel >
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3a-content"
          id="panel3a-header"
        >
          <Typography className={classes.heading}>Ethics</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.column}>
          <Typography>
            What are the ethics behind facial recognition in the commercial space?
          </Typography>
          <Typography>
            Is there such thing as personal privacy in public space?
          </Typography>
          <Typography>
            How do we want businesses to hold on to our data for more convenience? If so, what about targetted ads we'd like to keep private?
          </Typography>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    </div>
  );
}