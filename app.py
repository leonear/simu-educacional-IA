from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Permite requisições do frontend

API_KEY = '2MGVHUGG469EE96C'

@app.route('/acao', methods=['GET'])
def acao():
    simbolo = request.args.get('simbolo')
    url = (
        f'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={simbolo}&apikey={API_KEY}'
    )
    resposta = requests.get(url)
    dados = resposta.json()

    # Processa os dados para extrair informações relevantes
    if 'Time Series (Daily)' not in dados:
        erro_msg = (
            dados.get('Note')
            or dados.get('Error Message')
            or 'Ação não encontrada ou limite da API atingido.'
        )
        print('Erro Alpha Vantage:', dados)  # Loga a resposta para debug
        return jsonify({'erro': erro_msg}), 404

    series = dados['Time Series (Daily)']
    datas = sorted(series.keys(), reverse=True)
    preco_atual = float(series[datas[0]]['4. close'])
    precos = [float(series[data]['4. close']) for data in datas]
    max_12m = max(precos)
    min_12m = min(precos)
    media_12m = sum(precos) / len(precos)
    volume = int(series[datas[0]]['5. volume'])
    variacao = preco_atual - precos[-1]
    margem_seguranca = round(max_12m - preco_atual, 2)
    risco = round((max_12m - min_12m) / media_12m, 2)
    recomendacao = 'COMPRAR' if preco_atual < media_12m else 'AGUARDAR'

    # Buscar nome da empresa
    url_overview = (
        f'https://www.alphavantage.co/query?function=OVERVIEW&symbol={simbolo}&apikey={API_KEY}'
    )
    resposta_overview = requests.get(url_overview)
    dados_overview = resposta_overview.json()
    nome_empresa = dados_overview.get('Name', simbolo)

    datas_grafico = datas[:180][::-1]  # últimos 180 dias, ordem crescente
    precos_grafico = [float(series[data]['4. close']) for data in datas_grafico]

    return jsonify({
        'nome_empresa': nome_empresa,
        'sigla': simbolo,
        'preco_atual': preco_atual,
        'max_12m': max_12m,
        'min_12m': min_12m,
        'media_12m': round(media_12m, 2),
        'volume': volume,
        'variacao': round(variacao, 2),
        'margem_seguranca': margem_seguranca,
        'risco': risco,
        'recomendacao': recomendacao,
        'datas_grafico': datas_grafico,
        'precos_grafico': precos_grafico
    })


#Simulador renda fixa

ARQUIVO = 'simulacoes.json'

def carregar_simulacoes():
    if not os.path.exists(ARQUIVO):
        return []
    try:
        with open(ARQUIVO, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, ValueError):
        return []

def salvar_simulacao(simulacao):
    simulacoes = carregar_simulacoes()
    simulacoes.append(simulacao)
    with open(ARQUIVO, 'w') as f:
        json.dump(simulacoes, f, indent=2)

@app.route('/registrar_simulacao', methods=['POST'])
def registrar_simulacao():
    dados = request.json
    dados['timestamp'] = datetime.now().isoformat()
    salvar_simulacao(dados)
    return jsonify({'status': 'ok'})

@app.route('/historico_simulacoes', methods=['GET'])
def historico_simulacoes():
    return jsonify(carregar_simulacoes())

if __name__ == '__main__':
    app.run(debug=True)