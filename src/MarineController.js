const Beach = require('../models/BeachModel');
const { getWeatherData } = require('../services/openMeteoService');
const { getMarineData } = require('../services/marineService');
const { getGoogleWeatherData } = require('../services/googleWeatherService');

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
      const result = await Promise.all(beaches.map(async beach => {
        const lat = beach.latitude;
        const lon = beach.longitude;
        const forecast = await getWeatherData(lat, lon);
        const marine = await getMarineData(lat, lon);
        const googleWeather = await getGoogleWeatherData(lat, lon);

        return {
          name: beach.name,
          neighborhood: beach.neighborhood,
          city: beach.city,
          state: beach.state,
          latitude: lat,
          longitude: lon,
          google_maps: `https://maps.google.com/?q=${lat},${lon}`,
          forecast,
          marine,
          google_weather: googleWeather
        };
      }));
      res.status(200).json(result);
    } catch (error) {
      console.error('[Erro interno listAll]', error);
      res.status(500).json({ error: 'Error loading beaches.' });
    }
  },

  // As outras funções permanecem iguais, posso gerar o restante se quiser.
