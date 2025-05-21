require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin'); // ← Agregado

// 🔐 Importa la clave del servicio
const serviceAccount = require('./firebase-key.json'); // ← Asegúrate de tener este archivo descargado

// 🚀 Inicializa Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://cloudcoders-e9811-default-rtdb.firebaseio.com/' // ← reemplaza con tu URL de Firebase
});

// 🔗 Referencia a la base de datos
const db = admin.database();

// 🔧 Exporta la referencia para usar en otras rutas (como auth.js)
module.exports.firebaseDB = db;

const app = express();
const port = process.env.PORT || 3000;

// 📌 Aumentar el límite de tamaño permitido (Ej: 50MB)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// ✅ Mensaje simple
app.get('/', (req, res) => {
  res.send('API conectada a Firebase 🚀');
});

// ✅ Importar rutas y pasar referencia de Firebase si es necesario
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});
