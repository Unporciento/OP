module.exports = async (req, res) => {
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const prompt = req.body.prompt;
    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('ERROR: GEMINI_API_KEY no encontrada.');
      return res.status(500).json({ error: 'Falta la clave API en el servidor.' });
    }

    // --- ¡ESTE ES EL CAMBIO! ---
    // Volvemos al modelo 'flash', que es el más compatible.
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';

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
          userError += 'Verifique que su API Key sea válida (revísela en Vercel) o no haya excedido el límite.';
      } else {
          userError += 'Error interno de la API de Google.';
      }
      return res.status(response.status).json({ error: userError });
    }

    const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || "No se obtuvo respuesta de la IA.";
    return res.json({ text: text });

  } catch (err) {
    console.error('Error Interno del Servidor:', err.message);
    return res.status(500).json({ error: `Error interno del servidor: ${err.message}` });
  }
}

