const express = require('express');
const router = express.Router();

const BeachController = require('./controllers/BeachController');
const ForecastController = require('./controllers/ForecastController');

// Rotas conforme especificado:
// GET /beaches
// GET /beaches/:state
// GET /beaches/:state/:nome
// GET /beach/:nome/forecast
// POST /beaches/register
// POST /beaches/register-all
// DELETE /beaches/:nome

router.get('/beaches', BeachController.listAll);
router.get('/beaches/:state', BeachController.listByState);
router.get('/beaches/:state/:nome', BeachController.getByStateAndName);
router.get('/beach/:nome/forecast', ForecastController.getForecast);
router.post('/beaches/register', BeachController.register);
router.post('/beaches/register-all', BeachController.registerAll);
router.delete('/beaches/:nome', BeachController.remove);

module.exports = router;
