const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint to request recommendations from Gemini using server-side key
app.post('/api/calculate', async (req, res) => {
    const { midpoint, selectedPlaceType } = req.body;

    if (!midpoint || !selectedPlaceType) {
        return res.status(400).json({ error: 'Faltam dados obrigatórios (midpoint, selectedPlaceType).' });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        return res.status(500).json({ error: 'Chave API do Gemini não configurada no servidor (.env).' });
    }

    try {
        const prompt = `Você é um guia local inteligente do Brasil.
Encontre e recomende entre 3 e 4 estabelecimentos comerciais reais excelentes e bem avaliados (especialmente do tipo "${selectedPlaceType}") que fiquem no bairro "${midpoint.neighborhood}" na cidade "${midpoint.city}", ou bem próximos à coordenada do ponto médio (Lat: ${midpoint.lat}, Lng: ${midpoint.lng}).
Dê preferência a lugares conhecidos, charmosos ou de fácil acesso.

Retorne APENAS um objeto JSON válido, sem blocos de código markdown ou textos extras, com a lista desses estabelecimentos contendo coordenadas aproximadas próximas a (${midpoint.lat}, ${midpoint.lng}).
Estrutura de resposta obrigatória:
{
  "establishments": [
    {
      "name": "Nome Real do Lugar",
      "type": "Restaurante / Café / Shopping",
      "lat": ${midpoint.lat + 0.001},
      "lng": ${midpoint.lng - 0.001},
      "address": "Endereço completo (Rua, Número, Bairro)",
      "description": "Explicação charmosa de por que este local é ótimo para se encontrar (ambiente, estacionamento, wi-fi, comida etc).",
      "averageRating": 4.6
    }
  ]
}`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.3
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API do Gemini: ${response.status} - ${errorText}`);
        }

        const resData = await response.json();
        const jsonText = resData.candidates[0].content.parts[0].text;
        const result = JSON.parse(jsonText.trim());

        res.json(result);
    } catch (error) {
        console.error('Server Calculation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Fallback to serve index.html for single-page routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
