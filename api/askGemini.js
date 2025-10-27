// Importa el SDK de Google Generative AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Obtener la API Key desde las variables de entorno de Vercel
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Inicializar el cliente correctamente (sin apiVersion)
let genAI;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
  console.error("Error: GEMINI_API_KEY no está configurada en Vercel.");
}

// Usa el modelo actualizado (ya no existe gemini-pro)
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-pro" }) : null;

// Exportación compatible con Vercel
module.exports = async (request, response) => {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Método no permitido" });
  }

  if (!GEMINI_API_KEY || !model) {
    return response
      .status(500)
      .json({ error: "API Key de Gemini no configurada o modelo no inicializado" });
  }

  try {
    const { prompt, context } = request.body;

    if (!prompt) {
      return response.status(400).json({ error: "No se recibió ningún prompt" });
    }

    const fullPrompt = `
      Eres "HeavyDiag AI", un asistente experto en diagnóstico de maquinaria pesada.
      Contexto: "${context || "Maquinaria General"}".
      Pregunta: "${prompt}"

      Responde en español y con esta estructura:

      **Síntomas:**
      * (Síntoma 1)
      * (Síntoma 2)

      **Causas Probables:**
      * (Causa 1)
      * (Causa 2)

      **Pasos de Diagnóstico:**
      1. (Paso 1)
      2. (Paso 2)

      **Soluciones Recomendadas:**
      1. (Solución 1)
      2. (Solución 2)

      **Alerta de Seguridad:**
      (Advertencia o “Ninguna alerta específica”)
    `;

    const result = await model.generateContent(fullPrompt);
    const textResponse = result.response.text();

    return response.status(200).json({ text: textResponse });
  } catch (error) {
    console.error("Error en la función API de Gemini:", error);
    return response.status(500).json({
      error: `Error de la IA: ${error.message}`,
      details: error.toString(),
    });
  }
};
