const axios = require("axios");

const TIMEZONE = "UTC";

const toNumber = (value) => {
  return value === undefined || value === null ? null : Number(value.toFixed(1));
};

const getHourlyForecast = async (lat, lon, hours = 24) => {
  try {
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature&timezone=${TIMEZONE}&timeformat=iso8601`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m&timezone=${TIMEZONE}&timeformat=iso8601`;

    const [marineResp, weatherResp] = await Promise.all([
      axios.get(marineUrl),
      axios.get(weatherUrl),
    ]);

    const marine = marineResp.data?.hourly || {};
    const weather = weatherResp.data?.hourly || {};
    const times = marine.time || weather.time || [];

    return times.slice(0, hours).map((time, index) => ({
      time,
      wave_height_m: toNumber(marine.wave_height?.[index]),
      wave_period_s: toNumber(marine.wave_period?.[index]),
      wave_direction_deg: toNumber(marine.wave_direction?.[index]),
      sea_surface_temperature_c: toNumber(marine.sea_surface_temperature?.[index]),
      air_temperature_c: toNumber(weather.temperature_2m?.[index]),
      wind_speed_kmh: toNumber(weather.wind_speed_10m?.[index]),
      wind_direction_deg: toNumber(weather.wind_direction_10m?.[index]),
    }));
  } catch (error) {
    console.error('[Erro ao buscar dados de previsão horária]', error.message);
    return [];
  }
};

module.exports = { getHourlyForecast };
