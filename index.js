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

// Middleware para interpretar JSON
app.use(express.json());

// Rota simples para teste
app.get('/', (req, res) => {
  res.send('Olá, mundo! Seu servidor Node.js está rodando e conectado ao MongoDB.');
});

// Inicializando o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
