const { OpenAI } = require("openai");
const fs = require("fs");

// Configuração com fallback seguro
const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "default_invalid_key",
    timeout: 30000 // 30 segundos
  },
  logFile: "/tmp/chat_errors.log"
};

// Sistema de logging robusto
const logger = {
  log: (message) => {
    console.log(message);
    fs.appendFileSync(config.logFile, `[LOG] ${new Date().toISOString()} ${message}\n`);
  },
  error: (error) => {
    console.error(error);
    fs.appendFileSync(config.logFile, `[ERROR] ${new Date().toISOString()} ${error.stack || error.message}\n`);
  }
};

module.exports = async (req, res) => {
  try {
    logger.log(`Nova requisição: ${req.method} ${req.url}`);
    
    // Verificação do ambiente
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Variável OPENAI_API_KEY não configurada");
    }

    // Processamento do corpo da requisição
    const body = await new Promise((resolve) => {
      let data = "";
      req.on("data", chunk => data += chunk);
      req.on("end", () => resolve(JSON.parse(data || "{}")));
    });

    logger.log(`Corpo recebido: ${JSON.stringify(body)}`);

    // Validação
    if (!Array.isArray(body.history)) {
      return res.status(400).json({ error: "Formato inválido: history deve ser um array" });
    }

    // Chamada à OpenAI
    const openai = new OpenAI(config.openai);
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: body.history,
      temperature: 0.7
    });

    const resposta = completion.choices[0].message.content;
    logger.log(`Resposta gerada: ${resposta.substring(0, 50)}...`);

    return res.json({ reply: resposta });

  } catch (error) {
    logger.error(error);
    
    // Resposta detalhada em desenvolvimento
    const errorResponse = {
      error: "Erro interno",
      requestId: req.headers['x-vercel-id'],
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