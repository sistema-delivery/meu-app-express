const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const mercadopago = require('mercadopago');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
typeof process.env.MONGO_URI === 'undefined' && console.error('ERRO: variável MONGO_URI não definida.');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado ao MongoDB!'))
.catch(err => {
  console.error('Erro ao conectar no MongoDB:', err);
  process.exit(1);
});

// Configuração do Mercado Pago
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

// Modelo de Usuário
const Usuario = mongoose.model('Usuario', new mongoose.Schema({
  nome: String,
  email: String,
}));

// Rotas de exemplo
app.get('/', (req, res) => {
  res.send('Servidor rodando com Node.js, MongoDB e Mercado Pago!');
});

// CRUD de Usuários
app.post('/usuarios', async (req, res) => {
  const { nome, email } = req.body;
  if (!nome || !email) return res.status(400).json({ message: 'Nome e email são obrigatórios' });
  try {
    const usuario = new Usuario({ nome, email });
    await usuario.save();
    res.status(201).json({ message: 'Usuário criado', usuario });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao salvar usuário', error: err.message });
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar usuários', error: err.message });
  }
});

app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email } = req.body;
  if (!nome || !email) return res.status(400).json({ message: 'Nome e email são obrigatórios' });
  try {
    const usuario = await Usuario.findByIdAndUpdate(id, { nome, email }, { new: true });
    res.json({ message: 'Usuário atualizado', usuario });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar usuário', error: err.message });
  }
});

app.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Usuario.findByIdAndDelete(id);
    res.json({ message: 'Usuário deletado' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar usuário', error: err.message });
  }
});

// Integração Pix via Mercado Pago
app.post('/mp-pix', async (req, res) => {
  const { valor, nome, email } = req.body;
  if (!valor) return res.status(400).json({ message: 'Valor é obrigatório' });

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
    const response = await mercadopago.payment.create(payment_data);
    const tx = response.body.point_of_interaction.transaction_data;

    res.json({
      message: 'Pagamento criado com sucesso!',
      copia_e_cola: tx.qr_code,
      qr_code_base64: `data:image/png;base64,${tx.qr_code_base64}`,
      ticket_url: tx.ticket_url,
      payment: response.body
    });
  } catch (err) {
    console.error('Erro ao criar pagamento Pix:', err);
    res.status(500).json({ message: 'Erro ao criar pagamento Pix', error: err.message });
  }
});

// Webhook Mercado Pago
app.post('/webhook/mp', (req, res) => {
  console.log('Notificação Mercado Pago:', req.body);
  res.sendStatus(200);
});

// Inicia servidor
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
