const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Value Schema
const ValuesSchema = new Schema({
  id:{type: String, required: true},
  datetime:{type: String, required: true},
  temperatura: {type: String, required: false},
  humedad: {type: String, required: false},
  ph: {type: String, required: false},
});

mongoose.model('values', ValuesSchema);
