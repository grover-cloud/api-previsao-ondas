const Beach = require('../models/BeachModel');
const { formatBeach } = require('../helpers/beachFormatter');

module.exports = {
  async getForecast(req, res) {
    try {
      const name = req.params.nome;
      const beach = await Beach.findOne({ name });
      if (!beach) return res.status(404).json({ error: 'Beach not found.' });

      const result = await formatBeach(beach);
      res.status(200).json(result);
    } catch (error) {
      console.error('[Erro interno getForecast]', error);
      res.status(500).json({ error: 'Error loading forecast.' });
    }
  }
};
