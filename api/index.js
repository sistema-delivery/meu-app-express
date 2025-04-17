const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const mercadopago = require('mercadopago');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve arquivos estáticos na pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

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

// Modelo simples para 'usuarios'
const Usuario = mongoose.model('Usuario', new mongoose.Schema({
  nome: String,
  email: String,
}));

// Rota GET básica\app.get('/', (req, res) => {
  res.send('Olá! Servidor rodando e conectado ao MongoDB.');
});

// CRUD de usuários (omitido por brevidade)
// ...

// Integração Pix via Mercado Pago
app.post('/mp-pix', async (req, res) => {
  const { valor, nome, email } = req.body;
  if (!valor) {
    return res.status(400).json({ message: 'Valor é obrigatório' });
  }

  const payment_data = {
    transaction_amount: valor,
    description: 'Cobrança via Pix',
    payment_method_id: 'pix',
    payer: {
      email: email || 'cliente@example.com',
      first_name: nome || 'Cliente'
    }
  };

  try {
    const paymentResponse = await mercadopago.payment.create(payment_data);
    const { point_of_interaction } = paymentResponse.body;
    const txData = point_of_interaction.transaction_data;

    // Extrai qr code em Base64 e copia&cola
    const qrBase64   = txData.qr_code_base64;
    const copiaECola = txData.qr_code;

    res.json({
      message: 'Pagamento criado com sucesso!',
      pix: {
        ...point_of_interaction,
        qr_code_base64: qrBase64,
        copia_e_cola: copiaECola
      }
    });
  } catch (err) {
    console.error('Erro ao criar pagamento no Mercado Pago:', err);
    res.status(500).json({ message: 'Erro ao criar pagamento', error: err.message });
  }
});

// Webhook
app.post('/webhook/mp', (req, res) => {
  console.log('Notificação recebida do Mercado Pago:', req.body);
  res.status(200).send('Notificação recebida');
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
