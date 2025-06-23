const axios = require('axios');
const apiKey = 'AIzaSyBpcs2INXKQfHcNC1BtmgZAvIdeQPawg9g';

async function buscarPrevisaoClima(lat, lon) {
  const url = `https://weather.googleapis.com/v1/weather:lookup?location.latitude=${lat}&location.longitude=${lon}&key=${apiKey}`;
  const { data } = await axios.get(url);
  return data;
}

module.exports = { buscarPrevisaoClima };
