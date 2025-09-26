import os
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv

# Load .env from project root and server directory
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-1.5-flash')

# Simple price baselines in INR/kg (approx; will be adjusted by AI or randomness)
BASE_PRICES = {
    'rice': 35,
    'wheat': 25,
    'potato': 20,
    'corn': 28,
    'maize': 28,
    'tea': 250
}

@app.route('/api/mentor', methods=['POST'])
def mentor():
    data = request.json or {}
    # Strict validation
    question = data.get('question')
    if not isinstance(question, str) or not question.strip():
        question = 'Give sustainable farming advice for alluvial soil today.'
    context = data.get('context', {})
    if not isinstance(context, dict):
        context = {}
    # If no API key, return heuristic advice
    if not GEMINI_API_KEY:
        return jsonify({
            'answer': (
                'Tip: Prioritize natural fertilizers (compost, green manure), maintain pH 6.0–7.0, '
                'use drip irrigation to conserve groundwater, and rotate crops (e.g., legumes) '
                'to restore soil health. Monitor weather; pause fertilizer before heavy rain.'
            )
        })

    # If key exists, call Gemini via REST
    try:
        prompt = (
            "You are a sustainable farming mentor. Soil: {soil}. Params: {params}. "
            "Practices: {practices}. Weather: {weather}. "
            "Give concise, practical advice (3-5 sentences)."
        ).format(
            soil=context.get('soil', 'alluvial'),
            params=context.get('params', {}),
            practices=context.get('practices', {}),
            weather=context.get('params', {}).get('weather', 'normal')
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [
                {"parts": [{"text": question + "\n\n" + prompt}]}
            ]
        }
        resp = requests.post(url, json=payload, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        answer = (
            data.get('candidates', [{}])[0]
                .get('content', {})
                .get('parts', [{}])[0]
                .get('text', '')
        )
        if not answer:
            answer = 'Use compost and mulching; adjust irrigation to maintain optimal moisture and prevent runoff.'
        return jsonify({'answer': answer})
    except Exception:
        return jsonify({'answer': 'Use compost and mulching; adjust irrigation to maintain optimal moisture and prevent runoff.'})

@app.route('/api/probability', methods=['POST'])
def probability():
    data = request.json or {}
    crop = data.get('crop')
    if not isinstance(crop, str) or not crop:
        return jsonify({'error': 'Invalid crop parameter'}), 400
    soil = data.get('soil', 'alluvial')
    if soil not in ['alluvial', 'mountain']:
        return jsonify({'error': 'Invalid soil parameter'}), 400
    params = data.get('params', {})
    if not isinstance(params, dict):
        params = {}
    practices = set([str(p) for p in data.get('practices', []) if isinstance(p, str)])
    # Normalize practice keys (support camelCase and hyphen-case)
    has_mulching = ('mulching' in practices)
    has_drip = ('drip-irrigation' in practices) or ('dripIrrigation' in practices)
    has_compost = ('compost' in practices)
    has_excess_chem = ('excess-chemical-fertilizer' in practices) or ('excessChemicalFertilizer' in practices)

    # Heuristic model: start from compatibility and adjust by parameters/practices
    base = 0.55 if soil in ['alluvial', 'mountain'] else 0.45
    compatible = {
        'alluvial': {'rice', 'wheat', 'maize', 'potato'},
        'mountain': {'tea', 'wheat', 'potato'}
    }
    if soil in compatible and crop in compatible[soil]:
        base += 0.15
    else:
        base -= 0.15

    ph = params.get('ph', 6.5)
    if not isinstance(ph, (int, float)) or not (3.5 <= ph <= 9.0):
        ph = 6.5
    soil_health = params.get('soilHealth', 0.7)
    if not isinstance(soil_health, (int, float)) or not (0.0 <= soil_health <= 1.0):
        soil_health = 0.7
    groundwater = params.get('groundwater', 0.6)
    if not isinstance(groundwater, (int, float)) or not (0.0 <= groundwater <= 1.0):
        groundwater = 0.6
    weather = params.get('weather', 'normal')
    if weather not in ['normal', 'drought', 'flood', 'hail']:
        weather = 'normal'

    # pH sweet spot 6.0-7.0
    if 6.0 <= ph <= 7.0:
        base += 0.1
    else:
        base -= 0.1

    # Soil health
    base += (soil_health - 0.5) * 0.3

    # Groundwater moderate
    base += (0.6 - abs(groundwater - 0.6)) * 0.2 - 0.06

    # Weather adversity
    if weather in ['drought', 'flood', 'hail']:
        base -= 0.15

    # Practices
    if has_mulching:
        base += 0.05
    if has_drip:
        base += 0.07
    if has_compost:
        base += 0.07
    if has_excess_chem:
        base -= 0.2

    prob = max(0.0, min(1.0, base))
    return jsonify({'probability': prob})

@app.route('/api/prices', methods=['POST'])
def prices():
    data = request.json or {}
    crops = data.get('crops', list(BASE_PRICES.keys()))
    if not isinstance(crops, list) or not all(isinstance(c, str) for c in crops):
        crops = list(BASE_PRICES.keys())
    price_map = {}
    for c in crops:
        base = BASE_PRICES.get(c, 20)
        # +/- 10% daily fluctuation plus small random jitter
        fluct = base * random.uniform(-0.1, 0.1)
        jitter = random.uniform(-1.5, 1.5)
        price_map[c] = max(1, round(base + fluct + jitter, 2))
    return jsonify({'prices': price_map})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001)
