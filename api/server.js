const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const cors = require('cors'); // Necesario para Vercel

// Cargar variables de entorno (Vercel las manejará de forma segura)
dotenv.config();

const app = express();

// Habilitar CORS para que la app web pueda llamar a esta API
app.use(cors()); 
app.use(express.json());

// Esta es la función principal que Vercel ejecutará
const handler = async (req, res) => {
  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    // Acceder a la variable de entorno de Vercel
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('ERROR: GEMINI_API_KEY no encontrada.');
      return res.status(500).json({ error: 'Falta la clave API en el servidor.' });
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

    const body = {
      "contents": [{ "parts": [{ "text": prompt }] }],
      "config": {
          "maxOutputTokens": 800
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify(body)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', response.status, responseData);
      let userError = `Error ${response.status} de la API. `;
      if (response.status === 400 || response.status === 403 || response.status === 429) {
          userError += 'Verifique que su API Key sea válida, tenga permisos para el modelo "pro" o que no haya excedido el límite de uso.';
      } else {
          userError += 'Error interno de la API de Google.';
      }
      return res.status(response.status).json({ error: userError });
    }

    const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || "No se obtuvo respuesta de la IA.";
    return res.json({ text: text });

  } catch (err) {
    console.error('Error de Conexión o Servidor Interno:', err.message);
    return res.status(500).json({ error: 'Error de Conexión: No se pudo contactar el servidor.' });
  }
};

// Vercel usará esta ruta: /api/server
app.post('/api/server', handler);

// Exportar la app para Vercel
module.exports = app;
