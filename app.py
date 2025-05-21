from flask import Flask, jsonify, request
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db
import os
from werkzeug.utils import secure_filename
import requests
from flask_cors import CORS
from flask import send_from_directory

app = Flask(__name__)

# Hacer pública la carpeta 'uploads'
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Habilitar CORS para TODAS las rutas y orígenes
CORS(app)

# Configuración de Firebase
cred = credentials.Certificate('serviceAccountKey.json')

# Inicializar Firebase (solo una vez)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://cloudcoders-e9811-default-rtdb.firebaseio.com/'
    })

# Referencia a la base de datos
ref = db.reference('contenido')

# Configuración para uploads
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB límite

# Crear directorio si no existe
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_file(file, field_name):
    """Guarda un archivo en el sistema y devuelve su ruta"""
    if file and file.filename != '' and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return f"/{UPLOAD_FOLDER}/{filename}"
    return None

def notify_webhook(item_id, item_data):
    """Notifica al webhook .NET sobre un nuevo ítem"""
    WEBHOOK_URL = os.getenv('WEBHOOK_URL', 'https://localhost:7203/api/webhook')

    payload = {
        "id": item_id,
        "titulo": item_data["titulo"],
        "tipo": item_data["tipo"],
        "categoria": item_data["categoria"],
        "fecha_registro": item_data["fecha_registro"]
    }

    try:
        # Llamada al webhook
        resp = requests.post(WEBHOOK_URL, json=payload, timeout=5, verify=False)
        resp.raise_for_status()
        print(f"✅ Notificación enviada al webhook .NET ({resp.status_code})")
        return True
    except Exception as e:
        print(f"❌ Error notificando al webhook .NET: {e}")
        return False

# Endpoint de prueba
@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({
        "mensaje": "pong", 
        "estado": "La API está funcionando",
        "base_datos": "Conectado a Firebase Realtime Database",
        "proyecto": "cloudCoders (ID: cloudcoders-e9811)",
        "almacenamiento": f"Archivos locales en: {UPLOAD_FOLDER}"
    })

# Obtener todo el catálogo (con filtros opcionales)
@app.route('/catalogo', methods=['GET'])
def obtener_catalogo():
    try:
        # Obtener parámetros de consulta para filtrar
        categoria = request.args.get('categoria')
        tipo = request.args.get('tipo')
        
        # Obtener todos los items de Firebase
        items = ref.get() or {}
        
        # Convertir a lista y mantener el ID
        items_list = []
        for item_id, item_data in items.items():
            if item_data:  # Verificar que no sea None
                item_data['id'] = item_id
                # Asegurar que los campos de archivos existan
                item_data['archivo_pdf'] = item_data.get('archivo_pdf', '')
                item_data['imagen'] = item_data.get('imagen', '')
                items_list.append(item_data)
        
        # Aplicar filtros
        items_filtrados = items_list
        
        if categoria:
            items_filtrados = [item for item in items_filtrados 
                             if item.get('categoria', '').lower() == categoria.lower()]
        
        if tipo:
            items_filtrados = [item for item in items_filtrados 
                              if item.get('tipo', '').lower() == tipo.lower()]
        
        return jsonify({
            "mensaje": "Catálogo obtenido exitosamente",
            "datos": items_filtrados,
            "cantidad": len(items_filtrados)
        })
    except Exception as e:
        return jsonify({"mensaje": f"Error al obtener el catálogo: {str(e)}"}), 500

# Buscar un ítem por ID
@app.route('/catalogo/<string:item_id>', methods=['GET'])
def obtener_item(item_id):
    try:
        item = ref.child(item_id).get()
        
        if item:
            item['id'] = item_id
            # Asegurar que los campos de archivos existan
            item['archivo_pdf'] = item.get('archivo_pdf', '')
            item['imagen'] = item.get('imagen', '')
            return jsonify({
                "mensaje": "Ítem encontrado",
                "datos": item
            })
        return jsonify({"mensaje": "Ítem no encontrado"}), 404
    except Exception as e:
        return jsonify({"mensaje": f"Error al buscar el ítem: {str(e)}"}), 500

