const Beach = require('../models/BeachModel');
const waves = require('../services/waves');
const { getWeatherData } = require('../services/openMeteoService');
const { getGoogleWeatherData } = require('../services/googleWeatherService');

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
      waves: waves.get_wave_data(lat, lon),
      weather: await getWeatherData(lat, lon),
      google_weather: await getGoogleWeatherData(lat, lon)
    });
  }
};
