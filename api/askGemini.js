// Importa el SDK de Google Generative AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Usar 'module.exports' para compatibilidad con Vercel Node.js
module.exports = async (request, response) => {
  
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  // Obtener la API Key (esto es seguro, Vercel lo inyecta)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // Verificar la API Key primero
  if (!GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY no está configurada en Vercel.');
    return response.status(500).json({ 
      error: 'Error de la IA: La API Key de Gemini no está configurada en el servidor.',
      details: 'El administrador debe configurar la variable de entorno GEMINI_API_KEY en Vercel.'
    });
  }

  try {
    // --- INICIALIZACIÓN MOVILIDA AQUÍ DENTRO ---
    // Inicializar el cliente, forzando la API 'v1' que es donde vive 'gemini-pro'
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY, { apiVersion: 'v1' }); 
    
    // Asegurarse de que el modelo sea 'gemini-pro'
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    // --- FIN DE LA INICIALIZACIÓN ---

    const { prompt, context } = request.body;
    
    if (!prompt) {
         return response.status(400).json({ error: 'No se recibió ningún prompt' });
    }

    const fullPrompt = `
      Eres "HeavyDiag AI", un asistente experto en diagnóstico de maquinaria pesada.
      Tu única tarea es responder preguntas sobre fallas mecánicas, eléctricas o hidráulicas.
      Contexto de maquinaria: "${context || 'Maquinaria General'}".
      Pregunta del usuario: "${prompt}"

      Responde en español.
      Si la pregunta es sobre una falla (ej. "motor con agua", "frenos ruidosos"), DEBES estructurar tu respuesta EXACTAMENTE así, usando Markdown (**) para los títulos:

      **Síntomas:**
      * (Síntoma 1)
      * (Síntoma 2)
      * (Síntoma 3+)

      **Causas Probables:**
      * (Causa 1)
      * (Causa 2)
      * (Causa 3+)

      **Pasos de Diagnóstico:**
      1. (Paso 1)
      2. (Paso 2)
      3. (Paso 3+)

      **Soluciones Recomendadas:**
      1. (Solución 1)
      2. (Solución 2)
      3. (Solución 3+)

      **Alerta de Seguridad:**
      (Una advertencia de seguridad si es una falla peligrosa, o "Ninguna alerta específica" si no lo es.)
      
      Si es una pregunta para explicar un código, explica qué hace cada parte y si ves un error.
      Si es una pregunta general, responde de forma clara y concisa.
    `;

    const result = await model.generateContent(fullPrompt);
    const textResponse = result.response.text();

    return response.status(200).json({ text: textResponse });

  } catch (error) {
    console.error('Error en la función API de Gemini:', error);
    return response.status(500).json({ 
        error: `Error de la IA: ${error.message}`,
        details: error.toString() 
    });
  }
};