# Buscar ítem por título
@app.route('/catalogo/titulo/<string:titulo>', methods=['GET'])
def obtener_item_por_titulo(titulo):
    try:
        items = ref.get() or {}

        resultados = []
        for item_id, item_data in items.items():
            if item_data and titulo.lower() in item_data.get('titulo', '').lower():
                item_data['id'] = item_id
                # Asegurar que los campos de archivos existan
                item_data['archivo_pdf'] = item_data.get('archivo_pdf', '')
                item_data['imagen'] = item_data.get('imagen', '')
                resultados.append(item_data)

        if resultados:
            return jsonify({
                "mensaje": "Coincidencias encontradas",
                "datos": resultados
            })
        else:
            return jsonify({"mensaje": "Sin coincidencias"}), 404

    except Exception as e:
        return jsonify({"mensaje": f"Error al buscar por título: {str(e)}"}), 500

# Añadir un nuevo ítem al catálogo
@app.route('/catalogo', methods=['POST'])
def agregar_item():
    try:
        # Validar campo obligatorio
        if 'titulo' not in request.form:
            return jsonify({"mensaje": "El campo 'titulo' es requerido"}), 400
        
        pdf_path = None
        imagen_path = None
        
        # Procesar PDF si se subió y es válido
        if 'archivo' in request.files:
            pdf_path = save_file(request.files['archivo'], 'archivo')
            if not pdf_path:
                return jsonify({"mensaje": "Tipo de archivo PDF no permitido o no se proporcionó"}), 400
        
        # Procesar imagen si se subió y es válida
        if 'imagen' in request.files:
            imagen_path = save_file(request.files['imagen'], 'imagen')
            if not imagen_path:
                # Si ya subió PDF, eliminarlo porque imagen no es válida
                if pdf_path:  
                    os.remove(pdf_path[1:])
                return jsonify({"mensaje": "Tipo de imagen no permitido o no se proporcionó"}), 400
        
        # Crear nuevo ítem, asegurando que los campos archivo_pdf e imagen siempre existan
        nuevo_item = {
            "titulo": request.form['titulo'],
            "tipo": request.form.get('tipo', 'libro'),
            "categoria": request.form.get('categoria', 'General'),
            "disponible": request.form.get('disponible', 'true').lower() == 'true',
            "descripcion": request.form.get('descripcion', ''),
            "imagen": imagen_path if imagen_path else '',      # Cadena vacía si no hay imagen
            "archivo_pdf": pdf_path if pdf_path else '',       # Cadena vacía si no hay PDF
            "fecha_registro": request.form.get('fecha_registro', datetime.now().strftime('%Y-%m-%d'))
        }
        
        # Validar que el tipo sea uno de los permitidos
        if nuevo_item['tipo'] not in ['libro', 'revista', 'periodico']:
            if pdf_path: os.remove(pdf_path[1:])
            if imagen_path: os.remove(imagen_path[1:])
            return jsonify({"mensaje": "Tipo no válido. Debe ser: libro, revista o periodico"}), 400
        
        # Guardar el ítem en Firebase
        nuevo_ref = ref.push(nuevo_item)
        item_id = nuevo_ref.key
        
        # Notificar al webhook .NET si tienes esa integración
        notify_webhook(item_id, nuevo_item)
        
        return jsonify({
            "mensaje": "Ítem agregado exitosamente",
            "id": item_id,
            "datos": nuevo_item,
            "archivos_subidos": {
                "pdf": os.path.basename(pdf_path) if pdf_path else None,
                "imagen": os.path.basename(imagen_path) if imagen_path else None
            }
        }), 201
    except Exception as e:
        return jsonify({"mensaje": f"Error al agregar el ítem: {str(e)}"}), 500


