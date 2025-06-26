from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
import requests
import os
from dotenv import load_dotenv

# 🔥 Carregar .env
load_dotenv()

# 🔗 Conexão MongoDB
MONGO_URL = os.getenv("MONGO_URL")
if not MONGO_URL:
    MONGO_URL = "mongodb+srv://admin:surf20255@cluster0.nnkjrl1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URL)
db = client["api-surf"]
collection = db["praias"]

# 🚀 Iniciar FastAPI
app = FastAPI(title="Hie Wave API 🌊 - Praias e Previsão")

# 🔓 CORS liberado
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔧 Função serializar MongoDB
def serialize_praia(praia):
    return {
        "id": str(praia["_id"]),
        "nome": praia["nome"],
        "municipio": praia["municipio"],
        "estado": praia["estado"],
        "latitude": praia["latitude"],
        "longitude": praia["longitude"],
        "google_maps": praia["google_maps"],
        "tipo": praia["tipo"],
        "perfil": praia["perfil"],
        "area_aproximada_m2": praia["area_aproximada_m2"],
        "qualidade_agua": praia["qualidade_agua"],
        "salva_vidas": praia["salva_vidas"],
        "fauna_flora": praia["fauna_flora"],
    }

# 🌍 Listar todas as praias
@app.get("/praias")
def get_praias():
    praias = list(collection.find())
    return [serialize_praia(p) for p in praias]

# 🔍 Detalhes de uma praia
@app.get("/praias/{id}")
def get_praia(id: str):
    praia = collection.find_one({"_id": ObjectId(id)})
    if praia:
        return serialize_praia(praia)
    raise HTTPException(status_code=404, detail="Praia não encontrada")

@app.get("/praias/{id}/previsao")
def get_previsao(id: str):
    praia = collection.find_one({"_id": ObjectId(id)})
    if not praia:
        raise HTTPException(status_code=404, detail="Praia não encontrada")

    lat = praia["latitude"]
    lon = praia["longitude"]

    url_marine = (
        f"https://marine-api.open-meteo.com/v1/marine?"
        f"latitude={lat}&longitude={lon}"
        f"&hourly=wave_height,wave_direction,wave_period"
    )

    url_forecast = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure"
    )

    try:
        response_marine = requests.get(url_marine)
        response_forecast = requests.get(url_forecast)

        if response_marine.status_code != 200 or response_forecast.status_code != 200:
            raise HTTPException(status_code=500, detail="Erro na API de previsão externa")

        data_marine = response_marine.json()
        data_forecast = response_forecast.json()

        marine_hour = {k: v[0] for k, v in data_marine.get("hourly", {}).items()}
        forecast_hour = {k: v[0] for k, v in data_forecast.get("hourly", {}).items()}

        previsao = {
            "ondas": {
                "altura_onda_m": marine_hour.get("wave_height"),
                "direcao_onda": marine_hour.get("wave_direction"),
                "periodo_onda_s": marine_hour.get("wave_period")
            },
            "vento": {
                "velocidade_kmh": round(forecast_hour.get("wind_speed_10m", 0) * 3.6, 1) if forecast_hour.get("wind_speed_10m") else None,
                "direcao": forecast_hour.get("wind_direction_10m")
            },
            "clima": {
                "temperatura_ar_c": forecast_hour.get("temperature_2m"),
                "umidade_relativa": forecast_hour.get("relative_humidity_2m"),
                "pressao_superficie": forecast_hour.get("surface_pressure")
            }
        }

        return previsao

    except Exception as e:
        print(f"Erro na previsão: {e}")
        raise HTTPException(status_code=500, detail="Erro na API de previsão")

    url_forecast = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure"
    )

    try:
        response_marine = requests.get(url_marine)
        response_forecast = requests.get(url_forecast)

        if response_marine.status_code != 200 or response_forecast.status_code != 200:
            raise HTTPException(status_code=500, detail="Erro na API de previsão externa")

        data_marine = response_marine.json()
        data_forecast = response_forecast.json()

        marine_hour = {k: v[0] for k, v in data_marine.get("hourly", {}).items()}
        forecast_hour = {k: v[0] for k, v in data_forecast.get("hourly", {}).items()}

        previsao = {
            "ondas": {
                "altura_onda_m": marine_hour.get("wave_height"),
                "direcao_onda": marine_hour.get("wave_direction"),
                "periodo_onda_s": marine_hour.get("wave_period")
            },
            "corrente": {
                "velocidade_corrente_m_s": marine_hour.get("current_speed"),
                "direcao_corrente": marine_hour.get("current_direction")
            },
            "nivel_mar": {
                "sea_level_m": marine_hour.get("sea_level")
            },
            "vento": {
                "velocidade_kmh": round(forecast_hour.get("wind_speed_10m", 0) * 3.6, 1) if forecast_hour.get("wind_speed_10m") else None,
                "direcao": forecast_hour.get("wind_direction_10m")
            },
            "clima": {
                "temperatura_ar_c": forecast_hour.get("temperature_2m"),
                "umidade_relativa": forecast_hour.get("relative_humidity_2m"),
                "pressao_superficie": forecast_hour.get("surface_pressure")
            }
        }

        return previsao

    except Exception as e:
        print(f"Erro na previsão: {e}")
        raise HTTPException(status_code=500, detail="Erro na API de previsão")
