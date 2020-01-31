const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors')

const PORT = 8080;
const db = require('./database/db');
const { awsServiceStart } = require('./rekognition/aws-servies');
const { anaTaskManager } = require('./rekognition/task-manager');

// Express Configuration
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.json());
app.use(cors());

const appRoutes = require("./routes/routes")();
app.use("/", appRoutes); // mount all the routes to root path (no other divisions)

db.testDBConnection();
awsServiceStart();
anaTaskManager();

app.listen(PORT, () => {
  console.log(`Express seems to be listening on port ${PORT} so that's pretty good 👍`);
});
