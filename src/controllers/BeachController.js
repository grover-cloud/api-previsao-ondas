const Beach = require('../models/BeachModel');
const { get_wave_data, get_weather_data, get_google_weather_data } = require('../services/openMeteoService');

module.exports = {
  async listAll(req, res) {
    const beaches = await Beach.find();
    const result = beaches.map(beach => {
      const lat = beach.latitude;
      const lon = beach.longitude;
      return {
        name: beach.name,
        neighborhood: beach.neighborhood,
        city: beach.city,
        state: beach.state,
        latitude: lat,
        longitude: lon,
        google_maps: `https://maps.google.com/?q=${lat},${lon}`,
        waves: get_wave_data(lat, lon),
        weather: get_weather_data(lat, lon),
        google_weather: get_google_weather_data(lat, lon)
      };
    });
    res.status(200).json(result);
  },

  async listByState(req, res) {
    const state = req.params.state.toUpperCase();
    const beaches = await Beach.find({ state });
    const result = beaches.map(beach => {
      const lat = beach.latitude;
      const lon = beach.longitude;
      return {
        name: beach.name,
        neighborhood: beach.neighborhood,
        city: beach.city,
        state: beach.state,
        latitude: lat,
        longitude: lon,
        google_maps: `https://maps.google.com/?q=${lat},${lon}`,
        waves: get_wave_data(lat, lon),
        weather: get_weather_data(lat, lon),
        google_weather: get_google_weather_data(lat, lon)
      };
    });
    res.status(200).json(result);
  },

  async getByStateAndName(req, res) {
    const state = req.params.state.toUpperCase();
    const name = req.params.nome;
    const beach = await Beach.findOne({ state, name });
    if (!beach) return res.status(404).json({ error: 'Beach not found.' });

    const lat = beach.latitude;
    const lon = beach.longitude;
    res.status(200).json({
      name: beach.name,
      neighborhood: beach.neighborhood,
      city: beach.city,
      state: beach.state,
      latitude: lat,
      longitude: lon,
      google_maps: `https://maps.google.com/?q=${lat},${lon}`,
      waves: get_wave_data(lat, lon),
      weather: get_weather_data(lat, lon),
      google_weather: get_google_weather_data(lat, lon)
    });
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
