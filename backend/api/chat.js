const { OpenAI } = require("openai");
const knowledge = require("../datos.json") || defaultKnowledge;

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 10000
});

// Middleware CORS completo
const setCorsHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
};

module.exports = async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    console.log("📥 Request received:", req.method, req.url);

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    if (!req.body || !Array.isArray(req.body.history)) {
      return res.status(400).json({ error: "Body inválido" });
    }

    const systemPrompt = `Você é a Clara, assistente da Baita Opção (${knowledge.intro}). 
    Responda de forma amigável e objetiva. Dados: ${JSON.stringify(knowledge)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        ...req.body.history
      ]
    });

    return res.status(200).json({ 
      reply: response.choices[0].message.content 
    });

  } catch (err) {
    console.error("💥 ERRO:", {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      error: "Desculpe, Clara está tendo problemas técnicos",
      requestId: req.headers['x-vercel-id'] 
    });
  }
};