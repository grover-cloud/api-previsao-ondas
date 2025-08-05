const axios = require('axios');
require('dotenv').config();

const TIMEZONE = 'America/Sao_Paulo';

const getHourlyForecast = async (lat, lon) => {
  try {
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature&timezone=${TIMEZONE}`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m&windspeed_unit=kmh&timezone=${TIMEZONE}`;

    const [marineRes, weatherRes] = await Promise.all([
      axios.get(marineUrl),
      axios.get(weatherUrl)
    ]);

    const marine = marineRes.data?.hourly || {};
    const weather = weatherRes.data?.hourly || {};
    const times = marine.time || weather.time || [];

    const forecast = times.map((t, idx) => {
      const time = new Date(t).toISOString();
      const waveHeight = marine.wave_height?.[idx];
      const wavePeriod = marine.wave_period?.[idx];
      const waveDirection = marine.wave_direction?.[idx];
      const seaTemp = marine.sea_surface_temperature?.[idx];
      const airTemp = weather.temperature_2m?.[idx];
      const windSpeed = weather.wind_speed_10m?.[idx];
      const windDirection = weather.wind_direction_10m?.[idx];
      return {
        time,
        wave_height_m: waveHeight != null ? Number(waveHeight.toFixed(1)) : null,
        wave_period_s: wavePeriod != null ? Number(wavePeriod.toFixed(1)) : null,
        sea_surface_temperature_c: seaTemp != null ? Number(seaTemp.toFixed(1)) : null,
        air_temperature_c: airTemp != null ? Number(airTemp.toFixed(1)) : null,
        wind_speed_kmh: windSpeed != null ? Number(windSpeed.toFixed(1)) : null,
        wind_direction_deg: windDirection != null ? Math.round(windDirection) : null,
        wave_direction_deg: waveDirection != null ? Math.round(waveDirection) : null,
      };
    }).slice(0, 24);

    return forecast;
  } catch (error) {
    console.error('[Erro ao buscar dados de previsão]', error.message);
    return [];
  }
};

module.exports = { getHourlyForecast };
