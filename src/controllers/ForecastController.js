const Beach = require('../models/BeachModel');
const { get_wave_data, get_weather_data, get_google_weather_data } = require('../services/openMeteoService');

module.exports = {
  async getForecast(req, res) {
    const name = req.params.nome;

    const beach = await Beach.findOne({ name });
    if (!beach) return res.status(404).json({ error: 'Beach not found.' });

    const lat = beach.latitude;
    const lon = beach.longitude;

    res.status(200).json({
      name: beach.name,
      latitude: lat,
      longitude: lon,
      waves: get_wave_data(lat, lon),
      weather: get_weather_data(lat, lon),
      google_weather: get_google_weather_data(lat, lon)
    });
  }
};
