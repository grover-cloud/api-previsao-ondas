const axios = require('axios');

async function buscarPrevisaoMar(lat, lon) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,wind_speed,wind_direction,water_temperature`;
  const { data } = await axios.get(url);
  return data;
}

module.exports = { buscarPrevisaoMar };
