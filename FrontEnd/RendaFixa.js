document.getElementById('simulador-renda-fixa').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const produto = form.produto.value;
    const valor_inicial = parseFloat(form.valor_inicial.value);
    const prazo_anos = parseInt(form.prazo.value);
    const aporte_mensal = parseFloat(form.aporte_mensal.value);

    const taxas = {
        cdb_cdi: 0.135,
        lci_lca: 0.128,
        tesouro_selic: 0.1275,
        tesouro_ipca: 0.065,
        tesouro_prefixado: 0.115
    };
    const taxa_ano = taxas[produto];
    const taxa_mes = Math.pow(1 + taxa_ano, 1/12) - 1;
    const meses = prazo_anos * 12;

    let montante = valor_inicial * Math.pow(1 + taxa_mes, meses);
    if (aporte_mensal > 0) {
        montante += aporte_mensal * ((Math.pow(1 + taxa_mes, meses) - 1) / taxa_mes);
    }

    document.getElementById('resultado-simulacao').textContent =
        `Valor final estimado: R$ ${montante.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`;

    // Envia para o backend
    fetch('http://localhost:5000/registrar_simulacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            produto,
            valor_inicial,
            prazo: prazo_anos,
            aporte_mensal,
            resultado: montante
        })
    })
    .then(res => res.json())
    .then(data => console.log('Simulação salva:', data))
    .catch(err => console.error('Erro ao salvar simulação:', err));
});

// Adicione este código ao final do seu RendaFixa.js

document.getElementById('gerar-analise-ia').addEventListener('click', async function() {
    const produto = document.querySelector('[name="produto"]').value;
    const valor_inicial = parseFloat(document.querySelector('[name="valor_inicial"]').value);
    const prazo = parseInt(document.querySelector('[name="prazo"]').value);
    const aporte_mensal = parseFloat(document.querySelector('[name="aporte_mensal"]').value);
    const resultado = document.getElementById('resultado-simulacao').textContent;

    // Array com todas as opções de investimento
    const taxas = {
        cdb_cdi: 0.135,
        lci_lca: 0.128,
        tesouro_selic: 0.1275,
        tesouro_ipca: 0.065,
        tesouro_prefixado: 0.115
    };
    const prazo_anos = prazo;
    const meses = prazo_anos * 12;
    const opcoesInvestimento = Object.entries(taxas).map(([nome, taxa_ano]) => {
        const taxa_mes = Math.pow(1 + taxa_ano, 1/12) - 1;
        let montante = valor_inicial * Math.pow(1 + taxa_mes, meses);
        if (aporte_mensal > 0) {
            montante += aporte_mensal * ((Math.pow(1 + taxa_mes, meses) - 1) / taxa_mes);
        }
        return {
            produto: nome,
            valor_inicial,
            prazo: prazo_anos,
            aporte_mensal,
            taxa_ano,
            resultado: montante
        };
    });

    const simulacao = {
        produto,
        valor_inicial,
        prazo,
        aporte_mensal,
        resultado
    };

    // Chame a API da OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Você é um analista financeiro.' },
                { role: 'user', content: `Analise esta simulação de investimento: ${JSON.stringify(simulacao)}. Outras opções disponíveis: ${JSON.stringify(opcoesInvestimento)}` }
            ]
        })
    }).then(res => res.json());

    const respostaIA = openaiResponse.choices[0].message.content;
    document.getElementById('analise-ia').textContent = respostaIA;
});

document.getElementById('chat-ia-send').addEventListener('click', async function() {
    const input = document.getElementById('chat-ia-input');
    const msg = input.value.trim();
    if (!msg) return;

    const chatBox = document.getElementById('chat-ia-messages');
    chatBox.innerHTML += `<div style="text-align:right;"><strong>Você:</strong> ${msg}</div>`;
    input.value = '';

    // Dados da simulação atual
    const produto = document.querySelector('[name="produto"]').value;
    const valor_inicial = parseFloat(document.querySelector('[name="valor_inicial"]').value);
    const prazo = parseInt(document.querySelector('[name="prazo"]').value);
    const aporte_mensal = parseFloat(document.querySelector('[name="aporte_mensal"]').value);
    const resultado = document.getElementById('resultado-simulacao').textContent;

    const simulacao = {
        produto,
        valor_inicial,
        prazo,
        aporte_mensal,
        resultado
    };

    // Array com todas as opções de investimento
    const taxas = {
        cdb_cdi: 0.135,
        lci_lca: 0.128,
        tesouro_selic: 0.1275,
        tesouro_ipca: 0.065,
        tesouro_prefixado: 0.115
    };
    const prazo_anos = prazo;
    const meses = prazo_anos * 12;
    const opcoesInvestimento = Object.entries(taxas).map(([nome, taxa_ano]) => {
        const taxa_mes = Math.pow(1 + taxa_ano, 1/12) - 1;
        let montante = valor_inicial * Math.pow(1 + taxa_mes, meses);
        if (aporte_mensal > 0) {
            montante += aporte_mensal * ((Math.pow(1 + taxa_mes, meses) - 1) / taxa_mes);
        }
        return {
            produto: nome,
            valor_inicial,
            prazo: prazo_anos,
            aporte_mensal,
            taxa_ano,
            resultado: montante
        };
    });

    // Prompt enriquecido para a IA
    const prompt = `Minha simulação de investimento: ${JSON.stringify(simulacao)}. Outras opções disponíveis: ${JSON.stringify(opcoesInvestimento)}.
    Você está conversando com alguém que não sabe absolutamente nada sobre investimentos, portanto evite termos muito técnicos e seja claro na explicação. Minha dúvida: ${msg}`;

    // Chama a OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Você é um assistente financeiro.' },
                { role: 'user', content: prompt }
            ]
        })
    }).then(res => res.json());

    const resposta = openaiResponse.choices[0].message.content;
    chatBox.innerHTML += `<div style="text-align:left;"><strong>IA:</strong> ${resposta}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
});