const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

const Usuario = mongoose.model('Usuario', new mongoose.Schema({
  nome: String,
  email: String,
}));

app.get('/', (req, res) => {
  res.send('Olá, mundo! Seu servidor Node.js está rodando e conectado ao MongoDB.');
});

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

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
