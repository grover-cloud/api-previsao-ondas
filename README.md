# API de Previsão de Ondas e Clima do Brasil

Esta API fornece dados completos de **ondas, clima e clima Google** de praias do Brasil, usando:
- [Open-Meteo Marine](https://open-meteo.com)
- [Open-Meteo Forecast](https://open-meteo.com)
- Google Weather API (não oficial)
- Banco de dados MongoDB com cadastro de praias

---

## Como rodar localmente

```bash
# Instalar dependências
npm install

# Criar arquivo .env com:
MONGO_URL= sua conexão Mongo Atlas
PORT=3000
GOOGLE_API_KEY= sua chave do Google Weather

# Iniciar local
npm start
```

---

## Endpoints disponíveis

### Praia
| Método | Rota | Descrição |
|--------|------|------------|
| `GET` | `/beaches` | Lista todas as praias cadastradas com dados completos (clima, ondas, Google Weather). |
| `GET` | `/beaches/:state` | Lista todas as praias de um estado específico. |
| `GET` | `/beaches/:state/:name` | Retorna os dados completos de uma praia específica. |
| `GET` | `/beach/:name/forecast` | Retorna somente as previsões (ondas, clima e clima_google). |
| `POST` | `/beaches/register` | Cadastra uma nova praia |
| `POST` | `/beaches/register-all` | Cadastro em lote (bulk insert) |
| `DELETE` | `/beaches/:name` | Deleta uma praia por nome |


---

## Exemplo de resposta JSON
```json
{
  "name": "Praia da Joaquina",
  "neighborhood": "Lagoa da Conceição",
  "city": "Florianópolis",
  "state": "SC",
  "latitude": -27.6293577,
  "longitude": -48.4490173,
  "google_maps": "https://maps.google.com/?q=-27.6293577,-48.4490173",
  "forecast": [
    {
      "time": "2025-08-05T06:00:00Z",
      "wave_height_m": 0.5,
      "wave_period_s": 6.2,
      "sea_surface_temperature_c": 19.3,
      "air_temperature_c": 18.2,
      "wind_speed_kmh": 12.1,
      "wind_direction_deg": 120,
      "wave_direction_deg": 140
    }
  ],
  "google_weather": {
    "tempo": "Parcialmente nublado",
    "icone_url": "https://maps.gstatic.com/weather/v1/partly_cloudy",
    "temperatura_c": 23,
    "vento_vel_kmh": 12
  }
}
```

---

## Tecnologias Utilizadas

- Node.js
- Express
- Axios
- Mongoose
- MongoDB Atlas
- Google Weather API
- Open-Meteo
- Dotenv

---

## Produção

Disponível via [Render.com](https://api-previsao-ondas.onrender.com/)

---

Desenvolvido por **Guilherme Pires Rover** | Projeto: Hie Wave 
