const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const util = require('util');
require('dotenv').config();

const motocicletaRouter = express.Router();

// Conexión a la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Promisificar consultas para usar async/await
const query = util.promisify(db.query).bind(db);

// Middleware para verificar el token de estudiante
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔹 ID del estudiante extraído del token:', decoded.id);
    req.id_estudiante = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// 📌 REGISTRO DE MOTOCICLETA
motocicletaRouter.post('/register', verifyToken, async (req, res) => {
  const { matricula, modelo, marca, color, foto_perfil, qr } = req.body;

  if (!matricula || !modelo || !marca || !color) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  const id_estudiante = req.id_estudiante;
  let imageUrl = null;
  let qrUrl = null;


  if (foto_perfil) {
    try {
      // Asegurar que la carpeta 'uploads' existe
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Procesar la imagen
      const base64Data = foto_perfil.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const imageName = `motocicleta_${Date.now()}.png`;
      const imagePath = path.join(uploadDir, imageName);
      fs.writeFileSync(imagePath, buffer);
      imageUrl = '/uploads/' + imageName;
    } catch (error) {
      console.error('Error al guardar la imagen:', error);
      return res.status(500).json({ message: 'Error al procesar la imagen' });
    }
  }
  if (qr) {
    try {
      // Asegurar que la carpeta 'uploads' existe (aunque ya hemos comprobado antes)
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Procesar el QR
      const base64Data = qr.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const qrName = `qr_${Date.now()}.png`;
      const qrPath = path.join(uploadDir, qrName);
      fs.writeFileSync(qrPath, buffer);
      qrUrl = '/uploads/' + qrName; // Guardar la URL relativa del QR
    } catch (error) {
      console.error('Error al guardar el QR:', error);
      return res.status(500).json({ message: 'Error al procesar el QR' });
    }
  }

  try {
    await query(
      'INSERT INTO motocicleta (id_estudiante, matricula, modelo, marca, color, foto_perfil, qr) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_estudiante, matricula, modelo, marca, color, imageUrl, qrUrl],
      (err, result) => {
        if (err) {
          console.error('Error al registrar usuario:', err);
          return res.status(500).json({ message: 'Error al registrar usuario' });
        }

        // Aquí, después de realizar el registro, devolvemos tanto el mensaje como los datos del estudiante
        res.json({
          message: 'Motococleta registrado correctamente',
          motocicleta: {
            id_estudiante: result.insertId, // id del estudiante insertado
            matricula: matricula,
            modelo: modelo,
            marca: marca,
            color: color,
            foto_perfil: foto_perfil || null,
            qr: qr || null
          }
        });
      }
    );

    res.json({ message: 'Vehículo registrado correctamente', imageUrl });
  } catch (err) {
    console.error('Error al registrar la motocicleta:', err);
    res.status(500).json({ message: 'Error al registrar la motocicleta' });
  }
});

// 📌 Servir imágenes estáticas
motocicletaRouter.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//📌Obtener datos de moto
// Ruta para obtener los datos de la moto según el estudiante
motocicletaRouter.get('/getDataMoto', verifyToken, async (req, res) => {
  const id_estudiante = req.id_estudiante;

  try {
    const rows = await query(
      'SELECT matricula, modelo, marca, color, foto_perfil, qr FROM motocicleta WHERE id_estudiante = ?',
      [id_estudiante]
    );

    // Convertir las rutas de imagen a base64
    const motosConImagenes = rows.map((moto) => {
      const fotoPath = path.join(__dirname, 'uploads', path.basename(moto.foto_perfil || ''));
const qrPath = path.join(__dirname, 'uploads', path.basename(moto.qr || ''));

      let fotoBase64 = null;
      let qrBase64 = null;

      try {
        if (fs.existsSync(fotoPath)) {
          const fotoBuffer = fs.readFileSync(fotoPath);
          fotoBase64 = `data:image/jpeg;base64,${fotoBuffer.toString('base64')}`;
        }
        if (fs.existsSync(qrPath)) {
          const qrBuffer = fs.readFileSync(qrPath);
          qrBase64 = `data:image/png;base64,${qrBuffer.toString('base64')}`;
        }
      } catch (e) {
        console.error('Error leyendo imagen:', e);
      }

      return {
        ...moto,
        foto_perfil: fotoBase64,
        qr: qrBase64
      };
    });

    res.json({ motos: motosConImagenes });

  } catch (err) {
    console.error('Error al obtener los datos de la moto:', err);
    res.status(500).json({ message: 'Error al obtener los datos de la moto' });
  }
});

module.exports = motocicletaRouter;
