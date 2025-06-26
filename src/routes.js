const express = require('express');
const router = express.Router();

const LitoralController = require('./controllers/LitoralController');
const PrevisaoOndaController = require('./controllers/PrevisaoOndaController');
const Controller = require('./controllers/Controller');
const PraiaController = require('./controllers/PraiaController');

router.use('/litoral', LitoralController);
router.use('/onda', PrevisaoOndaController);
router.use('/praias', PraiaController);
router.use('/', Controller);

module.exports = router;
