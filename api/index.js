### `server.js` (API completa com Pix + copia&amp;cola)
```js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const mercadopago = require('mercadopago');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error('ERRO: A variável MONGO_URI não está definida.');
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado ao MongoDB!'))
.catch((err) => {
  console.error('Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});

// Configuração do Mercado Pago
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

// Modelo simples para "usuarios"
const Usuario = mongoose.model('Usuario', new mongoose.Schema({
  nome: String,
  email: String,
}));

// Rota GET básica
app.get('/', (req, res) => {
  res.send('Olá, mundo! Seu servidor Node.js está rodando e conectado ao MongoDB.');
});

// CRUD de usuários
app.post('/usuarios', async (req, res) => {
  const { nome, email } = req.body;
  if (!nome || !email) {
    return res.status(400).json({ message: 'Nome e email são obrigatórios' });
  }
  try {
    const novoUsuario = new Usuario({ nome, email });
    await novoUsuario.save();
    res.status(201).json({ message: 'Usuário criado com sucesso', usuario: novoUsuario });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao salvar o usuário', error: err.message });
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: err.message });
  }
});

app.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Usuario.findByIdAndDelete(id);
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar usuário', error: err.message });
  }
});

app.put('/usuarios/:id', async (req, res) => {
  const { nome, email } = req.body;
  const { id } = req.params;
  if (!nome || !email) {
    return res.status(400).json({ message: 'Nome e email são obrigatórios' });
  }
  try {
    const usuarioAtualizado = await Usuario.findByIdAndUpdate(
      id,
      { nome, email },
      { new: true }
    );
    res.json({ message: 'Usuário atualizado com sucesso', usuario: usuarioAtualizado });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar usuário', error: err.message });
  }
});

// Integração Pix via Mercado Pago
app.post('/mp-pix', async (req, res) => {
  const { valor, nome, email } = req.body;
  if (!valor) {
    return res.status(400).json({ message: 'Valor é obrigatório' });
  }

  const payment_data = {
    transaction_amount: valor,
    description: "Cobrança via Pix",
    payment_method_id: "pix",
    payer: {
      email: email || "cliente@example.com",
      first_name: nome || "Cliente"
    }
  };

  try {
    const paymentResponse = await mercadopago.payment.create(payment_data);
    const { point_of_interaction } = paymentResponse.body;
    const copiaECola = point_of_interaction.transaction_data.qr_code;

    res.json({
      message: 'Pagamento criado com sucesso!',
      pix: {
        ...point_of_interaction,
        copia_e_cola: copiaECola
      },
      payment: paymentResponse.body,
    });
  } catch (err) {
    console.error('Erro ao criar pagamento no Mercado Pago:', err);
    res.status(500).json({ message: 'Erro ao criar pagamento', error: err.message });
  }
});

// Webhook do Mercado Pago
app.post('/webhook/mp', (req, res) => {
  console.log("Notificação recebida do Mercado Pago:", req.body);
  res.status(200).send("Notificação recebida");
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
```

---

### `test.html` (Para testar localmente via navegador)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teste PIX - Pizza Express</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 2rem auto; }
    input, button { width: 100%; padding: 0.5rem; margin: 0.5rem 0; }
    img { display: block; margin: 1rem auto; }
    pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Teste PIX</h1>
  <form id="pixForm">
    <input type="number" id="valor" placeholder="Valor (por ex. 50.00)" step="0.01" required />
    <input type="text" id="nome" placeholder="Nome do cliente" />
    <input type="email" id="email" placeholder="Email do cliente" />
    <button type="submit">Gerar cob.</button>
  </form>
  <div id="resultado">
    <!-- QR Code e copia&cola serão exibidos aqui -->
  </div>

  <script>
    const form = document.getElementById('pixForm');
    const resultado = document.getElementById('resultado');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      resultado.innerHTML = 'Carregando...';
      const valor = document.getElementById('valor').value;
      const nome = document.getElementById('nome').value;
      const email = document.getElementById('email').value;

      try {
        const res = await fetch('http://localhost:3000/mp-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: parseFloat(valor), nome, email })
        });
        const data = await res.json();
        if (res.ok) {
          const qrBase64 = data.pix.qr_code_base64;
          const copiaECola = data.pix.copia_e_cola;
          resultado.innerHTML = `
            <h2>QR Code:</h2>
            <img src="data:image/png;base64,${qrBase64}" alt="QR Code Pix" />
            <h2>Cópia & Cola:</h2>
            <pre>${copiaECola}</pre>
          `;
        } else {
          resultado.textContent = data.message || 'Erro ao gerar cobrança';
        }
      } catch (err) {
        resultado.textContent = 'Erro de conexão';
        console.error(err);
      }
    });
  </script>
</body>
</html>
```

