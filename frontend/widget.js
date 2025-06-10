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
      const text = e.target.value;
      history.push({ role:'user', content: text });
      appendMessage('Você: ' + text);
      e.target.value = '';

      const res = await fetch('https://clara-baitaopcao-git-main-baita-opcao.vercel.app/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ history })
      });

      const { reply } = await res.json();
      history.push({ role:'assistant', content: reply });
      appendMessage('Clara: ' + reply);
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
