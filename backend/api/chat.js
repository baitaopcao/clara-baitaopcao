const { OpenAI } = require("openai");
const fs = require("fs");

const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    timeout: 30000
  },
  logFile: "/tmp/chat_errors.log"
};

const logger = {
  log: (message) => {
    console.log(message);
    fs.appendFileSync(config.logFile, `[LOG] ${new Date().toISOString()} ${message}\n`);
  },
  error: (error) => {
    console.error(error.stack || error.message || String(error));
    fs.appendFileSync(config.logFile, `[ERROR] ${new Date().toISOString()} ${error.stack || error.message || String(error)}\n`);
  }
};

module.exports = async (req, res) => {
  // Configuração CORS
  const allowedOrigin = "https://clara-baitaopcao.vercel.app";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responder OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    logger.log(`Nova requisição: ${req.method} ${req.url}`);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Variável OPENAI_API_KEY não configurada");
    }

    const body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => data += chunk);
      req.on("end", () => {
        try {
          resolve(JSON.parse(data || "{}"));
        } catch (e) {
          logger.error("JSON inválido no corpo da requisição: " + e.message);
          reject(e);
        }
      });
      req.on("error", reject);
    });

    logger.log(`Corpo recebido: ${JSON.stringify(body)}`);

    if (!Array.isArray(body.history)) {
      return res.status(400).json({ error: "Formato inválido: history deve ser um array" });
    }

    const openai = new OpenAI(config.openai);
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: body.history,
      temperature: 0.7
    });

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error("Nenhuma resposta da OpenAI");
    }

    const resposta = completion.choices[0].message.content;
    logger.log(`Resposta gerada: ${resposta.substring(0, 50)}...`);

    return res.json({ reply: resposta });

  } catch (error) {
    logger.error(error);

    const errorResponse = {
      error: "Erro interno",
      requestId: req.headers["x-vercel-id"],
      timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV !== "production") {
      errorResponse.details = {
        message: error.message,
        stack: error.stack,
        raw: error
      };
    }

    return res.status(500).json(errorResponse);
  }
};