@app.route('/catalogo/<string:item_id>', methods=['PUT'])
def actualizar_item(item_id):
    try:
        item = ref.child(item_id).get()
        if not item:
            return jsonify({"mensaje": "Ítem no encontrado"}), 404

        new_pdf_path = None
        new_imagen_path = None
        files_to_delete = []

        # Procesar nuevo PDF si se proporciona
        if 'archivo' in request.files:
            pdf_file = request.files['archivo']
            if pdf_file.filename:  # Solo si se subió un nuevo archivo
                new_pdf_path = save_file(pdf_file, 'archivo')
                if not new_pdf_path:
                    return jsonify({"mensaje": "Tipo de archivo PDF no permitido"}), 400
                if item.get('archivo_pdf'):
                    files_to_delete.append(item['archivo_pdf'][1:])  # Quitar el '/' inicial

        # Procesar nueva imagen si se proporciona
        if 'imagen' in request.files:
            imagen_file = request.files['imagen']
            if imagen_file.filename:  # Solo si se subió un nuevo archivo
                new_imagen_path = save_file(imagen_file, 'imagen')
                if not new_imagen_path:
                    if new_pdf_path:  # Si ya se subió PDF, eliminarlo
                        files_to_delete.append(new_pdf_path[1:])
                    return jsonify({"mensaje": "Tipo de imagen no permitido"}), 400
                if item.get('imagen'):
                    files_to_delete.append(item['imagen'][1:])  # Quitar el '/' inicial

        # Preparar datos para actualizar
        update_data = {
            "titulo": request.form.get('titulo', item.get('titulo')),
            "tipo": request.form.get('tipo', item.get('tipo', 'libro')),
            "categoria": request.form.get('categoria', item.get('categoria', 'General')),
            "disponible": request.form.get('disponible', str(item.get('disponible', True))).lower() == 'true',
            "descripcion": request.form.get('descripcion', item.get('descripcion', '')),
            "fecha_registro": request.form.get('fecha_registro', item.get('fecha_registro', datetime.now().strftime('%Y-%m-%d')))
        }

        # Añadir las nuevas rutas si existen
        if new_pdf_path:
            update_data['archivo_pdf'] = new_pdf_path
        if new_imagen_path:
            update_data['imagen'] = new_imagen_path

        # Validar tipo
        if 'tipo' in request.form and request.form['tipo'] not in ['libro', 'revista', 'periodico']:
            if new_pdf_path:
                files_to_delete.append(new_pdf_path[1:])
            if new_imagen_path:
                files_to_delete.append(new_imagen_path[1:])
            return jsonify({"mensaje": "Tipo no válido. Debe ser: libro, revista o periodico"}), 400

        # Actualizar en Firebase
        ref.child(item_id).update(update_data)

        # Borrar archivos antiguos
        for file_path in files_to_delete:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Error al eliminar archivo {file_path}: {e}")

        # Obtener item actualizado para respuesta
        item_actualizado = ref.child(item_id).get()
        item_actualizado['id'] = item_id

        return jsonify({
            "mensaje": "Ítem actualizado exitosamente",
            "datos": item_actualizado,
            "archivos_actualizados": {
                "pdf": bool(new_pdf_path),
                "imagen": bool(new_imagen_path)
            }
        })
    except Exception as e:
        return jsonify({"mensaje": f"Error al actualizar el ítem: {str(e)}"}), 500


# Eliminar un ítem del catálogo
@app.route('/catalogo/<string:item_id>', methods=['DELETE'])
def eliminar_item(item_id):
    try:
        item = ref.child(item_id).get()
        if not item:
            return jsonify({"mensaje": "Ítem no encontrado"}), 404

        # Eliminar archivos asociados
        files_to_delete = []
        if item.get('archivo_pdf'):
            files_to_delete.append(item['archivo_pdf'][1:])  # Eliminar el / inicial
        if item.get('imagen'):
            files_to_delete.append(item['imagen'][1:])  # Eliminar el / inicial

        # Eliminar de Firebase
        ref.child(item_id).delete()

        # Eliminar archivos del sistema
        for file_path in files_to_delete:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Error al eliminar archivo {file_path}: {str(e)}")

        return jsonify({
            "mensaje": "Ítem eliminado exitosamente",
            "id": item_id,
            "archivos_eliminados": [os.path.basename(f) for f in files_to_delete]
        })
    except Exception as e:
        return jsonify({"mensaje": f"Error al eliminar el ítem: {str(e)}"}), 500

# Obtener estadísticas del catálogo
@app.route('/catalogo/estadisticas', methods=['GET'])
def obtener_estadisticas():
    try:
        items = ref.get() or {}
        
        # Calcular estadísticas
        total_items = len(items)
        disponibles = sum(1 for item in items.values() if item and item.get('disponible', False))
        no_disponibles = total_items - disponibles
        con_pdf = sum(1 for item in items.values() if item and item.get('archivo_pdf', ''))
        con_imagen = sum(1 for item in items.values() if item and item.get('imagen', ''))
        
        # Conteo por tipo
        tipos = {'libro': 0, 'revista': 0, 'periodico': 0}
        for item in items.values():
            if item:
                tipo = item.get('tipo', '')
                if tipo in tipos:
                    tipos[tipo] += 1
        
        return jsonify({
            "mensaje": "Estadísticas obtenidas exitosamente",
            "datos": {
                "total_items": total_items,
                "disponibles": disponibles,
                "no_disponibles": no_disponibles,
                "con_pdf": con_pdf,
                "con_imagen": con_imagen,
                "por_tipo": tipos
            }
        })
    except Exception as e:
        return jsonify({"mensaje": f"Error al obtener estadísticas: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=4000)