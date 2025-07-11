from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
import requests
import json
import os

app = Flask(__name__)
app.config["MONGO_URI"] = os.getenv("MONGO_URL", "mongodb+srv://admin:surf20255@cluster0.nnkjrl1.mongodb.net/db_praias?retryWrites=true&w=majority&appName=Cluster0")
mongo = PyMongo(app, uri=app.config["MONGO_URI"])
db = mongo.cx.get_database("test")

TIMEZONE = "America/Sao_Paulo"
GOOGLE_API_KEY = "AIzaSyByiDrtIP05T3fIhFWejFgFvhWmjVk5Ju4"

def get_wave_data(lat, lon):
    url = (
        "https://marine-api.open-meteo.com/v1/marine"
        f"?latitude={lat}&longitude={lon}"
        "&hourly=wave_height,wave_direction,wave_period,swell_wave_period,sea_surface_temperature"
        f"&timezone={TIMEZONE}"
    )
    try:
        r = requests.get(url)
        data = r.json()
        return {
            "wave_height_m": data["hourly"].get("wave_height", [None])[0],
            "wave_direction_deg": data["hourly"].get("wave_direction", [None])[0],
            "wave_period_s": data["hourly"].get("wave_period", [None])[0],
            "swell_period_s": data["hourly"].get("swell_wave_period", [None])[0],
            "sea_surface_temperature_c": data["hourly"].get("sea_surface_temperature", [None])[0]
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
            "air_temperature_c": current.get("temperature_2m"),
            "wind_speed_kmh": current.get("wind_speed_10m"),
            "wind_direction_deg": current.get("wind_direction_10m"),
            "humidity_percent": current.get("relative_humidity_2m"),
            "surface_pressure": current.get("surface_pressure")
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
            "condition_text": description.get("text"),
            "icon_url": f"https://maps.gstatic.com/weather/v1/{condition_type.lower()}",
            "temperature_c": current.get("temperature", {}).get("degrees"),
            "apparent_temperature_c": current.get("feelsLikeTemperature", {}).get("degrees"),
            "dew_point_c": current.get("dewPoint", {}).get("degrees"),
            "heat_index_c": current.get("heatIndex", {}).get("degrees"),
            "wind_chill_c": current.get("windChill", {}).get("degrees"),
            "humidity_percent": current.get("relativeHumidity"),
            "uv_index": current.get("uvIndex"),
            "pressure_mbar": current.get("airPressure", {}).get("meanSeaLevelMillibars"),
            "wind_direction": current.get("wind", {}).get("direction", {}).get("degrees"),
            "wind_cardinal": current.get("wind", {}).get("direction", {}).get("cardinal"),
            "wind_speed_kmh": current.get("wind", {}).get("speed", {}).get("value"),
            "wind_gust_kmh": current.get("wind", {}).get("gust", {}).get("value"),
            "visibility_km": current.get("visibility", {}).get("distance"),
            "cloud_cover": current.get("cloudCover"),
            "thunder_probability": current.get("thunderstormProbability"),
            "precipitation_mm": current.get("precipitation", {}).get("qpf", {}).get("quantity"),
            "rain_probability": current.get("precipitation", {}).get("probability", {}).get("percent"),
            "condition": condition_type
        }
    except Exception as e:
        print(f"[GOOGLE WEATHER ERROR] {lat},{lon} - {e}")
        return {}

@app.route("/beaches/register", methods=["POST"])
def register_beach():
    data = request.json
    required_fields = ["name", "neighborhood", "city", "state", "latitude", "longitude"]

    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields."}), 400

    db.beaches.insert_one({
        "name": data["name"],
        "neighborhood": data["neighborhood"],
        "city": data["city"],
        "state": data["state"].upper(),
        "latitude": data["latitude"],
        "longitude": data["longitude"]
    })
    return jsonify({"message": "Beach successfully registered."}), 201

@app.route("/beaches/register-all", methods=["POST"])
def register_many_beaches():
    beaches = request.json
    if not isinstance(beaches, list):
        return jsonify({"error": "Send a list of beaches."}), 400

    new_beaches = []
    for data in beaches:
        if all(k in data for k in ["name", "neighborhood", "city", "state", "latitude", "longitude"]):
            new_beaches.append({
                "name": data["name"],
                "neighborhood": data["neighborhood"],
                "city": data["city"],
                "state": data["state"].upper(),
                "latitude": data["latitude"],
                "longitude": data["longitude"]
            })
    if new_beaches:
        db.beaches.insert_many(new_beaches)
    return jsonify({"message": f"{len(new_beaches)} beaches successfully registered."}), 201

@app.route("/beaches", methods=["GET"])
def list_beaches():
    result = []
    for beach in db.beaches.find():
        lat = beach["latitude"]
        lon = beach["longitude"]
        result.append({
            "name": beach["name"],
            "neighborhood": beach.get("neighborhood", ""),
            "city": beach.get("city", ""),
            "state": beach.get("state", ""),
            "latitude": lat,
            "longitude": lon,
            "google_maps": f"https://maps.google.com/?q={lat},{lon}",
            "waves": get_wave_data(lat, lon),
            "weather": get_weather_data(lat, lon),
            "google_weather": get_google_weather_data(lat, lon)
        })
    return jsonify(result)

@app.route("/beaches/<state>", methods=["GET"])
def list_by_state(state):
    result = []
    for beach in db.beaches.find({"state": state.upper()}):
        lat = beach["latitude"]
        lon = beach["longitude"]
        result.append({
            "name": beach["name"],
            "neighborhood": beach.get("neighborhood", ""),
            "city": beach.get("city", ""),
            "state": beach.get("state", ""),
            "latitude": lat,
            "longitude": lon,
            "google_maps": f"https://maps.google.com/?q={lat},{lon}",
            "waves": get_wave_data(lat, lon),
            "weather": get_weather_data(lat, lon),
            "google_weather": get_google_weather_data(lat, lon)
        })
    return jsonify(result)

@app.route("/beaches/<state>/<name>", methods=["GET"])
def find_by_state_and_name(state, name):
    beach = db.beaches.find_one({"state": state.upper(), "name": name})
    if not beach:
        return jsonify({"error": "Beach not found."}), 404

    lat = beach["latitude"]
    lon = beach["longitude"]
    return jsonify({
        "name": beach["name"],
        "neighborhood": beach.get("neighborhood", ""),
        "city": beach.get("city", ""),
        "state": beach.get("state", ""),
        "latitude": lat,
        "longitude": lon,
        "google_maps": f"https://maps.google.com/?q={lat},{lon}",
        "waves": get_wave_data(lat, lon),
        "weather": get_weather_data(lat, lon),
        "google_weather": get_google_weather_data(lat, lon)
    })

@app.route("/beach/<name>/forecast", methods=["GET"])
def forecast_by_name(name):
    beach = db.beaches.find_one({"name": name})
    if not beach:
        return jsonify({"error": "Beach not found."}), 404

    lat = beach["latitude"]
    lon = beach["longitude"]
    return jsonify({
        "name": name,
        "latitude": lat,
        "longitude": lon,
        "waves": get_wave_data(lat, lon),
        "weather": get_weather_data(lat, lon),
        "google_weather": get_google_weather_data(lat, lon)
    })

@app.route("/beaches/<name>", methods=["DELETE"])
def delete_beach(name):
    result = db.beaches.delete_one({"name": name})
    if result.deleted_count == 0:
        return jsonify({"error": "Beach not found to delete."}), 404
    return jsonify({"message": "Beach successfully deleted."})

if __name__ == "__main__":
    app.run(debug=True)
