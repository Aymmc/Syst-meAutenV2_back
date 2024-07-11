import sqlite3 from 'sqlite3'; // Importer sqlite3 pour les modules ESM
import path from 'path'; // Utilisé pour construire le chemin du fichier
import { fileURLToPath } from 'url'; // Convertir l'URL en chemin de fichier

// Obtenir le chemin absolu du fichier main.db
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'main.db');

// Créer une nouvelle instance de la base de données SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err.message);
    } else {
        console.log('Database started on ' + dbPath);
    }
});

export default db; // Utiliser export pour les modules ESM
