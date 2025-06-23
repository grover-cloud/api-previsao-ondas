const mongoose = require('mongoose');

const PraiaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nome: { type: String, required: true },
  cidade: { type: String, required: true },
  estado: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  mapa: { type: String, required: true }
});

module.exports = mongoose.model('Praia', PraiaSchema);
