const { OpenAI } = require("openai");
const knowledge = require("../datos.json");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async function handler(req, res) {
  const { history } = req.body;

  const systemPrompt = `
Você é a Clara, assistente virtual da loja Baita Opção.
Fale de forma informal, amigável, e ajude os clientes com dúvidas sobre os produtos, frete, trocas e mais.
Aqui estão informações importantes sobre a loja:
${knowledge.intro}
FAQ:
${knowledge.faq}
Contatos:
${knowledge.contact}
Produtos:
${knowledge.products}
  `;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history
  ];

  try {
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
