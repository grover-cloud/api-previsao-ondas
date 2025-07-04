const axios = require("axios");
require("dotenv").config();

const TIMEZONE = "America/Sao_Paulo";

const getWeatherData = async (lat, lon) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure&timezone=${TIMEZONE}`;

    const response = await axios.get(url);
    const current = response.data?.current || {};

    return {
      air_temperature_c: current.temperature_2m ?? null,
      wind_speed_kmh: current.wind_speed_10m ?? null,
      wind_direction_deg: current.wind_direction_10m ?? null,
      humidity_percent: current.relative_humidity_2m ?? null,
      surface_pressure: current.surface_pressure ?? null,
    };
  } catch (error) {
    console.error('[Erro ao buscar dados do Open-Meteo]', error.message);
    return { error: 'Erro ao obter dados meteorológicos.' };
  }
};

module.exports = { getWeatherData };
