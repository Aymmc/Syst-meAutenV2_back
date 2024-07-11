import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // Ajoutez jsonwebtoken pour gérer les tokens
import db from '../db.mjs';

const router = express.Router();
const SECRET_KEY = 'your_secret_key'; // Utilisez une clé secrète sécurisée

// Route POST pour /login
router.post('/', async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ message: 'Les champs login et password sont requis' });
        }

        // Récupérer l'utilisateur depuis la base de données par son login
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE login = ?', [login], (err, user) => {
                if (err) {
                    return reject(err);
                }
                resolve(user);
            });
        });

        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        // Comparer le mot de passe fourni avec le hash stocké dans la base de données
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }

        // Authentification réussie
        // Générer un token JWT
        const token = jwt.sign({ id: user.id, login: user.login }, SECRET_KEY, { expiresIn: '1h' });

        res.json({ message: 'Connexion réussie', token });
    } catch (error) {
        console.error('Erreur lors de la connexion :', error.message);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
});

export default router;
