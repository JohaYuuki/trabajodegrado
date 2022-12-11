const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Value Schema
const ValuesSchema = new Schema({
  id:{type: String, required: true},
  datetime:{type: String, required: true},
  temperatura: {type: String, required: true},
  humedad: {type: String, required: true},
  ph: {type: String, required: true},
});

mongoose.model('values', ValuesSchema);
