const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Value Schema
const Accel_cloudSchema = new Schema({
  id:{type: String, required: true},
  datetime:{type: String, required: true},
  ph: {type: String, required: false},
});

mongoose.model('accel_cloud', Accel_cloudSchema);
