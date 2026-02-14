// 1. Importação dos Pacotes
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet'); // Segurança adicional
const morgan = require('morgan'); // Logs de requisição
const sequelize = require('./config/connection'); //

// 2. Configuração Inicial
dotenv.config(); //
const app = express();
const PORT = process.env.PORT || 8080; //

// 3. Conexão com Banco de Dados (Sequelize)
async function testarConexao() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexão com o MySQL estabelecida com sucesso.'); //
        
        // Em ambiente de desenvolvimento, você pode usar sync aqui se necessário
        // await sequelize.sync(); 

    } catch (error) {
        console.error('❌ Erro crítico: Não foi possível conectar ao banco de dados:', error);
        process.exit(1); // Encerra o processo se o banco falhar
    }
}
testarConexao();

// 4. Middlewares Globais
app.use(helmet({ crossOriginResourcePolicy: false })); // Permite carregar fotos no frontend
app.use(cors()); //
app.use(morgan('dev')); // Logs no console: GET /api/... 200
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
})); //
app.use(express.urlencoded({ extended: true })); //

// 5. Arquivos Estáticos (Uploads)
// Centralizado em uma única rota para evitar redundância
app.use('/api/uploads', (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('🖼️ Acessando arquivo:', req.url);
    }
    next();
}, express.static(path.join(__dirname, 'uploads'))); //

// 6. Definição das Rotas da API
app.get('/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime() });
});

// Agrupamento de rotas para melhor legibilidade
const apiRouter = express.Router();

apiRouter.use('/auth', require('./routes/authRoutes'));
apiRouter.use('/federacoes', require('./routes/federacaoRoutes'));
apiRouter.use('/academias', require('./routes/academiaRoutes'));
apiRouter.use('/atletas', require('./routes/atletaRoutes'));
apiRouter.use('/modalidades', require('./routes/modalidadeRoutes'));
apiRouter.use('/graduacoes', require('./routes/graduacaoRoutes'));
apiRouter.use('/filiacoes', require('./routes/filiacaoRoutes'));
apiRouter.use('/documentos', require('./routes/documentoRoutes'));
apiRouter.use('/metodos-pagamento', require('./routes/metodoPagamentoRoutes'));
apiRouter.use('/noticias', require('./routes/noticiaRoutes'));
apiRouter.use('/usuarios', require('./routes/usuarioRoutes'));
apiRouter.use('/pagamentos', require('./routes/pagamentoRoutes'));

app.use('/api', apiRouter); // Todas as rotas agora prefixadas com /api

// 7. Middleware de Tratamento de Erros (Deve ser o último)
app.use((err, req, res, next) => {
    console.error('❌ Erro na requisição:', err.stack);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Erro interno no servidor'
    });
});

// 8. Iniciando o Servidor
const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor CONFBEC rodando na porta ${PORT}`); //
});

// Gerenciamento de encerramento (Graceful Shutdown)
process.on('SIGTERM', () => {
    console.log('Encerrando servidor...');
    server.close(() => {
        sequelize.close();
        console.log('Conexões encerradas.');
    });
});