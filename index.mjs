import express from 'express';
import cors from 'cors';
import http from 'http';  // Importer http
import { Server as SocketIOServer } from 'socket.io';  // Importer socket.io
import registerRoute from './routes/registerRoute.mjs';
import loginRoute from './routes/loginRoute.mjs';
import chatRoute from './routes/chatRoute.mjs'; // Assurez-vous que le chemin est correct
import friendRoutes from './routes/friendRoutes.mjs';
import authenticateToken from './middlewares/authenticateToken.mjs';


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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Routes
app.use('/register', registerRoute); // Routes pour inscriptions
app.use('/login', loginRoute);       // Routes de connexion
app.use('/chat', chatRoute);
app.use('/friendship', friendRoutes);

// Route protégée pour obtenir les détails de l'utilisateur
app.get('/user', authenticateToken, (req, res) => {
    res.json({ login: req.user.login });
});

// Configurer les événements de Socket.IO
io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');

    // Émettre une demande d'amitié
    socket.on('send friend request', (data) => {
        io.emit('friend request', data);
    });

    // Émettre une demande d'amitié acceptée
    socket.on('accept friend request', (data) => {
        io.emit('friend request accepted', data);
    });

    // Émettre une demande d'amitié rejetée
    socket.on('reject friend request', (data) => {
        io.emit('friend request rejected', data);
    });

    // Événements de chat
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
;

// Fermeture de la base de données lorsque l'application se termine
import db from './db.mjs'; 

process.on('SIGINT', () => {
    db.close(err => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database closed');
        process.exit();
    });
});
