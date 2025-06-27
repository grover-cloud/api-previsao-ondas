const axios = require("axios");
require("dotenv").config();

const OPEN_METEO_API_URL = "https://marine-api.open-meteo.com/v1/marine";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const getWeatherData = async (latitude, longitude) => {
  try {
    const meteoResponse = await axios.get(OPEN_METEO_API_URL, {
      params: {
        latitude,
        longitude,
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

    const weatherResponse = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude,
        longitude,
        current_weather: true,
        timezone: "America/Sao_Paulo"
      }
    });

    const googleWeatherResponse = await axios.post(`https://weather.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}`, {
      location: {
        latitude,
        longitude,
      }
    });

    const waveData = meteoResponse.data?.hourly || {};
    const currentWeather = weatherResponse.data?.current_weather || {};
    const googleWeather = googleWeatherResponse.data?.currentConditions?.[0] || {};

    return {
      wave: {
        "altura_onda_m": waveData.wave_height?.[0] || null,
        "direcao_onda_graus": waveData.wave_direction?.[0] || null,
        "periodo_onda_s": waveData.wave_period?.[0] || null,
        "altura_vento_onda_m": waveData.wind_wave_height?.[0] || null,
        "direcao_vento_onda_graus": waveData.wind_wave_direction?.[0] || null,
        "periodo_vento_onda_s": waveData.wind_wave_period?.[0] || null,
        "altura_swell_m": waveData.swell_wave_height?.[0] || null,
        "direcao_swell_graus": waveData.swell_wave_direction?.[0] || null,
        "periodo_swell_s": waveData.swell_wave_period?.[0] || null,
        "temperatura_agua_c": waveData.sea_surface_temperature?.[0] || null
      },
      weather: {
        "temperatura_ar_c": currentWeather.temperature || null,
        "vento_vel_kmh": currentWeather.windspeed || null,
        "vento_dir_deg": currentWeather.winddirection || null,
        "umidade_relativa": null,
        "pressao_superficie": null,
      },
      google_weather: googleWeather
    };
  } catch (error) {
    console.error("Erro ao obter dados meteorológicos:", error.message);
    return { error: "Erro ao obter dados meteorológicos." };
  }
};

module.exports = {
  getWeatherData
};
