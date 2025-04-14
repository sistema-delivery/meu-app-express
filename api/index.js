const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Recupera a URI do MongoDB a partir dos Secrets do Replit
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('ERRO: A variável MONGO_URI não está definida.');
  process.exit(1);
}

// Conectando ao MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado ao MongoDB!'))
.catch((err) => {
  console.error('Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});

// Definir o modelo de Usuário
const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true },
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// Middleware para interpretar JSON
app.use(express.json());

// Rota simples para teste
app.get('/', (req, res) => {
  res.send('Olá, mundo! Seu servidor Node.js está rodando e conectado ao MongoDB.');
});

// Rota POST para criar um novo usuário
app.post('/usuarios', async (req, res) => {
  const { nome, email } = req.body;

  // Verifica se os campos estão preenchidos
  if (!nome || !email) {
    return res.status(400).json({ message: 'Nome e email são obrigatórios' });
  }

  try {
    const novoUsuario = new Usuario({ nome, email });
    await novoUsuario.save();  // Salva no banco de dados
    res.status(201).json({ message: 'Usuário criado com sucesso', usuario: novoUsuario });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar usuário', error });
  }
});

// Inicializando o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
