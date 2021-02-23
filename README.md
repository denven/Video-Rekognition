## Video-Rekognition

A project uses AWS Rekognition to do video analysis.

- Re-implemented the front-end based on my previous implementation [Smart Retailer](https://github.com/denven/Smart-Retailer);

### AWS Setup
 Take a look at this file for the backend, follow the format and use your own customized contents.
 
 https://github.com/denven/Video-Rekognition/blob/master/back-end/.env.example

## What business analytics do we get from videos?

The app will extrapolate simple business analytics from videos for the day to day operations.

- Number of customers in video
- Age, sex, emotions (physical) 
- Average time in video
- Recurrences of previously analyzed people in videos
- Average time before recurrences

## Screenshots
![Videos Uploaded and status of Analysis](./screenshots/Videos_Uploaded.png#pic_center=960x500)
![Analysis for new customers-Line Chart View](./screenshots/Analysis_LineChartView.png#pic_center=960x500)
![Analysis for new customers-Bar Chart View](./screenshots/Analysis_BarChartView.png#pic_center=960x500)

## How to use this APP?
1. Hit Upload Tab at the SiderBar
2. Drag and drop mp4 files (files named as: VID_YYYYMMDD_HHMMSS.mp4 will be accepted)
3. Upload file and drink a cup of coffee to wait until the analysis is done!

### Note: 
- The video analysis takes time, and the waiting time varies from duration, motions, persons, file sizes, resolutions of the video. It will awalys take several minutes to for a 20s video;
- You should have your AWS account configured, including users/roles/credential keys, Rekognition, S3, SQS, SNS services setup etc.
- Be aware of your bill if you stick to uploading large size and complex videos for analysis. 

## What's the stack
### Backend
- Node.js
- Express.js
- Postgres
- AWS Rekognition, S3, SNS, SQS
- Server Sent Events
### Frontend
- React.js
- Material UI
- Material table
- reCharts
