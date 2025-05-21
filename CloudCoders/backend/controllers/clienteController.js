const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { firebaseDB } = require('../server'); 
const clienteRouter = express.Router();

// 📌 REGISTRO DE CLIENTE
clienteRouter.post('/registro', async (req, res) => {
  const { correo_personal, contrasena } = req.body;

  if (!correo_personal || !contrasena) {
    return res.status(400).json({ message: 'Todos los campos obligatorios deben estar llenos' });
  }

  try {
    // Verificamos si ya existe ese correo
    const clientesRef = firebaseDB.ref('clientes');
    const snapshot = await clientesRef.once('value');
    const clientes = snapshot.val() || {};

    const correoExiste = Object.values(clientes).some(
      (cliente) => cliente.correo_personal === correo_personal
    );

    if (correoExiste) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const nuevoClienteRef = clientesRef.push(); // genera un ID único
    const id_cliente = nuevoClienteRef.key;

    await nuevoClienteRef.set({
      correo_personal,
      contraseña: hashedPassword,
    });

    res.json({
      message: 'Usuario registrado correctamente',
      cliente: {
        id_cliente,
        correo_personal,
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// 📌 LOGIN DE CLIENTE
clienteRouter.post('/login', async (req, res) => {
  const { correo_personal, contraseña } = req.body;

  try {
    const clientesRef = firebaseDB.ref('clientes');
    const snapshot = await clientesRef.once('value');
    const clientes = snapshot.val() || {};

    const entrada = Object.entries(clientes).find(
      ([, cliente]) => cliente.correo_personal === correo_personal
    );

    if (!entrada) {
      return res.status(401).json({ message: 'Correo o contraseña incorrecta' });
    }

    const [id_cliente, cliente] = entrada;

    const validPassword = await bcrypt.compare(contraseña, cliente.contraseña);
    if (!validPassword) {
      return res.status(401).json({ message: 'Correo o contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: id_cliente },
      process.env.JWT_SECRET,
      { expiresIn: '10h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      cliente: {
        id_cliente,
        correo_personal: cliente.correo_personal
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = clienteRouter;
