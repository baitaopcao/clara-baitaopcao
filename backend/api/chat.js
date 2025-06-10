const { OpenAI } = require("openai");
const knowledge = require("../datos.json");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async function handler(req, res) {
  // Garante que a requisição é POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const body = req.body;

    if (!body || !body.history) {
      return res.status(400).json({ error: "Corpo da requisição inválido. 'history' é obrigatório." });
    }

    const { history } = body;

    const systemPrompt = `
Você é a Clara, assistente virtual da loja Baita Opção.
Fale de forma informal, amigável, e ajude os clientes com dúvidas sobre os produtos, frete, trocas e mais.
Aqui estão informações importantes sobre a loja:
${knowledge.intro}
FAQ:
${JSON.stringify(knowledge.faq, null, 2)}
Contatos:
${JSON.stringify(knowledge.contact, null, 2)}
Produtos:
${JSON.stringify(knowledge.products || [], null, 2)}
    `;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("Erro no Chat:", err);
    res.status(500).json({ error: "Erro no chat da Clara." });
  }
};
