import requests
import json
from time import sleep

GOOGLE_API_KEY = "AIzaSyByiDrtIP05T3fIhFWejFgFvhWmjVk5Ju4"
RAIO_METROS = 50000

# Grade de coordenadas para garantir cobertura total do litoral brasileiro
coordenadas_litoral_brasileiro = [
    (-0.034, -51.050), (-0.5, -50.8), (-1.0, -49.8), (-1.4, -48.5), (-2.0, -47.2), (-2.5, -44.3),
    (-2.9, -43.0), (-3.5, -41.9), (-3.7, -39.5), (-3.8, -38.5), (-4.2, -37.2), (-5.0, -36.0),
    (-5.8, -35.2), (-6.5, -34.9), (-7.1, -34.8), (-7.7, -34.9), (-8.0, -34.8), (-9.6, -35.7),
    (-10.9, -37.0), (-12.9, -38.5), (-13.5, -39.5), (-14.2, -39.0), (-15.0, -39.0), (-16.0, -39.0),
    (-17.0, -39.5), (-18.0, -39.5), (-19.0, -39.9), (-20.3, -40.3), (-21.0, -40.5), (-22.0, -41.0),
    (-22.9, -43.1), (-23.3, -44.5), (-23.6, -45.4), (-23.9, -46.2), (-24.5, -46.9), (-25.4, -49.2),
    (-26.0, -48.6), (-27.0, -48.6), (-27.5, -48.5), (-28.5, -48.8), (-29.0, -49.5), (-30.0, -50.0),
    (-30.7, -50.7), (-31.5, -51.0), (-32.0, -52.0)
]

def buscar_praias_por_places(lat, lon, keyword="praia"):
    url = (
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        f"?location={lat},{lon}"
        f"&radius={RAIO_METROS}"
        f"&keyword={keyword}"
        f"&type=natural_feature"
        f"&key={GOOGLE_API_KEY}"
    )

    resultados = []
    while True:
        try:
            r = requests.get(url, timeout=20)
            dados = r.json()
            if dados.get("status") not in ["OK", "ZERO_RESULTS"]:
                print(f"❌ Erro na busca: {dados.get('status')}")
                break

            for lugar in dados.get("results", []):
                nome = lugar.get("name")
                location = lugar.get("geometry", {}).get("location", {})
                if nome and location:
                    praia = {
                        "name": nome,
                        "latitude": location.get("lat"),
                        "longitude": location.get("lng")
                    }
                    if praia not in resultados:
                        resultados.append(praia)

            if "next_page_token" in dados:
                sleep(2)
                url = (
                    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                    f"?pagetoken={dados['next_page_token']}&key={GOOGLE_API_KEY}"
                )
            else:
                break
        except requests.exceptions.RequestException as e:
            print(f"🔴 Erro de conexão na busca de praias: {e}")
            break

    return resultados

def reverse_geocode(lat, lon):
    url = (
        f"https://maps.googleapis.com/maps/api/geocode/json"
        f"?latlng={lat},{lon}&key={GOOGLE_API_KEY}&language=pt-BR"
    )
    try:
        r = requests.get(url, timeout=20)
        if r.status_code != 200:
            return "", "", ""
        dados = r.json()
        if dados.get("status") != "OK" or not dados.get("results"):
            return "", "", ""

        city = state = neighborhood = ""
        for result in dados["results"]:
            for comp in result["address_components"]:
                types = comp.get("types", [])
                if "administrative_area_level_2" in types and not city:
                    city = comp["long_name"]
                elif "administrative_area_level_1" in types and not state:
                    state = comp["short_name"]
                elif any(t in types for t in ["sublocality", "neighborhood"]):
                    if not neighborhood:
                        neighborhood = comp["long_name"]
            if city and state:
                break

        return city, state, neighborhood
    except requests.exceptions.RequestException as e:
        print(f"🔴 Erro de conexão no reverse geocode: {e}")
        return "", "", ""

def tem_dados_meteo_validos(lat, lon):
    url = (
        "https://marine-api.open-meteo.com/v1/marine"
        f"?latitude={lat}&longitude={lon}"
        f"&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature"
        f"&timezone=America/Sao_Paulo&forecast_days=1"
    )
    try:
        r = requests.get(url, timeout=10)
        data = r.json()
        keys = ["wave_height", "wave_direction", "wave_period", "sea_surface_temperature"]
        if "hourly" not in data:
            return False
        return all(
            key in data["hourly"] and len(data["hourly"][key]) > 0 for key in keys
        )
    except:
        return False

# Executar busca para todas as coordenadas
praias_dados = []
coordenadas_vistas = set()

for lat_base, lon_base in coordenadas_litoral_brasileiro:
    resultados = buscar_praias_por_places(lat_base, lon_base)
    for praia in resultados:
        lat = praia["latitude"]
        lon = praia["longitude"]
        key = f"{lat:.5f},{lon:.5f}"
        if key in coordenadas_vistas:
            continue
        coordenadas_vistas.add(key)

        city, state, neighborhood = reverse_geocode(lat, lon)

        if not city or not state or not neighborhood:
            continue  # ignora se faltar dados relevantes

        if not tem_dados_meteo_validos(lat, lon):
            continue  # ignora se não tiver dados do open-meteo

        praia_info = {
            "name": praia["name"],
            "neighborhood": neighborhood,
            "city": city,
            "state": state,
            "latitude": lat,
            "longitude": lon
        }
        praias_dados.append(praia_info)
        print(f"✅ {praia_info}")
        sleep(0.3)

# Salvar JSON final
with open("praias_brasil.json", "w", encoding="utf-8") as f:
    json.dump(praias_dados, f, ensure_ascii=False, indent=2)

print(f"\n🎉 Arquivo salvo com {len(praias_dados)} praias do litoral brasileiro.")
