const { OpenAI } = require("openai");
const knowledge = require("../datos.json");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async function handler(req, res) {
  // 🔧 Permitir CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 🔧 Tratar requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  const { history } = req.body;

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
    ...history
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
    });

    res.status(200).json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("Erro no Chat:", err);
    res.status(500).json({ error: "Erro no chat da Clara." });
  }
};
