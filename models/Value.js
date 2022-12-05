const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Value Schema
const ValuesSchema = new Schema({
  deviceId:{type: String, required: true},
  date:{type: Number, required: true},
  temperatura: {type: String, required: true},
  humedad: {type: String, required: true},
  ph: {type: String, required: true},
});

mongoose.model('values', ValuesSchema);
