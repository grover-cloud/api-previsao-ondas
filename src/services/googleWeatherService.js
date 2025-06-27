const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function getGoogleWeatherData(lat, lon) {
  try {
    const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}&location.latitude=${lat}&location.longitude=${lon}`;
    const headers = { 'Content-Type': 'application/json' };

    const response = await axios.get(url, { headers });
    const data = Array.isArray(response.data) ? response.data[0] : response.data || {};

    const condition = data.weatherCondition || {};
    const description = condition.description || {};
    const conditionType = (condition.type || 'clear').toUpperCase();

    return {
      condition_text: description.text,
      icon_url: `https://maps.gstatic.com/weather/v1/${conditionType.toLowerCase()}`,
      temperature_c: data.temperature?.degrees,
      apparent_temperature_c: data.feelsLikeTemperature?.degrees,
      dew_point_c: data.dewPoint?.degrees,
      heat_index_c: data.heatIndex?.degrees,
      wind_chill_c: data.windChill?.degrees,
      humidity_percent: data.relativeHumidity,
      uv_index: data.uvIndex,
      pressure_mbar: data.airPressure?.meanSeaLevelMillibars,
      wind_direction: data.wind?.direction?.degrees,
      wind_cardinal: data.wind?.direction?.cardinal,
      wind_speed_kmh: data.wind?.speed?.value,
      wind_gust_kmh: data.wind?.gust?.value,
      visibility_km: data.visibility?.distance,
      cloud_cover: data.cloudCover,
      thunder_probability: data.thunderstormProbability,
      precipitation_mm: data.precipitation?.qpf?.quantity,
      rain_probability: data.precipitation?.probability?.percent,
      condition: conditionType
    };
  } catch (e) {
    console.error('[GOOGLE WEATHER ERROR]', lat, lon, e.message);
    return {};
  }
}

module.exports = { getGoogleWeatherData };
