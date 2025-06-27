const Beach = require('../models/BeachModel');
const { getWeatherData, getMarineData } = require('../services/openMeteoService');
const { getGoogleWeatherData } = require('../services/googleWeatherService');

module.exports = {
  async listAll(req, res) {
    try {
      const beaches = await Beach.find().limit(10);
      const result = await Promise.all(beaches.map(async beach => {
        const lat = beach.latitude;
        const lon = beach.longitude;
        const dados = await getWeatherData(lat, lon);
        const mar = await getMarineData(lat, lon);
        const googleWeather = await getGoogleWeatherData(lat, lon);
        return {
          name: beach.name,
          neighborhood: beach.neighborhood,
          city: beach.city,
          state: beach.state,
          latitude: lat,
          longitude: lon,
          google_maps: `https://maps.google.com/?q=${lat},${lon}`,
          ...dados,
          ...mar,
          google_weather: googleWeather
        };
      }));
      res.status(200).json(result);
    } catch (error) {
      console.error('[Erro interno listAll]', error);
      res.status(500).json({ error: 'Error loading beaches.' });
    }
  },

  async listByState(req, res) {
    try {
      const state = req.params.state.toUpperCase();
      const beaches = await Beach.find({ state }).limit(10);
      const result = await Promise.all(beaches.map(async beach => {
        const lat = beach.latitude;
        const lon = beach.longitude;
        const dados = await getWeatherData(lat, lon);
        const mar = await getMarineData(lat, lon);
        const googleWeather = await getGoogleWeatherData(lat, lon);
        return {
          name: beach.name,
          neighborhood: beach.neighborhood,
          city: beach.city,
          state: beach.state,
          latitude: lat,
          longitude: lon,
          google_maps: `https://maps.google.com/?q=${lat},${lon}`,
          ...dados,
          ...mar,
          google_weather: googleWeather
        };
      }));
      res.status(200).json(result);
    } catch (error) {
      console.error('[Erro interno listByState]', error);
      res.status(500).json({ error: 'Error loading beaches by state.' });
    }
  },

  async getByStateAndName(req, res) {
    try {
      const state = req.params.state.toUpperCase();
      const name = req.params.nome;
      const beach = await Beach.findOne({ state, name });
      if (!beach) return res.status(404).json({ error: 'Beach not found.' });

      const lat = beach.latitude;
      const lon = beach.longitude;
      const dados = await getWeatherData(lat, lon);
      const mar = await getMarineData(lat, lon);
      const googleWeather = await getGoogleWeatherData(lat, lon);
      res.status(200).json({
        name: beach.name,
        neighborhood: beach.neighborhood,
        city: beach.city,
        state: beach.state,
        latitude: lat,
        longitude: lon,
        google_maps: `https://maps.google.com/?q=${lat},${lon}`,
        ...dados,
        ...mar,
        google_weather: googleWeather
      });
    } catch (error) {
      console.error('[Erro interno getByStateAndName]', error);
      res.status(500).json({ error: 'Error loading beach details.' });
    }
  },

  async register(req, res) {
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
    const name = req.params.nome;
    const result = await Beach.deleteOne({ name });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Beach not found to delete." });
    res.status(200).json({ message: "Beach successfully deleted." });
  }
};
