const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuração Mercado Pago (defina MP_ACCESS_TOKEN no .env ou no seu ambiente)
if (!process.env.MP_ACCESS_TOKEN) {
  console.error('ERRO: MP_ACCESS_TOKEN não definido.');
  process.exit(1);
}
mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });

// Rota raiz devolvendo HTML + JS
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Teste Pix Local</title>
      <style>
        body { font-family: Arial, sans-serif; max-width:400px; margin:2rem auto; padding:1rem; }
        input, button { width:100%; padding:0.5rem; margin-top:0.5rem; }
        #resultado { display:none; margin-top:1rem; text-align:center; }
        pre { background:#f5f5f5; padding:0.5rem; word-break:break-all; }
      </style>
    </head>
    <body>
      <h1>Gerar Pix</h1>
      <form id="pixForm">
        <input type="number" step="0.01" name="valor" placeholder="Valor (ex:10.50)" required>
        <input type="text" name="nome" placeholder="Nome do pagador">
        <input type="email" name="email" placeholder="Email do pagador">
        <button type="submit">Gerar Pix</button>
      </form>
      <div id="resultado">
        <h2>QR Code</h2>
        <img id="qr" src="" alt="QR Code Pix"><h3>Copia e Cola</h3>
        <pre id="code"></pre>
        <button id="copy">Copiar</button>
      </div>
      <script>
        const form = document.getElementById('pixForm');
        const resDiv = document.getElementById('resultado');
        const qrImg = document.getElementById('qr');
        const codeEl = document.getElementById('code');
        const btnCopy = document.getElementById('copy');

        form.addEventListener('submit', async e => {
          e.preventDefault();
          const fd = new FormData(form);
          const body = { valor: +fd.get('valor'), nome: fd.get('nome'), email: fd.get('email') };
          try {
            const r = await fetch('/mp-pix', {
              method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
            });
            if(!r.ok) throw new Error(r.status);
            const d = await r.json();
            qrImg.src = d.qr_code_base64;
            codeEl.textContent = d.copia_e_cola;
            resDiv.style.display = 'block';
          } catch(err) {
            alert('Erro: '+err);
          }
        });
        btnCopy.addEventListener('click', ()=> navigator.clipboard.writeText(codeEl.textContent));
      </script>
    </body>
    </html>
  `);
});

// Endpoint Pix via Mercado Pago
app.post('/mp-pix', async (req, res) => {
  const { valor, nome, email } = req.body;
  if (!valor) return res.status(400).json({ error: 'Valor obrigatório' });
  try {
    const p = await mercadopago.payment.create({
      transaction_amount: valor,
      description: 'Cobrança Pix',
      payment_method_id: 'pix',
      payer: { email: email||'cliente@ex.com', first_name: nome||'Cliente' }
    });
    const tx = p.body.point_of_interaction.transaction_data;
    res.json({ qr_code_base64:`data:image/png;base64,${tx.qr_code_base64}`, copia_e_cola:tx.qr_code });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => console.log(`Servidor ouvindo em http://localhost:${port}`));
