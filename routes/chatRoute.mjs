import express from 'express';
const router = express.Router();

// Route exemple pour obtenir les messages
router.get('/messages', (req, res) => {
  res.send('Liste des messages');
});

// Route exemple pour envoyer un message
router.post('/send', (req, res) => {
  const { message } = req.body;
  // Vous pouvez ajouter la logique pour gérer l'envoi des messages
  res.json({ status: 'Message envoyé', message });
});

export default router;