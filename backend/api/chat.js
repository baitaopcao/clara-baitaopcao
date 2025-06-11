const { OpenAI } = require("openai");

// Carregue os dados com fallback seguro
let knowledge = { intro: "", faq: [], contact: {}, products: [] };
try {
  knowledge = require("../datos.json");
} catch (e) {
  console.warn("⚠️ Não foi possível carregar datos.json, usando dados padrão");
}

// Configure a OpenAI com timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15000 // 15 segundos
});

module.exports = async function handler(req, res) {
  // Configuração robusta de CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    console.log("🔍 Recebendo requisição...");
    
    if (!req.body || !req.body.history) {
      throw new Error("Corpo da requisição inválido");
    }

    const history = Array.isArray(req.body.history) ? req.body.history : [];

    const systemMessage = {
      role: "system",
      content: `Você é a Clara, assistente virtual da Baita Opção.
      Responda de forma amigável e objetiva.
      Informações da loja: ${JSON.stringify(knowcraft)}`
    };

    const messages = [systemMessage, ...history];
    console.log("📤 Enviando para OpenAI:", JSON.stringify(messages, null, 2));

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const resposta = completion.choices[0]?.message?.content;
    console.log("✅ Resposta recebida:", resposta);

    return res.status(200).json({ reply: resposta });
    
  } catch (error) {
    console.error("💥 ERRO CRÍTICO:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({ 
      error: "Desculpe, Clara está temporariamente indisponível",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};