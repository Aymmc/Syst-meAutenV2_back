import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.mjs';
import db from '../db.mjs'; // Assurez-vous que le chemin est correct

const router = express.Router();

// Envoyer une demande d’amitié
router.post('/send', authenticateToken, (req, res) => {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
        return res.status(400).json({ message: 'Vous ne pouvez pas vous ajouter comme ami.' });
    }

    const checkExistingRequestSql = `SELECT * FROM FriendRequests WHERE senderid = ? AND receiverid = ?`;
    const insertRequestSql = `INSERT INTO FriendRequests (senderid, receiverid, status) VALUES (?, ?, 'pending')`;

    db.get(checkExistingRequestSql, [senderId, receiverId], (err, row) => {

        console.log('check coucou', req.user.id);
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erreur lors de la vérification de la demande.' });
        }

        if (row) {
            return res.status(400).json({ message: 'Une demande existe déjà.' });
        }

        db.run(insertRequestSql, [senderId, receiverId], function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Erreur lors de l’envoi de la demande.' });
            }
            res.status(200).json({ message: 'Demande d’amitié envoyée.' });
        });
    });
});

// Accepter une demande d’amitié
router.post('/accept', authenticateToken, (req, res) => {
    const { requestId } = req.body;
    const userId = req.user.id;

    const updateRequestSql = `UPDATE FriendRequests SET status = 'accepted' WHERE id = ? AND receiverid = ? AND status = 'pending'`;
    const insertFriendSql = `INSERT INTO Friends (userid, friendid) VALUES (?, ?), (?, ?)`;

    db.run(updateRequestSql, [requestId, userId], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erreur lors de l’acceptation de la demande.' });
        }

        const insertFriendValues = [userId, (requestId), (requestId), userId];
        db.run(insertFriendSql, insertFriendValues, function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Erreur lors de l’ajout de l’amitié.' });
            }
            res.status(200).json({ message: 'Demande d’amitié acceptée.' });
        });
    });
});

// Refuser une demande d’amitié
router.post('/reject', authenticateToken, (req, res) => {
    const { requestId } = req.body;
    const userId = req.user.id;

    const updateRequestSql = `UPDATE FriendRequests SET status = 'rejected' WHERE id = ? AND receiverid = ? AND status = 'pending'`;

    db.run(updateRequestSql, [requestId, userId], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erreur lors du rejet de la demande.' });
        }
        res.status(200).json({ message: 'Demande d’amitié rejetée.' });
    });
});

// Liste des amis
router.get('/list', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const listFriendsSql = `SELECT u.id, u.login 
                            FROM Friends f
                            JOIN users u ON u.id = f.friendid
                            WHERE f.userid = ?`;

    db.all(listFriendsSql, [userId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erreur lors de la récupération des amis.' });
        }
        res.status(200).json(rows);
    });
});

// Liste des demandes d'amitié reçues
// Routes pour obtenir les demandes d'amitié reçues
router.get('/requests', authenticateToken, (req, res) => {
    const userId = req.user.id;

    console.log('Fetching friend requests for user ID:', userId);

    db.all(
        `SELECT * FROM FriendRequests WHERE receiverId = ? AND status = 'pending'`,
        [userId],
        (err, rows) => {
            if (err) {
                console.error('Error fetching friend requests:', err);
                return res.status(500).json({ message: 'Erreur lors de la récupération des demandes d’amitié.' });
            }

            console.log('Fetched friend requests:', rows);

            res.status(200).json(rows);
        }
    );
});



export default router;
