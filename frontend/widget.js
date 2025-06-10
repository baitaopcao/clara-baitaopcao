(function() {
  const widget = document.createElement('div');
  widget.id = 'clara-widget';
  widget.innerHTML = `
    <div id="clara-header">Clara 💬</div>
    <div id="clara-body"></div>
    <input id="clara-input" placeholder="Pergunte algo à Clara...">
  `;
  document.body.append(widget);

  const history = [];

  document.getElementById('clara-input').addEventListener('keydown', async e => {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (!text) return;
      history.push({ role:'user', content: text });
      appendMessage('Você: ' + text);
      e.target.value = '';

      try {
        const res = await fetch('https://clara-baitaopcao-git-main-baita-opcao.vercel.app/api/chat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ history })
        });
        console.log('Resposta da API:', res);

        if (!res.ok) {
          appendMessage(`Erro: resposta do servidor ${res.status}`);
          return;
        }

        const data = await res.json();
        const reply = data.reply || "Desculpa, não entendi direito.";
        history.push({ role:'assistant', content: reply });
        appendMessage('Clara: ' + reply);
      } catch (error) {
        console.error('Erro na requisição:', error);
        appendMessage('Erro na comunicação com a Clara. Tente novamente mais tarde.');
      }
    }
  });

  function appendMessage(msg) {
    const b = document.getElementById('clara-body');
    const p = document.createElement('p');
    p.textContent = msg;
    b.append(p);
    b.scrollTop = b.scrollHeight;
  }
})();
