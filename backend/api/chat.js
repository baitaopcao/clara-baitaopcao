const { OpenAI } = require("openai");
const knowledge = require("../datos.json");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  let history = [];
  try {
    if (!req.body) throw new Error("Requisição sem body");
    history = Array.isArray(req.body.history) ? req.body.history : [];
  } catch (err) {
    console.error("Erro no body:", err);
    return res.status(400).json({ error: "Body inválido ou ausente" });
  }

  const systemPrompt = `
Você é a Clara, assistente virtual da loja Baita Opção.
Fale de forma informal, amigável, e ajude os clientes com dúvidas sobre os produtos, frete, trocas e mais.
Aqui estão informações importantes sobre a loja:
${knowledge.intro}
FAQ:
${JSON.stringify(knowledge.faq)}
Contatos:
${JSON.stringify(knowledge.contact)}
Produtos:
${JSON.stringify(knowledge.products || [])}
  `;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
    });

    return res.status(200).json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("Erro no Chat:", err);
    return res.status(500).json({ error: "Erro no chat da Clara." });
  }
};
