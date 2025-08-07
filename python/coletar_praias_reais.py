import requests
import json
from time import sleep

GOOGLE_API_KEY = "AIzaSyByiDrtIP05T3fIhFWejFgFvhWmjVk5Ju4"
RAIO_METROS = 30000  # raio reduzido para aumentar precisão

# Coordenadas detalhadas ao longo de todo o litoral do Rio Grande do Sul
coordenadas_rio_grande_do_sul = [
    (-32.2070, -52.1690),  # Praia do Cassino
    (-31.5478, -51.4746),  # São José do Norte
    (-31.3472, -51.0463),  # Mostardas
    (-30.6683, -50.2333),  # Tavares
    (-30.1744, -50.2121),  # Imbé
    (-30.2595, -50.2058),  # Capão da Canoa
    (-30.9457, -50.1296),  # Tramandaí
    (-30.8753, -50.0176),  # Torres
    (-29.3416, -49.7153),  # Arroio do Sal
    (-29.6971, -49.9917),  # Capão Novo
    (-29.9853, -50.1290),  # Cidreira
    (-30.2922, -50.2186)   # Balneário Pinhal
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
        r = requests.get(url)
        dados = r.json()
        if dados.get("status") != "OK":
            print(f"❌ Erro na busca: {dados.get('status')}")
            break

        for lugar in dados.get("results", []):
            nome = lugar.get("name")
            location = lugar.get("geometry", {}).get("location", {})
            if nome and location:
                resultados.append({
                    "nome": nome,
                    "latitude": location.get("lat"),
                    "longitude": location.get("lng")
                })

        if "next_page_token" in dados:
            sleep(2)  # Espera exigida pela API
            url = (
                "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                f"?pagetoken={dados['next_page_token']}&key={GOOGLE_API_KEY}"
            )
        else:
            break

    return resultados

def reverse_geocode(lat, lon):
    url = (
        f"https://maps.googleapis.com/maps/api/geocode/json"
        f"?latlng={lat},{lon}&key={GOOGLE_API_KEY}&language=pt-BR"
    )
    r = requests.get(url)
    if r.status_code != 200:
        return "", "", ""
    dados = r.json()
    if dados.get("status") != "OK":
        return "", "", ""

    cidade = estado = bairro = ""
    for comp in dados["results"][0]["address_components"]:
        if "administrative_area_level_2" in comp["types"]:
            cidade = comp["long_name"]
        if "administrative_area_level_1" in comp["types"]:
            estado = comp["short_name"]
        if "sublocality" in comp["types"] or "neighborhood" in comp["types"]:
            bairro = comp["long_name"]

    return cidade, estado, bairro

# Executar busca para todas as coordenadas
praias_dados = []
for lat_base, lon_base in coordenadas_rio_grande_do_sul:
    resultados = buscar_praias_por_places(lat_base, lon_base)
    for praia in resultados:
        lat = praia["latitude"]
        lon = praia["longitude"]
        municipio, estado, bairro = reverse_geocode(lat, lon)

        praia_info = {
            "nome": praia["nome"],
            "bairro": bairro,
            "municipio": municipio,
            "estado": estado,
            "latitude": lat,
            "longitude": lon
        }
        praias_dados.append(praia_info)
        print(f"✅ {praia_info}")
        sleep(0.3)

# Salvar JSON final
with open("praias_rio_grande_do_sul.json", "w", encoding="utf-8") as f:
    json.dump(praias_dados, f, ensure_ascii=False, indent=2)

print(f"\n🎉 Arquivo salvo com {len(praias_dados)} praias do Rio Grande do Sul.")
