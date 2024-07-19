import jwt from 'jsonwebtoken';
import db from '../db.mjs';
const SECRET_KEY = 'your_secret_key'; // Assure-toi que cette clé est correcte

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        
        // Retrieve the user's id from the database based on the login
        const sql = 'SELECT id FROM Users WHERE login = ?';
        db.get(sql, [user.login], (err, row) => {
            if (err || !row) {
                return res.status(403).json({ message: 'Invalid user' });
            }
            req.user = { id: row.id, login: user.login };
            next();
        });
    });
};

export default authenticateToken;
