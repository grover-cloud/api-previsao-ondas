const express = require('express');
const router = express.Router();
const Praia = require('../models/praia');
const { buscarPrevisaoMar } = require('../services/openMeteoService');
const { buscarPrevisaoClima } = require('../services/googleWeatherService');

// Listar todas as praias
router.get('/', async (req, res) => {
  const praias = await Praia.find();
  res.json(praias);
});

// Listar praias por estado
router.get('/:estado', async (req, res) => {
  const { estado } = req.params;
  const praias = await Praia.find({ estado: estado.toUpperCase() });
  res.json(praias);
});

// Listar praias por cidade
router.get('/:estado/:cidade', async (req, res) => {
  const { estado, cidade } = req.params;
  const praias = await Praia.find({ 
    estado: estado.toUpperCase(), 
    cidade: { $regex: new RegExp(cidade, 'i') }
  });
  res.json(praias);
});

// Detalhes da praia
router.get('/detalhes/:id', async (req, res) => {
  const { id } = req.params;
  const praia = await Praia.findOne({ id });
  if (!praia) return res.status(404).json({ message: 'Praia não encontrada' });
  res.json(praia);
});

// Previsao Marítima
router.get('/previsao-mar/:id', async (req, res) => {
  const { id } = req.params;
  const praia = await Praia.findOne({ id });
  if (!praia) return res.status(404).json({ message: 'Praia não encontrada' });
  const previsao = await buscarPrevisaoMar(praia.latitude, praia.longitude);
  res.json({ praia: praia.nome, previsao });
});

// Previsao Clima
router.get('/previsao-clima/:id', async (req, res) => {
  const { id } = req.params;
  const praia = await Praia.findOne({ id });
  if (!praia) return res.status(404).json({ message: 'Praia não encontrada' });
  const previsao = await buscarPrevisaoClima(praia.latitude, praia.longitude);
  res.json({ praia: praia.nome, previsao });
});

module.exports = router;
