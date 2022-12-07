const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Value Schema
const ValuesSchema = new Schema({
  devideId:{type: String, required: true},
  date:{type: Number, required: true},
  temperature: {type: String, required: true},
  humidity: {type: String, required: true},
  ph: {type: String, required: true},
});

mongoose.model('values', ValuesSchema);
