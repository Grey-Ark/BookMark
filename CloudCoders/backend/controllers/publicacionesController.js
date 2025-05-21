const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const router = express.Router();

//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configura multer para almacenamiento temporal de archivos
const upload = multer({
  dest: path.join(__dirname, '../uploads/') // Ajusta esta ruta según la estructura de tu proyecto
});

// 🚀 POST: Enviar publicación al backend Flask (ahora con archivos)
router.post('/agregar-publicacion', upload.fields([
  { name: 'archivo', maxCount: 1 },
  { name: 'imagen', maxCount: 1 }
]), async (req, res) => {
  const {
    titulo,
    descripcion,
    tipo,
    categoria,
    disponible,
    fecha_registro
  } = req.body;
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);
  // Validación básica
  if (!titulo || !tipo || !categoria) {
    return res.status(400).json({ message: 'Faltan campos obligatorios: título, tipo o categoría' });
  }

  try {
    // Crear FormData para enviar archivos
    const formData = new FormData();
    
    // Agregar campos del formulario
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion || '');
    formData.append('tipo', tipo);
    formData.append('categoria', categoria);
    formData.append('disponible', disponible ?? 'true');
    formData.append('fecha_registro', fecha_registro || new Date().toISOString().split('T')[0]);

    // Agregar archivos si existen
    if (req.files) {
      if (req.files.archivo) {
        formData.append('archivo', 
          fs.createReadStream(req.files.archivo[0].path),
          { filename: req.files.archivo[0].originalname }
        );
      }
      if (req.files.imagen) {
        formData.append('imagen', 
          fs.createReadStream(req.files.imagen[0].path),
          { filename: req.files.imagen[0].originalname }
        );
      }
    }

    // Configuración para Axios con FormData
    const config = {
      headers: {
        ...formData.getHeaders(),
        //'Content-Type': 'multipart/form-data' // No es necesario setearlo, FormData lo hace
      }
    };

    // 👉 Llamada al backend Flask
    const respuesta = await axios.post('http://localhost:4000/catalogo', formData, config);

    // Limpiar archivos temporales si es necesario
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fs.unlinkSync(fileArray[0].path);
      });
    }

    // ✅ Envío exitoso
    res.status(201).json({
      message: '✅ Publicación enviada y guardada en Flask correctamente',
      datos: respuesta.data
    });

  } catch (error) {
    console.error('❌ Error al enviar publicación a Flask:', error.message);

    // Limpiar archivos temporales en caso de error
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        if (fs.existsSync(fileArray[0].path)) {
          fs.unlinkSync(fileArray[0].path);
        }
      });
    }

    res.status(500).json({ 
      message: 'Error al comunicarse con el servicio Flask',
      error: error.response?.data || error.message
    });
  }
});

// GET: Obtener una publicación por ID
router.get('/obtener-publicacion/:id', async (req, res) => {
  const itemId = req.params.id;

  try {
    // Llamas a Flask para obtener el ítem por ID
    const respuesta = await axios.get(`http://localhost:4000/catalogo/${itemId}`);

    if (respuesta.data) {
      res.status(200).json(respuesta.data);
    } else {
      res.status(404).json({ message: 'Publicación no encontrada' });
    }
  } catch (error) {
    console.error('❌ Error al obtener publicación desde Flask:', error.message);
    res.status(500).json({
      message: 'Error al obtener la publicación',
      error: error.response?.data || error.message
    });
  }
});


// 📝 PUT: Editar publicación existente (con soporte para archivos)
router.put('/editar-publicacion/:id', upload.fields([
  { name: 'archivo', maxCount: 1 },
  { name: 'imagen', maxCount: 1 }
]), async (req, res) => {
  const itemId = req.params.id;
  
  if (!itemId) {
    return res.status(400).json({ message: 'Falta el ID del ítem a editar' });
  }

  try {
    const formData = new FormData();
    const { titulo, descripcion, tipo, categoria, disponible, fecha_registro } = req.body;

    if (titulo) formData.append('titulo', titulo);
    if (descripcion) formData.append('descripcion', descripcion);
    if (tipo) formData.append('tipo', tipo);
    if (categoria) formData.append('categoria', categoria);
    if (disponible) formData.append('disponible', disponible);
    if (fecha_registro) formData.append('fecha_registro', fecha_registro);

    if (req.files) {
      if (req.files.archivo) {
        formData.append('archivo', 
          fs.createReadStream(req.files.archivo[0].path),
          { filename: req.files.archivo[0].originalname }
        );
      }
      if (req.files.imagen) {
        formData.append('imagen', 
          fs.createReadStream(req.files.imagen[0].path),
          { filename: req.files.imagen[0].originalname }
        );
      }
    }

    const config = {
      headers: {
        ...formData.getHeaders()
      }
    };

    const respuesta = await axios.put(`http://localhost:4000/catalogo/${itemId}`, formData, config);

    // Limpiar archivos temporales
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fs.unlinkSync(fileArray[0].path);
      });
    }

    res.status(200).json(respuesta.data);
  } catch (error) {
    console.error('❌ Error al actualizar publicación:', error.message);

    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        if (fs.existsSync(fileArray[0].path)) {
          fs.unlinkSync(fileArray[0].path);
        }
      });
    }

    res.status(500).json({ 
      message: 'Error al comunicarse con el servicio Flask',
      error: error.response?.data || error.message
    });
  }
});

// 🗑️ DELETE: Eliminar publicación
router.delete('/eliminar-publicacion/:id', async (req, res) => {
  const itemId = req.params.id;
  
  if (!itemId) {
    return res.status(400).json({ message: 'Falta el ID del ítem a eliminar' });
  }

  try {
    const respuesta = await axios.delete(`http://localhost:4000/catalogo/${itemId}`);
    res.status(200).json(respuesta.data);
  } catch (error) {
    console.error('❌ Error al eliminar publicación:', error.message);
    res.status(500).json({ 
      message: 'Error al comunicarse con el servicio Flask',
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;
