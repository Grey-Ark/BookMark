const express = require('express');
const clienteRouter = require('../controllers/clienteController');
const publicacionesRouter = require('../controllers/publicacionesController');


const router = express.Router();

// Rutas para estudiantes
router.use('/cliente', clienteRouter);
router.use('/publicaciones', publicacionesRouter);


module.exports = router;
