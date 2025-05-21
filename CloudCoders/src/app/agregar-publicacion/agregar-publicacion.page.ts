import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController, ToastController, IonButton, IonicModule } from '@ionic/angular';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Publicacion {
  id?: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  categoria: string;
  disponible: boolean;
  fecha_registro?: string;
  archivo_pdf?: string;
  imagen?: string;
}

@Component({
  selector: 'app-agregar-publicacion',
  templateUrl: './agregar-publicacion.page.html',
  styleUrls: ['./agregar-publicacion.page.scss'],
  imports: [CommonModule, IonicModule, NavbarComponent, FormsModule, HttpClientModule]
})
export class AgregarPublicacionPage implements OnInit {
  @ViewChild('submitButton') submitButton!: IonButton;
  @ViewChild('publicacionForm') publicacionForm!: NgForm;

  publicacion: Publicacion = {
    titulo: '',
    descripcion: '',
    tipo: '',
    categoria: '',
    disponible: true
  };

  archivoFile: File | null = null;
  imagenFile: File | null = null;
  archivoNombre: string = '';
  imagenNombre: string = '';
  imagenPrevia: string | ArrayBuffer | null = null;

  modoEdicion: boolean = false;
  cargando: boolean = false;

  constructor(
    private navCtrl: NavController,
    private toastController: ToastController,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

ngOnInit() {
  this.route.queryParams.subscribe(params => {
    if (params['modo'] === 'editar') {
      this.modoEdicion = true;
      this.publicacion = {
        id: params['id'],
        titulo: params['titulo'] || '',
        descripcion: params['descripcion'] || '',
        tipo: params['tipo'] || '',
        categoria: params['categoria'] || '',
        disponible: params['disponible'] === 'true',
        fecha_registro: params['fecha_registro'] || new Date().toISOString().split('T')[0],
        imagen: params['imagen'] || '',
        archivo_pdf: ''
      };

      this.archivoNombre = '';
      this.imagenNombre = this.publicacion.imagen ? 'Imagen actual seleccionada' : '';

      if (this.publicacion.imagen) {
        this.imagenPrevia = this.publicacion.imagen;
      }
    }

    setTimeout(() => {
      this.actualizarEstadoBoton();
    }, 0);
  });
}


  async cargarPublicacionExistente(id: string) {
    try {
      this.cargando = true;
      const respuesta = await this.http
        .get<Publicacion>(`http://localhost:3000/api/publicaciones/obtener-publicacion/${id}`)
        .toPromise();

      if (respuesta) {
        this.publicacion = {
          id: respuesta.id,
          titulo: respuesta.titulo || '',
          descripcion: respuesta.descripcion || '',
          tipo: respuesta.tipo || '',
          categoria: respuesta.categoria || '',
          disponible: respuesta.disponible ?? true,
          fecha_registro: respuesta.fecha_registro || new Date().toISOString().split('T')[0]
        };

        this.archivoNombre = respuesta.archivo_pdf && respuesta.archivo_pdf.trim() !== '' 
          ? 'PDF actual seleccionado' 
          : '';
        this.imagenNombre = respuesta.imagen && respuesta.imagen.trim() !== '' 
          ? 'Imagen actual seleccionada' 
          : '';

        if (respuesta.imagen && respuesta.imagen.trim() !== '') {
          this.imagenPrevia = respuesta.imagen;
        }
      }
    } catch (error) {
      console.error('Error al cargar publicación:', error);
      this.mostrarToast('Error al cargar la publicación', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  onFileSelected(event: Event, tipo: 'archivo' | 'imagen') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (tipo === 'archivo') {
        this.archivoFile = file;
        this.archivoNombre = file.name;
      } else {
        this.imagenFile = file;
        this.imagenNombre = file.name;

        const reader = new FileReader();
        reader.onload = () => {
          this.imagenPrevia = reader.result;
        };
        reader.readAsDataURL(file);
      }
      this.actualizarEstadoBoton();
    }
  }

  actualizarEstadoBoton() {
    const tituloValido = this.publicacion.titulo.trim().length > 0;
    const tipoValido = this.publicacion.tipo.trim().length > 0;
    const categoriaValido = this.publicacion.categoria.trim().length > 0;

    const formularioValido = tituloValido && tipoValido && categoriaValido;

    const archivosValidos = 
      (this.archivoFile !== null || (this.archivoNombre && this.archivoNombre.trim() !== '')) &&
      (this.imagenFile !== null || (this.imagenNombre && this.imagenNombre.trim() !== ''));

    if (this.submitButton) {
      this.submitButton.disabled = !(formularioValido && archivosValidos);
    }
  }

  async guardarPublicacion() {
    if (this.cargando) return;

    const tituloValido = this.publicacion.titulo.trim().length > 0;
    const tipoValido = this.publicacion.tipo.trim().length > 0;
    const categoriaValido = this.publicacion.categoria.trim().length > 0;
    const archivosValidos = this.archivoFile !== null && this.imagenFile !== null;

    if (!(tituloValido && tipoValido && categoriaValido && archivosValidos)) {
      this.mostrarToast('Por favor completa todos los campos obligatorios', 'warning');
      return;
    }

    this.cargando = true;

    try {
      const formData = new FormData();

      Object.entries(this.publicacion).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      if (this.archivoFile) formData.append('archivo', this.archivoFile);
      if (this.imagenFile) formData.append('imagen', this.imagenFile);

      const url = this.modoEdicion && this.publicacion.id
        ? `http://localhost:3000/api/publicaciones/editar-publicacion/${this.publicacion.id}`
        : 'http://localhost:3000/api/publicaciones/agregar-publicacion';

      const metodo = this.modoEdicion ? 'put' : 'post';

      await this.http.request(metodo, url, { body: formData }).toPromise();

      this.mostrarToast(
        this.modoEdicion
          ? '✅ Publicación actualizada correctamente'
          : '✅ Publicación creada correctamente',
        'success'
      );

      this.navCtrl.navigateBack('/home');
    } catch (error) {
      console.error('Error al guardar publicación:', error);
      this.mostrarToast('❌ Error al guardar la publicación', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}
