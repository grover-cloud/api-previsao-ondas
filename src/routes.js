const LitoralController = require('./controllers/LitoralController');
const PrevisaoOndaController = require('./controllers/PrevisaoOndaController');
const Controller = require('./controllers/Controller');
const PraiaController = require('./controllers/PraiaController');

const express = require('express');
const router = express.Router();
const PraiaController = require('./controllers/PraiaController');

const initializeRoutes = (app) => {
    app.use('/litoral', LitoralController);
    app.use('/onda', PrevisaoOndaController);
    app.use('/', Controller);
}

module.exports = initializeRoutes;



router.use('/praias', PraiaController);

module.exports = router;
