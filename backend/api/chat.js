const { OpenAI } = require("openai");
const knowledge = require("../datos.json");

// Verifica se a variável de ambiente está definida
if (!process.env.OPENAI_API_KEY) {
  console.error("ERRO: OPENAI_API_KEY não está definida.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {
  try {
    const { history } = req.body;

    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: "Histórico inválido" });
    }

    console.log("Recebido history:", history);

    const systemPrompt = `
Você é a Clara, assistente virtual da loja Baita Opção.
Fale de forma informal, amigável, e ajude os clientes com dúvidas sobre produtos, frete, trocas e mais.

Informações da loja:
${knowledge.intro}

FAQ:
${JSON.stringify(knowledge.faq, null, 2)}

Contatos:
${JSON.stringify(knowledge.contact, null, 2)}
    `;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages
    });

    const resposta = completion.choices[0].message.content;
    console.log("Resposta da Clara:", resposta);

    res.json({ reply: resposta });
  } catch (err) {
    console.error("Erro no Chat:", err);
    res.status(500).json({
      error: err.message || "Erro no chat da Clara."
    });
  }
};
