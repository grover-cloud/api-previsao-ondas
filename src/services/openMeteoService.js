const axios = require("axios");
require("dotenv").config();

const OPEN_METEO_API_URL = "https://marine-api.open-meteo.com/v1/marine";

const getWeatherData = async (lat, lon) => {
  try {
    console.log("[INFO] Buscando dados para:", lat, lon);

    const meteoResponse = await axios.get(OPEN_METEO_API_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: [
          "wave_height",
          "wave_direction",
          "wave_period",
          "wind_wave_height",
          "wind_wave_direction",
          "wind_wave_period",
          "swell_wave_height",
          "swell_wave_direction",
          "swell_wave_period",
          "sea_surface_temperature"
        ].join(","),
        timezone: "America/Sao_Paulo"
      }
    });

    console.log("[OK] Open-Meteo Marine carregado com sucesso");

    const weatherResponse = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: ["temperature_2m", "relative_humidity_2m", "surface_pressure", "wind_speed_10m", "wind_direction_10m"].join(","),
        timezone: "America/Sao_Paulo"
      }
    });

    console.log("[OK] Open-Meteo Forecast carregado com sucesso");

    const waveData = meteoResponse.data?.hourly || {};
    const currentWeather = weatherResponse.data?.hourly || {};

    return {
      wave_height_m: waveData.wave_height?.[0] || null,
      wave_direction_deg: waveData.wave_direction?.[0] || null,
      wave_period_s: waveData.wave_period?.[0] || null,
      wind_wave_height_m: waveData.wind_wave_height?.[0] || null,
      wind_wave_direction_deg: waveData.wind_wave_direction?.[0] || null,
      wind_wave_period_s: waveData.wind_wave_period?.[0] || null,
      swell_height_m: waveData.swell_wave_height?.[0] || null,
      swell_direction_deg: waveData.swell_wave_direction?.[0] || null,
      swell_period_s: waveData.swell_wave_period?.[0] || null,
      sea_surface_temperature_c: waveData.sea_surface_temperature?.[0] || null,
      air_temperature_c: currentWeather.temperature_2m?.[0] || null,
      wind_speed_kmh: currentWeather.wind_speed_10m?.[0] ? parseFloat((currentWeather.wind_speed_10m[0] * 3.6).toFixed(1)) : null,
      wind_direction_deg: currentWeather.wind_direction_10m?.[0] || null,
      humidity_percent: currentWeather.relative_humidity_2m?.[0] || null,
      surface_pressure: currentWeather.surface_pressure?.[0] || null
    };
  } catch (error) {
    console.error("[ERRO getWeatherData]", error);
    return { error: "Erro ao obter dados meteorológicos." };
  }
};

module.exports = {
  getWeatherData
};
