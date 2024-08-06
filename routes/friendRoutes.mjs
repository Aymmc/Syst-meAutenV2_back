import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.mjs';
import db from '../db.mjs'; // Assurez-vous que le chemin est correct

const router = express.Router();

// Envoyer une demande d’amitié
router.post('/send', authenticateToken, (req, res) => {
    const { receiverLogin } = req.body;
    const senderId = req.user.id;

    if (!receiverLogin) {
        return res.status(400).json({ message: 'Receiver login is required.' });
    }

    if (senderId === receiverLogin) {
        return res.status(400).json({ message: 'Vous ne pouvez pas vous ajouter comme ami.' });
    }

    // Rechercher l'ID du destinataire à partir de son login
    const findReceiverSql = `SELECT id FROM users WHERE login = ?`;
    db.get(findReceiverSql, [receiverLogin], (err, receiver) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erreur lors de la vérification du destinataire.' });
        }

        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found.' });
        }

        const receiverId = receiver.id;

        const checkExistingRequestSql = `SELECT * FROM FriendRequests WHERE senderid = ? AND receiverid = ?`;
        const insertRequestSql = `INSERT INTO FriendRequests (senderid, receiverid, status) VALUES (?, ?, 'pending')`;

        db.get(checkExistingRequestSql, [senderId, receiverId], (err, row) => {
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
});

// Accepter une demande d’amitié
router.post('/accept', authenticateToken, (req, res) => {
    const { requestId } = req.body;
    const receiverId = req.user.id;

    // Récupérer les IDs du demandeur et du receveur à partir de la table FriendRequests
    const getRequestSql = `SELECT senderId, receiverId FROM FriendRequests WHERE id = ? AND receiverId = ? AND status = 'pending'`;

    db.get(getRequestSql, [requestId, receiverId], (err, row) => {
        if (err) {
            console.error('Error retrieving request:', err.message);
            return res.status(500).json({ message: 'Erreur lors de la récupération de la demande.' });
        }

        if (!row) {
            return res.status(404).json({ message: 'Demande non trouvée ou déjà acceptée.' });
        }

        const senderId = row.senderId;
        const receiverId = row.receiverId;

        const updateRequestSql = `UPDATE FriendRequests SET status = 'accepted' WHERE id = ?`;
        const insertFriendSql = `INSERT INTO Friends (userid, friendid) VALUES (?, ?), (?, ?)`;

        db.run(updateRequestSql, [requestId], function (err) {
            if (err) {
                console.error('Error updating request:', err.message);
                return res.status(500).json({ message: 'Erreur lors de l’acceptation de la demande.' });
            }

            db.run(insertFriendSql, [senderId, receiverId, receiverId, senderId], function (err) {
                if (err) {
                    console.error('Error inserting friendship:', err.message);
                    return res.status(500).json({ message: 'Erreur lors de l’ajout de l’amitié.' });
                }
                res.status(200).json({ message: 'Demande d’amitié acceptée.' });
            });
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
                            JOIN Users u ON u.id = f.friendid
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
router.get('/requests', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const getRequestSql = `SELECT f.id, u.login AS senderLogin, f.status 
                           FROM FriendRequests f
                           JOIN Users u ON u.id = f.senderid
                           WHERE f.receiverid = ? AND f.status = 'pending'`;

    db.all(getRequestSql, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching friend requests:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des demandes d’amitié.' });
        }

  

        res.status(200).json(rows);
    });
});

export default router;
