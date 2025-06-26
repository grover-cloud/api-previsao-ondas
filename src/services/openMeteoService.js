const axios = require('axios');

const TIMEZONE = 'America/Sao_Paulo';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

function get_wave_data(lat, lon) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,swell_wave_period&timezone=${TIMEZONE}`;
  return axios.get(url)
    .then(response => {
      const data = response.data.hourly;
      return {
        altura_onda_m: data.wave_height[0],
        direcao_onda_deg: data.wave_direction[0],
        periodo_onda_s: data.wave_period[0],
        swell_period_s: data.swell_wave_period[0]
      };
    }).catch(() => ({}));
}

function get_weather_data(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure&timezone=${TIMEZONE}`;
  return axios.get(url)
    .then(response => {
      const current = response.data.current || {};
      return {
        temperatura_ar_c: current.temperature_2m,
        vento_vel_kmh: current.wind_speed_10m,
        vento_dir_deg: current.wind_direction_10m,
        umidade_relativa: current.relative_humidity_2m,
        pressao_superficie: current.surface_pressure
      };
    }).catch(() => ({}));
}

function get_google_weather_data(lat, lon) {
  const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}&location.latitude=${lat}&location.longitude=${lon}`;
  const headers = { 'Content-Type': 'application/json' };

  return axios.get(url, { headers, timeout: 20000 })
    .then(response => {
      const data = response.data;
      const current = Array.isArray(data) ? data[0] || {} : data;
      const condition = current.weatherCondition || {};
      const description = condition.description || {};
      const type = (condition.type || 'clear').toLowerCase();

      return {
        tempo: description.text,
        icone_url: `https://maps.gstatic.com/weather/v1/${type}`,
        temperatura_c: current.temperature?.degrees,
        temperatura_aparente_c: current.feelsLikeTemperature?.degrees,
        ponto_orvalho_c: current.dewPoint?.degrees,
        indice_calor_c: current.heatIndex?.degrees,
        sensacao_termica_c: current.windChill?.degrees,
        umidade_percentual: current.relativeHumidity,
        indice_uv: current.uvIndex,
        pressao_mbar: current.airPressure?.meanSeaLevelMillibars,
        vento_direcao: current.wind?.direction?.degrees,
        vento_cardinal: current.wind?.direction?.cardinal,
        vento_vel_kmh: current.wind?.speed?.value,
        vento_rajada_kmh: current.wind?.gust?.value,
        visibilidade_km: current.visibility?.distance,
        cobertura_nuvens: current.cloudCover,
        chance_trovao: current.thunderstormProbability,
        precipitacao_mm: current.precipitation?.qpf?.quantity,
        probabilidade_chuva: current.precipitation?.probability?.percent,
        condicao: (condition.type || '').toUpperCase()
      };
    }).catch(error => {
      console.error('[GOOGLE WEATHER ERROR]', error.message);
      return {};
    });
}

module.exports = {
  get_wave_data,
  get_weather_data,
  get_google_weather_data
};
