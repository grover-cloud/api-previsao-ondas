const Beach = require('../models/BeachModel');
const { formatBeach } = require('../helpers/beachFormatter');

const ACCESS_KEY = process.env.ACCESS_KEY;

function verificarChave(req, res) {
  const key = req.headers['x-access-key'];
  if (key !== ACCESS_KEY) {
    res.status(401).json({ error: 'Unauthorized. Invalid or missing access key.' });
    return false;
  }
  return true;
}

module.exports = {
  async listAll(req, res) {
    if (!verificarChave(req, res)) return;
    try {
      const beaches = await Beach.find().limit(10);
      const result = await Promise.all(beaches.map(formatBeach));
      res.status(200).json(result);
    } catch (error) {
      console.error('[Erro interno listAll]', error);
      res.status(500).json({ error: 'Error loading beaches.' });
    }
  },

  async listByState(req, res) {
    if (!verificarChave(req, res)) return;
    try {
      const state = req.params.state.toUpperCase();
      const beaches = await Beach.find({ state }).limit(10);
      const result = await Promise.all(beaches.map(formatBeach));
      res.status(200).json(result);
    } catch (error) {
      console.error('[Erro interno listByState]', error);
      res.status(500).json({ error: 'Error loading beaches by state.' });
    }
  },

  async getByStateAndName(req, res) {
    if (!verificarChave(req, res)) return;
    try {
      const state = req.params.state.toUpperCase();
      const name = req.params.nome;
      const beach = await Beach.findOne({ state, name });
      if (!beach) return res.status(404).json({ error: 'Beach not found.' });

      const result = await formatBeach(beach);
      res.status(200).json(result);
    } catch (error) {
      console.error('[Erro interno getByStateAndName]', error);
      res.status(500).json({ error: 'Error loading beach details.' });
    }
  },

  async register(req, res) {
    if (!verificarChave(req, res)) return;
    const data = req.body;
    const requiredFields = ["name", "neighborhood", "city", "state", "latitude", "longitude"];
    if (!requiredFields.every(k => data[k])) return res.status(400).json({ error: "Missing required fields." });

    await Beach.create({
      name: data.name,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state.toUpperCase(),
      latitude: data.latitude,
      longitude: data.longitude
    });
    res.status(201).json({ message: "Beach successfully registered." });
  },

  async registerAll(req, res) {
    if (!verificarChave(req, res)) return;
    const beaches = req.body;
    if (!Array.isArray(beaches)) return res.status(400).json({ error: "Please send a list of beaches." });

    const valid = beaches.filter(b => ["name", "neighborhood", "city", "state", "latitude", "longitude"].every(k => b[k]))
      .map(b => ({
        name: b.name,
        neighborhood: b.neighborhood,
        city: b.city,
        state: b.state.toUpperCase(),
        latitude: b.latitude,
        longitude: b.longitude
      }));

    if (valid.length > 0) await Beach.insertMany(valid);
    res.status(201).json({ message: `${valid.length} beaches successfully registered.` });
  },

  async remove(req, res) {
    if (!verificarChave(req, res)) return;
    const name = req.params.nome;
    const result = await Beach.deleteOne({ name });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Beach not found to delete." });
    res.status(200).json({ message: "Beach successfully deleted." });
  }
};
