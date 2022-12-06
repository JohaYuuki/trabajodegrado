const express = require('express');
const path = require('path');                       //for path navigation
const bodyParser = require('body-parser');          //to access at req.value
const methodOverride = require('method-override');  //needs for edit and delete
const {PubSub} = require('@google-cloud/pubsub');   //google cloud pub/sub module
const mongoose = require('mongoose');               //database
const exphbs = require('express-handlebars');       //front-end

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

//load values model
require('./models/Value');
const Values = mongoose.model('values');
require('./models/Accel_cloud');
const AccelCloud = mongoose.model('accel_cloud');
require('./models/Accel_edge');
const AccelEdge = mongoose.model('accel_edge');

//handlebars helpers
const {stripTags} = require('./helpers/hbs');
const {eq} = require('./helpers/hbs');

/********************************************************************************************************/
/*                                    WebSocket and MQTT connection                                     */
/********************************************************************************************************/

function predict(x, y, z){
  let magnitude = Math.hypot(x, y, z);
  if(magnitude > 9.05 && magnitude < 9.95) return 1;
  else return 0;
}

// Imports the Google Cloud client library
io.on('connection', function(socket){
  var values = Values.find(
    { date: { $gt: parseInt(Date.now()/1000) - 3600 } }
  ).sort({date:-1}).then(values => {
    io.emit("lastvalues", values);
  });

  const subscriptionName1 = 'projects/trabajodegrado-369023/subscriptions/my-subscription';
  // Creates a client; cache this for further use
  const pubSubClient = new PubSub();

  function listenForMessages() {
    // References an existing subscription
    const subscription1 = pubSubClient.subscription(subscriptionName1);
    // Create an event handler to handle messages

    /********************************************* ENVIRONMENTAL STATIONS *********************************************/
    const messageHandler1 = message => {
      console.log(`Received message ${message.id}:`);
      console.log('\tData:' + message.data);
      console.log(`\tAttributes: ${message.attributes}`);
      var payload = JSON.parse(message.data);

      const newValue = {
        deviceId: payload.deviceId,
        temperature: payload.temperature,
        humidity: payload.humidity,
        ph: payload.ph,
        date: payload.date
      };
      new Values(newValue).save();

      // TEMPERATURE
      io.emit("temperature", (payload.deviceId + ";" + payload.temperature + ";" + payload.date).toString());
      // HUMIDITY
      io.emit("humidity", (payload.deviceId + ";" + payload.humidity + ";" + payload.date).toString());
      // PH HEIGHT
      io.emit("ph", (payload.deviceId + ";" + payload.ph + ";" + payload.date).toString());
      // "Ack" (acknowledge receipt of) the message
      message.ack();
    };

    // Listen for new messages until timeout is hit
    subscription1.on('message', messageHandler1);
  }
  listenForMessages();
});
/***********************************************************************************************************************/

//handlebars middleware
app.engine('handlebars', exphbs({
  helpers: {stripTags: stripTags, eq:eq },
  defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

//method override middleware
app.use(methodOverride('_method'));

// Map global promise - get rid of warning
mongoose.Promise = global.Promise;
//connect to mongoose
const uri = "mongodb+srv://jeyepezv:Yuki17129718@tdg.yfkyoeg.mongodb.net/test"; 
mongoose.connect(uri, {
  useNewUrlParser: true
})
  .then(() => {
    console.log('MongoDb Connected..');
  })
  .catch(err => console.log(err));

// GET Home page
app.get('/', function (req, res) {
    res.render('index');
});

// GET route for environmental dashboard
app.get('/environmentalstations', function (req, res) {
  Values.find(
    { date: { $gt: parseInt(Date.now()/1000) - 3600 } }
  ).sort({date:-1}).then(values =>{
    res.render('envstat', {values:values});
  })
});

// Starting Server
const port = process.env.PORT || 5000;
http.listen(port, ()=>{
  console.log(`Server started on port ${port}`);
} );
