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
const timeout = 60;

//load values model
require('./models/Value');
const Values = mongoose.model('values');
console.log("Hola 1");
//require('./models/Accel_cloud');
//const AccelCloud = mongoose.model('accel_cloud');
//require('./models/Accel_edge');
//const AccelEdge = mongoose.model('accel_edge');

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
console.log("Hola 2");
// Imports the Google Cloud client library
io.on('connection', function(socket){
  var values = Values.find(
    { date: { $gt: parseInt(Date.now()/1000) - 3600 } }
  ).sort({date:-1}).then(values => {
    io.emit("lastvalues", values);
  });
  console.log("Hola 3");
  const subscriptionName1 = 'projects/trabajodegrado-369023/subscriptions/my_subscription';
  // Creates a client; cache this for further use
  const pubSubClient = new PubSub();
  function listenForMessages() {
    // References an existing subscription
    const subscription1 = pubSubClient.subscription(subscriptionName1);
    // Create an event handler to handle messages
    console.log("aun no Entre");

    /********************************************* ENVIRONMENTAL STATIONS ********************************************/
    let messageCount = 0;
    const messageHandler = message => {
      console.log("Entre");
      console.log(`Received message ${message.id}:`);
      console.log('\tData:' + message.data);
      console.log(`\tAttributes: ${message.attributes}`);
      messageCount += 1;
      var payload = JSON.parse(message.data);
      const newValue = {
        id: payload.id,
        datetime: payload.datetime,
        temperatura: payload.temperatura,
        humedad: payload.humedad,
        ph: payload.ph
      };
      if (payload.ph == undefined && payload.temperatura != undefined){
        
        new Values(newValue).save();
        console.log(payload.id);
        console.log(payload.datetime);
        console.log(payload.temperatura);
        console.log(payload.humedad);
        // TEMPERATURE
        io.emit("temperatura", (payload.id + ";" + payload.temperatura + ";" + payload.datetime).toString());
        // HUMIDITY
        io.emit("humedad", (payload.id + ";" + payload.humedad + ";" + payload.datetime).toString());
      } else {
        /*const newValue = {
          id: payload.id,
          datetime: payload.datetime,
          ph: payload.ph
        };*/
        new Values(newValue).save();
        console.log(payload.id);
        console.log(payload.datetime);
        console.log(payload.ph);
        io.emit("ph", (payload.id + ";" + payload.ph + ";" + payload.datetime).toString());        
      }
      // "Ack" (acknowledge receipt of) the message
      message.ack();
    };
    // Listen for new messages until timeout is hit
    subscription1.on('message', messageHandler);
  }
  
  listenForMessages();
});
/***********************************************************************************************************************/
console.log("Hola 4");
//handlebars middleware
app.engine('handlebars', exphbs.engine({
  helpers: {stripTags: stripTags, eq:eq },
  defaultLayout: 'main'}));
  console.log("Hola 5");
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
const uri = "mongodb+srv://jeyepezv:Yuki17129718@tdg.yfkyoeg.mongodb.net/TdG"; 
console.log("Hola 6");
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
  console.log("HolaNodo1");
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
