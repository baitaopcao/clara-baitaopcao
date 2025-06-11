const { OpenAI } = require("openai");

module.exports = async (req, res) => {
  // Configuração CORS para seu domínio
  const allowedOrigin = "https://clara-baitaopcao.vercel.app";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Resposta rápida para preflight CORS
    return res.status(204).end();
  }

  try {
    console.log("Nova requisição:", req.method, req.url);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Variável OPENAI_API_KEY não configurada");
    }

    // Leitura do corpo da requisição
    const body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => data += chunk);
      req.on("end", () => {
        try {
          console.log("Corpo raw recebido:", data);
          resolve(JSON.parse(data || "{}"));
        } catch (e) {
          console.error("Erro ao parsear JSON:", e.message);
          reject(e);
        }
      });
      req.on("error", reject);
    });

    if (!Array.isArray(body.history)) {
      return res.status(400).json({ error: "Formato inválido: history deve ser um array" });
    }

    // Configura o cliente OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000
    });

    // Chamada para gerar resposta
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: body.history,
      temperature: 0.7
    });

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error("Nenhuma resposta da OpenAI");
    }

    const resposta = completion.choices[0].message.content;
    console.log("Resposta gerada:", resposta.substring(0, 50));

    return res.json({ reply: resposta });

  } catch (error) {
    console.error("Erro no backend:", error);

    if (error.statusCode === 429) {
      return res.status(429).json({
        error: "Quota da API OpenAI excedida. Aguarde ou atualize seu plano."
      });
    }

    return res.status(500).json({
      error: "Erro interno",
      message: error.message,
      // só envia stack no ambiente dev para não vazar info em produção
      ...(process.env.NODE_ENV !== "production" && { stack: error.stack })
    });
  }
};
