from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
import requests
import json
import os

app = Flask(__name__)
app.config["MONGO_URI"] = os.getenv("MONGO_URL", "mongodb+srv://admin:surf20255@cluster0.nnkjrl1.mongodb.net/db_praias?retryWrites=true&w=majority&appName=Cluster0")
mongo = PyMongo(app, uri=app.config["MONGO_URI"])
db = mongo.cx.get_database("db_praias")

TIMEZONE = "America/Sao_Paulo"
GOOGLE_API_KEY = "AIzaSyByiDrtIP05T3fIhFWejFgFvhWmjVk5Ju4"

def get_wave_data(lat, lon):
    url = (
        "https://marine-api.open-meteo.com/v1/marine"
        f"?latitude={lat}&longitude={lon}"
        "&hourly=wave_height,wave_direction,wave_period,swell_wave_period"
        f"&timezone={TIMEZONE}"
    )
    try:
        r = requests.get(url)
        data = r.json()
        return {
            "altura_onda_m": data["hourly"]["wave_height"][0],
            "direcao_onda_deg": data["hourly"]["wave_direction"][0],
            "periodo_onda_s": data["hourly"]["wave_period"][0],
            "swell_period_s": data["hourly"]["swell_wave_period"][0]
        }
    except:
        return {}

def get_weather_data(lat, lon):
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure"
        f"&timezone={TIMEZONE}"
    )
    try:
        r = requests.get(url)
        current = r.json().get("current", {})
        return {
            "temperatura_ar_c": current.get("temperature_2m"),
            "vento_vel_kmh": current.get("wind_speed_10m"),
            "vento_dir_deg": current.get("wind_direction_10m"),
            "umidade_relativa": current.get("relative_humidity_2m"),
            "pressao_superficie": current.get("surface_pressure")
        }
    except:
        return {}

def get_google_weather_data(lat, lon):
    try:
        url = (
            f"https://weather.googleapis.com/v1/currentConditions:lookup"
            f"?key={GOOGLE_API_KEY}&location.latitude={lat}&location.longitude={lon}"
        )
        headers = {"Content-Type": "application/json"}
        response = requests.get(url, headers=headers, timeout=20)
        response.raise_for_status()
        data = response.json()

        current = data if isinstance(data, dict) else data[0] if isinstance(data, list) and data else {}

        condition = current.get("weatherCondition", {})
        description = condition.get("description", {})
        condition_type = condition.get("type", "clear").upper()

        return {
            "tempo": description.get("text"),
            "icone_url": f"https://maps.gstatic.com/weather/v1/{condition_type.lower()}",
            "temperatura_c": current.get("temperature", {}).get("degrees"),
            "temperatura_aparente_c": current.get("feelsLikeTemperature", {}).get("degrees"),
            "ponto_orvalho_c": current.get("dewPoint", {}).get("degrees"),
            "indice_calor_c": current.get("heatIndex", {}).get("degrees"),
            "sensacao_termica_c": current.get("windChill", {}).get("degrees"),
            "umidade_percentual": current.get("relativeHumidity"),
            "indice_uv": current.get("uvIndex"),
            "pressao_mbar": current.get("airPressure", {}).get("meanSeaLevelMillibars"),
            "vento_direcao": current.get("wind", {}).get("direction", {}).get("degrees"),
            "vento_cardinal": current.get("wind", {}).get("direction", {}).get("cardinal"),
            "vento_vel_kmh": current.get("wind", {}).get("speed", {}).get("value"),
            "vento_rajada_kmh": current.get("wind", {}).get("gust", {}).get("value"),
            "visibilidade_km": current.get("visibility", {}).get("distance"),
            "cobertura_nuvens": current.get("cloudCover"),
            "chance_trovao": current.get("thunderstormProbability"),
            "precipitacao_mm": current.get("precipitation", {}).get("qpf", {}).get("quantity"),
            "probabilidade_chuva": current.get("precipitation", {}).get("probability", {}).get("percent"),
            "condicao": condition_type
        }
    except Exception as e:
        print(f"[ERRO GOOGLE WEATHER] {lat},{lon} - {e}")
        return {}

