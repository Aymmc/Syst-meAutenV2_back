import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.mjs';
const router = express.Router();

// Route POST pour /register
router.post('/', async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ message: 'Les champs login et password sont requis' });
        }

        // Vérifier si le login existe déjà
        db.get('SELECT * FROM users WHERE login = ?', [login], async (err, row) => {
            if (err) {
                console.error('Erreur lors de la vérification du login :', err.message);
                return res.status(500).json({ message: 'Erreur interne du serveur' });
            }

            if (row) {
                return res.status(400).json({ message: 'Ce login est déjà utilisé' });
            }

            // Si le login n'existe pas, on continue avec l'enregistrement
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            const userId = uuidv4(); // Générer un UUID pour l'utilisateur

            // Enregistrer les données dans la base de données
            db.run('INSERT INTO users (id, login, password) VALUES (?, ?, ?)', [userId, login, hash], (err) => {
                if (err) {
                    console.error('Erreur lors de l\'enregistrement dans la base de données :', err.message);
                    return res.status(500).json({ message: 'Erreur lors de l\'enregistrement' });
                }
                console.log('Utilisateur enregistré avec succès.');
                res.json({ message: 'Utilisateur enregistré avec succès' });
            });
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement :', error.message);
        res.status(500).send('Erreur lors de l\'enregistrement');
    }
});

export default router;
