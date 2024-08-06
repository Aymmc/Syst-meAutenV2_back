import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import registerRoute from './routes/registerRoute.mjs';
import loginRoute from './routes/loginRoute.mjs';
import chatRoute from './routes/chatRoute.mjs';
import friendRoutes from './routes/friendRoutes.mjs';
import authenticateToken from './middlewares/authenticateToken.mjs';

const app = express();
const port = 5000;
const SECRET_KEY = 'your_secret_key';

const server = http.createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use('/register', registerRoute);
app.use('/login', loginRoute);
app.use('/chat', chatRoute);
app.use('/friendship', friendRoutes);

app.get('/user', authenticateToken, (req, res) => {
    res.json({ login: req.user.login });
});

// Object to store user logins and their corresponding socket IDs
const users = {};

io.on('connection', (socket) => {


    socket.on('join', (pseudo) => {
        console.log(`${pseudo} a rejoint le chat`);
        users[pseudo] = socket.id;  // Store the user's pseudo with their socket ID
        socket.broadcast.emit('chat message', { pseudo: 'System', text: `${pseudo} a rejoint le chat` });
    });

    socket.on('chat message', (msg, receiver) => {
        if (receiver) {
            const receiverSocketId = users[receiver];  // Get the socket ID of the receiver
            if (receiverSocketId) {
                socket.to(receiverSocketId).emit('chat message', { pseudo: msg.pseudo, text: msg.text });
            }
        }
    });

    socket.on('send friend request', (data) => {
        io.emit('friend request', data);
    });

    socket.on('accept friend request', (data) => {
        io.emit('friend request accepted', data);
    });

    socket.on('reject friend request', (data) => {
        io.emit('friend request rejected', data);
    });

    socket.on('disconnect', () => {
        // Remove the user from the users object when they disconnect
        for (const [pseudo, id] of Object.entries(users)) {
            if (id === socket.id) {
                delete users[pseudo];
                break;
            }
        }
     
    });
});

server.listen(port, () => {
    console.log(`Serveur en ligne sur http://localhost:${port}`);
});

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
