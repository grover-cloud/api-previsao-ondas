const express = require('express');
const router = express.Router();

const BeachController = require('./controllers/BeachController');
const ForecastController = require('./controllers/ForecastController');
const MarineController = require('./controllers/MarineController');

router.get('/beaches', BeachController.listAll);
router.get('/beaches/:state', BeachController.listByState);
router.get('/beaches/:state/:nome', BeachController.getByStateAndName);
router.get('/beach/:nome/forecast', ForecastController.getForecast);
router.post('/beaches/register', BeachController.register);
router.post('/beaches/register-all', BeachController.registerAll);
router.delete('/beaches/:nome', BeachController.remove);

// Nova rota para fauna marinha em todo o Brasil (sem parâmetro de região)
router.get('/marine/fauna', MarineController.getFauna);

module.exports = router;