@app.route("/beaches/register", methods=["POST"])
def cadastrar_praia():
    dados = request.json
    campos_obrigatorios = ["nome", "bairro", "municipio", "estado", "latitude", "longitude"]

    if not all(campo in dados for campo in campos_obrigatorios):
        return jsonify({"erro": "Campos obrigatórios ausentes."}), 400

    db.praias.insert_one({
        "nome": dados["nome"],
        "bairro": dados["bairro"],
        "municipio": dados["municipio"],
        "estado": dados["estado"].upper(),
        "latitude": dados["latitude"],
        "longitude": dados["longitude"]
    })
    return jsonify({"mensagem": "Praia cadastrada com sucesso."}), 201

@app.route("/beaches/register-all", methods=["POST"])
def cadastrar_varias_praias():
    praias = request.json
    if not isinstance(praias, list):
        return jsonify({"erro": "Envie uma lista de praias."}), 400

    novas = []
    for dados in praias:
        if all(k in dados for k in ["nome", "bairro", "municipio", "estado", "latitude", "longitude"]):
            novas.append({
                "nome": dados["nome"],
                "bairro": dados["bairro"],
                "municipio": dados["municipio"],
                "estado": dados["estado"].upper(),
                "latitude": dados["latitude"],
                "longitude": dados["longitude"]
            })
    if novas:
        db.praias.insert_many(novas)
    return jsonify({"mensagem": f"{len(novas)} praias cadastradas com sucesso."}), 201

@app.route("/beaches", methods=["GET"])
def listar_praias():
    praias = []
    for praia in db.praias.find():
        lat = praia["latitude"]
        lon = praia["longitude"]
        praias.append({
            "nome": praia["nome"],
            "bairro": praia.get("bairro", ""),
            "municipio": praia.get("municipio", ""),
            "estado": praia.get("estado", ""),
            "latitude": lat,
            "longitude": lon,
            "google_maps": f"https://maps.google.com/?q={lat},{lon}",
            "ondas": get_wave_data(lat, lon),
            "clima": get_weather_data(lat, lon),
            "clima_google": get_google_weather_data(lat, lon)
        })
    return jsonify(praias)

@app.route("/beaches/<state>", methods=["GET"])
def listar_por_estado(state):
    praias = []
    for praia in db.praias.find({"estado": state.upper()}):
        lat = praia["latitude"]
        lon = praia["longitude"]
        praias.append({
            "nome": praia["nome"],
            "bairro": praia.get("bairro", ""),
            "municipio": praia.get("municipio", ""),
            "estado": praia.get("estado", ""),
            "latitude": lat,
            "longitude": lon,
            "google_maps": f"https://maps.google.com/?q={lat},{lon}",
            "ondas": get_wave_data(lat, lon),
            "clima": get_weather_data(lat, lon),
            "clima_google": get_google_weather_data(lat, lon)
        })
    return jsonify(praias)

@app.route("/beaches/<state>/<nome>", methods=["GET"])
def buscar_por_estado_nome(state, nome):
    praia = db.praias.find_one({"estado": state.upper(), "nome": nome})
    if not praia:
        return jsonify({"erro": "Praia não encontrada."}), 404

    lat = praia["latitude"]
    lon = praia["longitude"]
    return jsonify({
        "nome": praia["nome"],
        "bairro": praia.get("bairro", ""),
        "municipio": praia.get("municipio", ""),
        "estado": praia.get("estado", ""),
        "latitude": lat,
        "longitude": lon,
        "google_maps": f"https://maps.google.com/?q={lat},{lon}",
        "ondas": get_wave_data(lat, lon),
        "clima": get_weather_data(lat, lon),
        "clima_google": get_google_weather_data(lat, lon)
    })

@app.route("/beach/<nome>/forecast", methods=["GET"])
def previsao_onda_clima(nome):
    praia = db.praias.find_one({"nome": nome})
    if not praia:
        return jsonify({"erro": "Praia não encontrada."}), 404

    lat = praia["latitude"]
    lon = praia["longitude"]
    return jsonify({
        "nome": nome,
        "latitude": lat,
        "longitude": lon,
        "ondas": get_wave_data(lat, lon),
        "clima": get_weather_data(lat, lon),
        "clima_google": get_google_weather_data(lat, lon)
    })

@app.route("/beaches/<nome>", methods=["DELETE"])
def deletar_praia(nome):
    result = db.praias.delete_one({"nome": nome})
    if result.deleted_count == 0:
        return jsonify({"erro": "Praia não encontrada para deletar."}), 404
    return jsonify({"mensagem": "Praia deletada com sucesso."})

if __name__ == "__main__":
    app.run(debug=True)
