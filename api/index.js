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
// Certifique-se de ter configurado a variável MP_ACCESS_TOKEN na Vercel (ou outro ambiente) com seu Access Token do Mercado Pago.
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

// Rotas para gerenciamento de usuários
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

// Integração com Mercado Pago para criar pagamento via Pix
app.post('/mp-pix', async (req, res) => {
  const { valor, nome, email } = req.body;
  if (!valor) {
    return res.status(400).json({ message: 'Valor é obrigatório' });
  }

  const payment_data = {
    transaction_amount: valor,
    description: "Cobrança via Pix",
    payment_method_id: "pix", // Especifica o método Pix
    payer: {
      email: email || "cliente@example.com",
      first_name: nome || "Cliente"
    }
  };

  try {
    const paymentResponse = await mercadopago.payment.create(payment_data);
    const transactionData = paymentResponse.body.point_of_interaction.transaction_data;
    
    res.json({
      message: 'Pagamento criado com sucesso!',
      pix: {
        qr_code_base64: transactionData.qr_code_base64,
        copy_and_paste: transactionData.copy_and_paste
      },
      payment: paymentResponse.body,
    });
  } catch (err) {
    console.error('Erro ao criar pagamento no Mercado Pago:', err);
    res.status(500).json({ message: 'Erro ao criar pagamento', error: err.message });
  }
});

// Endpoint de Webhook para receber notificações do Mercado Pago
app.post('/webhook/mp', (req, res) => {
  const notificacao = req.body;
  console.log("Notificação recebida do Mercado Pago:", notificacao);
  // Aqui você pode implementar lógica para atualizar o status do pagamento, se necessário.
  res.status(200).send("Notificação recebida");
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
