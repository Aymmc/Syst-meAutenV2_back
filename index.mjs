// src/index.js
import express from 'express';
import cors from 'cors';
import http from 'http';  // Importer http
import { Server as SocketIOServer } from 'socket.io';  // Importer socket.io
import registerRoute from './routes/registerRoute.mjs';
import loginRoute from './routes/loginRoute.mjs';
import chatRoute from './routes/chatRoute.mjs'; // Assurez-vous que le chemin est correct
import jwt from 'jsonwebtoken';

const app = express();
const port = 5000;
const SECRET_KEY = 'your_secret_key'; // Assurez-vous que cette clé correspond à celle utilisée pour signer les tokens

// Créer un serveur HTTP à partir de Express
const server = http.createServer(app);

// Créer une instance de Socket.IO en passant le serveur HTTP
const io = new SocketIOServer(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware pour parser le corps des requêtes JSON
app.use(express.json());

// Middleware CORS
app.use(cors({
    origin: "http://localhost:3000"
}));

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Routes
app.use('/register', registerRoute); // Routes pour inscriptions
app.use('/login', loginRoute);       // Routes de connexion

// Route protégée pour obtenir les détails de l'utilisateur
app.get('/user', authenticateToken, (req, res) => {
    res.json({ login: req.user.login });
});

// Intégration des routes de chat
app.use('/chat', chatRoute);

// Configurer les événements de Socket.IO
io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');

    socket.on('join', (pseudo) => {
        console.log(`${pseudo} a rejoint le chat`);
        socket.broadcast.emit('chat message', { pseudo: 'System', text: `${pseudo} a rejoint le chat` });
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', { pseudo: msg.pseudo, text: msg.text });
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté');
    });
});

// Démarrer le serveur HTTP
server.listen(port, () => {
    console.log(`Serveur en ligne sur http://localhost:${port}`);
});

// Fermeture de la base de données lorsque l'application se termine
import db from './db.mjs'; // Assure-toi que db.mjs est correctement exporté

process.on('SIGINT', () => {
    db.close(err => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database closed');
        process.exit();
    });
});
