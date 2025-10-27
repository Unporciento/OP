// 1. Usar sintaxis CommonJS (require) para compatibilidad con Vercel Node.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 2. Obtener la API Key (esto es seguro, Vercel lo inyecta)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 3. (LA CORRECCIÓN MÁS IMPORTANTE)
// Inicializar el cliente, forzando la API 'v1' que es donde vive 'gemini-pro'
let genAI;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY, { apiVersion: 'v1' }); 
} else {
  console.error('Error: GEMINI_API_KEY no está configurada en Vercel.');
}

// 4. Asegurarse de que el modelo sea 'gemini-pro'
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;

// 5. Usar 'module.exports' en lugar de 'export default' para CJS
module.exports = async (request, response) => {
  
  // 6. Verificar que sea POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  // 7. Verificar que la API Key y el modelo se cargaron
  if (!GEMINI_API_KEY || !model) {
    return response.status(500).json({ error: 'API Key de Gemini no configurada o modelo no inicializado' });
  }

  try {
    // 8. Obtener datos del body
    const { prompt, context } = request.body;
    
    if (!prompt) {
         return response.status(400).json({ error: 'No se recibió ningún prompt' });
    }

    // 9. Prompt mejorado (más directivo)
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

    // 10. Generar respuesta
    const result = await model.generateContent(fullPrompt);
    const textResponse = result.response.text();

    // 11. Devolver la respuesta al frontend
    return response.status(200).json({ text: textResponse });

  } catch (error) {
    console.error('Error en la función API de Gemini:', error);
    // Devolver un error más detallado al frontend para depuración
    return response.status(500).json({ 
        error: `Error de la IA: ${error.message}`,
        details: error.toString() 
    });
  }
};
