const mongoose = require('mongoose');

const BeachSchema = new mongoose.Schema({
  name: { type: String, required: true },
  neighborhood: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
});

module.exports = mongoose.model('Beach', BeachSchema);
