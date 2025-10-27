// Importa el SDK de Google Generative AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Handler principal de Vercel (export default)
export default async function handler(request, response) {
  // 1. Asegurarse de que sea un método POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  // 2. Obtener la API Key desde las variables de entorno de Vercel (¡SEGURO!)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return response.status(500).json({ error: 'API Key de Gemini no configurada en Vercel' });
  }

  try {
    // 3. Inicializar Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Usar gemini-pro o gemini-1.5-flash (flash es más rápido)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    // 4. Obtener el prompt del usuario desde el body del fetch
    const { prompt, context } = request.body;
    
    if (!prompt) {
         return response.status(400).json({ error: 'No se recibió ningún prompt' });
    }

    // 5. Crear el prompt completo para la IA
    const fullPrompt = `
      Eres "HeavyDiag AI", un asistente experto en diagnóstico de maquinaria pesada.
      Contexto: El usuario está viendo la categoría "${context || 'General'}".
      Pregunta del usuario: "${prompt}"

      Responde en español y en formato de diagnóstico simple. Si es una falla, estructura tu respuesta usando las siguientes secciones (si aplican):
      - Síntomas: (lista de 3-5 síntomas)
      - Causas Probables: (lista de 3-5 causas)
      - Pasos de Diagnóstico: (lista de 3-5 pasos)
      - Soluciones Recomendadas: (lista de 3-5 soluciones)
      - Alerta de Seguridad: (si es una falla peligrosa)
      
      Si es una pregunta general o una explicación de código, responde de forma clara y concisa.
    `;

    // 6. Generar respuesta
    const result = await model.generateContent(fullPrompt);
    const textResponse = result.response.text();

    // 7. Devolver la respuesta al frontend
    return response.status(200).json({ text: textResponse });

  } catch (error) {
    console.error('Error en la función API de Gemini:', error);
    return response.status(500).json({ error: `Error de la IA: ${error.message}` });
  }
}