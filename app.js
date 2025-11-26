// Importar o modulo express
const express = require('express');

// Importar modulo fileupload
const fileupload = require('express-fileupload');

// Importar modulo Express-handlebars
const { engine } = require('express-handlebars');

// File System
const fs = require('fs');

// App
const app = express();

// Habilitando upload de arquivos
app.use(fileupload());

// Bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

// CSS
app.use('/css', express.static('./css'));

// Imagens
app.use('/imagens', express.static('./imagens'));

// Pasta PUBLIC (onde está o modelo .glb)
app.use(express.static('public'));
// também expõe a pasta `public` em `/public` para uso de caminhos absolutos em views
app.use('/public', express.static('public'));
// Servir arquivos estáticos dentro de `views` (login.js, script.js, style.css usados pelo index.html)
app.use(express.static('views'));

// Configuração Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Manipulação de dados
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Importar módulo MySQL
const mysql = require('mysql');



// Conexão com banco
const conexao = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'projeto'
});

// Teste conexão
conexao.connect(function (erro) {
    if (erro) throw erro;
    console.log('Conectado ao MySQL!');
});


// =========================
// 🔥 ROTA LOGIN (PÁGINA)
// =========================
app.get('/login', function(req, res){
    // Atualmente o projeto usa um `views/index.html` estático como página de login.
    // Envia o arquivo HTML diretamente para evitar dependência de `login.handlebars` ausente.
    res.sendFile(__dirname + '/views/index.html');
});

// Rota raiz → redireciona para login
app.get('/', function(req, res){
    return res.redirect('/login');
});


// =========================
// 🔥 ROTA QUE VALIDA LOGIN
// =========================
app.post('/login', function(req, res) {
    let email = req.body.email;
    let senha = req.body.senha;

    // Use query parametrizada para evitar SQL injection
    let sql = 'SELECT * FROM usuarios WHERE email = ? AND senha = ? LIMIT 1';

    conexao.query(sql, [email, senha], function(erro, resultado){
        if (erro) {
            console.error(erro);
            if (req.is('application/json')) return res.status(500).json({ ok: false });
            return res.status(500).send('Erro no servidor');
        }

        if (resultado.length > 0) {
            // LOGIN CORRETO → responder conforme o tipo de requisição
            if (req.is('application/json')) {
                return res.json({ ok: true, redirect: '/home' });
            }
            return res.redirect('/home');
        } else {
            // LOGIN ERRADO → Volta com erro (JSON ou HTML)
            if (req.is('application/json')) {
                return res.json({ ok: false });
            }
            return res.sendFile(__dirname + '/views/index.html');
        }
    });
});


// =========================
// 🔥 ROTA HOME (APÓS LOGIN)
// =========================
app.get('/home', function(req, res){
    // pega produtos do banco
    let sql = 'SELECT * FROM produtos';

    conexao.query(sql, function(erro, retorno){
        if (erro) throw erro;

        res.render('home', { produtos: retorno });
    });
});


// =========================
// 🔥 CADASTRAR PRODUTO
// =========================
app.post('/cadastrar', function(req, res) {
    let nome = req.body.nome;
    let valor = req.body.valor;
    // validação simples
    if (!req.files || !req.files.imagem) {
        return res.status(400).send('Imagem é obrigatória');
    }

    let imagem = req.files.imagem.name;

    let sql = 'INSERT INTO produtos (nome, valor, imagem) VALUES (?, ?, ?)';

    conexao.query(sql, [nome, valor, imagem], function (erro) {
        if (erro) {
            console.error(erro);
            return res.status(500).send('Erro ao cadastrar');
        }

        // mover arquivo e então redirecionar
        req.files.imagem.mv(__dirname + '/imagens/' + imagem, function(err){
            if (err) console.error('Erro ao mover imagem:', err);
            return res.redirect('/home');
        });
    });
});


// =========================
// 🔥 REMOVER PRODUTO
// =========================
app.get('/remover/:codigo/:imagem', function (req, res) {
    let codigo = req.params.codigo;
    let imagem = req.params.imagem;

    let sql = 'DELETE FROM produtos WHERE codigo = ?';

    conexao.query(sql, [codigo], function (erro) {
        if (erro) {
            console.error(erro);
            return res.status(500).send('Erro ao remover');
        }

        fs.unlink(__dirname + '/imagens/' + imagem, () => {});
        return res.redirect('/home');
    });
});


// =========================
// 🔥 EDITAR PRODUTO
// =========================
app.get('/homeEditar/:codigo', function (req, res) {
    let codigo = req.params.codigo;
    let sql = 'SELECT * FROM produtos WHERE codigo = ? LIMIT 1';

    conexao.query(sql, [codigo], function(erro, retorno){
        if (erro) {
            console.error(erro);
            return res.status(500).send('Erro ao buscar produto');
        }

        if (retorno.length === 0) return res.status(404).send('Produto não encontrado');

        res.render('homeEditar', { produto: retorno[0] });
    });
});


// Servidor
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
