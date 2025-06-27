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
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
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
        "name": praia["nome"],
        "neighborhood": praia["bairro"],
        "city": praia["municipio"],
        "state": praia["estado"],
        "latitude": praia["latitude"],
        "longitude": praia["longitude"]
    }

@app.get("/beaches")
def listar_todas():
    praias = list(collection.find())
    return [serialize_praia(p) for p in praias]

@app.get("/beaches/{estado}")
def listar_por_estado(estado: str):
    praias = list(collection.find({"estado": estado.upper()}))
    return [serialize_praia(p) for p in praias]

@app.get("/beaches/{estado}/{nome}")
def praia_estado_nome(estado: str, nome: str):
    praia = collection.find_one({"estado": estado.upper(), "nome": nome})
    if not praia:
        raise HTTPException(status_code=404, detail="Praia não encontrada")
    return serialize_praia(praia)

@app.get("/beach/{nome}/forecast")
def previsao_simples(nome: str):
    praia = collection.find_one({"nome": nome})
    if not praia:
        raise HTTPException(status_code=404, detail="Praia não encontrada")

    lat = praia["latitude"]
    lon = praia["longitude"]

    url_marine = (
        f"https://marine-api.open-meteo.com/v1/marine?"
        f"latitude={lat}&longitude={lon}"
        f"&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature"
    )

    url_forecast = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure"
    )

    url_google = (
        f"https://weather.googleapis.com/v1/currentConditions:lookup?key={GOOGLE_API_KEY}"
    )

    try:
        r1 = requests.get(url_marine)
        r2 = requests.get(url_forecast)
        r3 = requests.post(url_google, json={"location": {"latitude": lat, "longitude": lon}})

        d1 = r1.json().get("hourly", {})
        d2 = r2.json().get("hourly", {})
        d3 = r3.json().get("currentConditions", [{}])[0]

        return {
            "ondas": {
                "altura_onda_m": d1.get("wave_height", [None])[0],
                "direcao_onda": d1.get("wave_direction", [None])[0],
                "periodo_onda_s": d1.get("wave_period", [None])[0],
                "temperatura_agua_c": d1.get("sea_surface_temperature", [None])[0],
            },
            "clima": {
                "temperatura_ar_c": d2.get("temperature_2m", [None])[0],
                "umidade_relativa": d2.get("relative_humidity_2m", [None])[0],
                "vento_kmh": round(d2.get("wind_speed_10m", [0])[0] * 3.6, 1),
                "direcao_vento": d2.get("wind_direction_10m", [None])[0],
                "pressao_superficie": d2.get("surface_pressure", [None])[0]
            },
            "google_weather": d3
        }

    except Exception as e:
        print("Erro:", e)
        raise HTTPException(status_code=500, detail="Erro na API externa")

@app.post("/beaches/register")
def cadastrar_praia(data: dict):
    obrigatorios = ["nome", "bairro", "municipio", "estado", "latitude", "longitude"]
    if not all(k in data for k in obrigatorios):
        raise HTTPException(status_code=400, detail="Campos obrigatórios ausentes")

    collection.insert_one(data)
    return {"mensagem": "Praia cadastrada com sucesso"}

@app.post("/beaches/register-all")
def cadastrar_lote(lista: list):
    collection.insert_many(lista)
    return {"mensagem": f"{len(lista)} praias inseridas com sucesso"}

@app.delete("/beaches/{nome}")
def deletar_praia(nome: str):
    res = collection.delete_one({"nome": nome})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Praia não encontrada para exclusão")
    return {"mensagem": "Praia removida com sucesso"}
