const { getHourlyForecast } = require('../services/forecastService');

function average(nums) {
  const valid = nums.filter(n => typeof n === 'number');
  if (!valid.length) return null;
  const sum = valid.reduce((acc, n) => acc + n, 0);
  return Number((sum / valid.length).toFixed(1));
}

function averageDirection(degs) {
  const valid = degs.filter(d => typeof d === 'number');
  if (!valid.length) return null;
  const sinSum = valid.reduce((acc, d) => acc + Math.sin(d * Math.PI / 180), 0);
  const cosSum = valid.reduce((acc, d) => acc + Math.cos(d * Math.PI / 180), 0);
  const angle = Math.atan2(sinSum / valid.length, cosSum / valid.length) * 180 / Math.PI;
  return (angle + 360) % 360;
}

async function formatBeach(beach) {
  const lat = beach.latitude;
  const lon = beach.longitude;
  const raw = await getHourlyForecast(lat, lon);

  const forecast = raw.map(r => ({
    time: r.time,
    wave_height_m: r.wave_height_m,
    wave_period_s: r.wave_period_s,
    sea_surface_temperature_c: r.sea_surface_temperature_c,
    air_temperature_c: r.air_temperature_c,
    wind_speed_kmh: r.wind_speed_kmh
  }));

  const marine = {
    wave_direction_deg: averageDirection(raw.map(r => r.wave_direction_deg)),
    wave_height_m: average(raw.map(r => r.wave_height_m)),
    wave_period_s: average(raw.map(r => r.wave_period_s)),
    sea_surface_temperature_c: average(raw.map(r => r.sea_surface_temperature_c))
  };

  const wind = {
    wind_direction_deg: averageDirection(raw.map(r => r.wind_direction_deg)),
    wind_speed_kmh: average(raw.map(r => r.wind_speed_kmh))
  };

  const meta = {
    name: beach.name,
    state: beach.state,
    latitude: lat,
    longitude: lon
  };

  return { forecast, marine, wind, meta };
}

module.exports = { formatBeach };
