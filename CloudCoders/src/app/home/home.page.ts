import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ModalController } from '@ionic/angular';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule, HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { ConfirmarEliminacionComponent } from '../components/confirmar-eliminacion/confirmar-eliminacion.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    NavbarComponent,
    FormsModule,
    HttpClientModule,
    ConfirmarEliminacionComponent
  ],
})
export class HomePage {
  publicacionesOriginales: any[] = [];
  publicaciones: any[] = [];

  titulo: string = '';
  tipo: string = '';
  categorias: string[] = [];
  mostrarFiltros: boolean = false;
  esAdmin: boolean = false;

  // Base URL de tu servidor Slim/PHP en el puerto 8000
  private apiPhpBase = 'http://localhost:8000';

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private http: HttpClient,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    // Leer rol de usuario (si guardaste en localStorage)
    const datos = localStorage.getItem('estudiante');
    if (datos) {
      const usuario = JSON.parse(datos);
      this.esAdmin = usuario.rol === 'admin';
    }

    // Cargar todo el catálogo al iniciar
    this.cargarPublicaciones();
  }

  /**
   * Obtiene el header con el JWT para enviar a Slim
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  /**
   * 1) Cargar todas las publicaciones sin filtros
   *    GET http://localhost:8000/catalogo (con auth)
   */
  cargarPublicaciones() {
    const url = `${this.apiPhpBase}/catalogo`;
    const headers = this.getAuthHeaders();

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        // Slim devuelve: { cantidad: number, datos: any[], mensaje: string }
        if (res && Array.isArray(res.datos)) {
          this.publicacionesOriginales = res.datos.map((item: any) => ({
            ...item,
            portada: item.imagen || 'assets/portadas/default.jpg',
            archivo: item.url_pdf || '#'
          }));
          this.publicaciones = [...this.publicacionesOriginales];
        } else {
          console.warn('Respuesta inesperada al cargar catálogo:', res);
          this.publicacionesOriginales = [];
          this.publicaciones = [];
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar catálogo desde PHP:', err);
        this.publicacionesOriginales = [];
        this.publicaciones = [];
      }
    });
  }

  /**
   * 2) Mostrar u ocultar el panel de filtros
   */
  toggleFiltros() {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  /**
   * 3) Aplicar filtros de tipo y/o categoría
   *    GET http://localhost:8000/catalogo/filtro?tipo=...&categoria=...
   */
  aplicarFiltros() {
    let params = new HttpParams();
    if (this.tipo.trim().length > 0) {
      params = params.set('tipo', this.tipo.trim());
    }
    if (this.categorias.length > 0) {
      const categoriasJoined = this.categorias
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0)
        .join(',');
      if (categoriasJoined.length > 0) {
        params = params.set('categoria', categoriasJoined);
      }
    }

    const url = `${this.apiPhpBase}/catalogo/filtro`;
    const headers = this.getAuthHeaders();

    this.http.get<any>(url, { headers, params }).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.datos)) {
          this.publicaciones = res.datos.map((item: any) => ({
            ...item,
            portada: item.imagen || 'assets/portadas/default.jpg',
            archivo: item.url_pdf || '#'
          }));
        } else {
          console.warn('Respuesta inesperada al filtrar catálogo:', res);
          this.publicaciones = [];
        }
      },
      error: (err) => {
        console.error('❌ Error al filtrar catálogo desde PHP:', err);
        this.publicaciones = [];
      }
    });
  }

  /**
   * 4) Buscar por título
   *    Filtrado en frontend sobre publicacionesOriginales
   */
  buscarPorTitulo(event: any) {
    const valor = event.detail.value.trim().toLowerCase();
    if (valor.length === 0) {
      this.publicaciones = [...this.publicacionesOriginales];
      return;
    }
    this.publicaciones = this.publicacionesOriginales.filter((pub: any) =>
      pub.titulo.toLowerCase().includes(valor)
    );
  }

  /**
   * 5) Abrir PDF en un lector
   */
 abrirPDF(pub: any) {
    this.router.navigate(['/lector'], {
      queryParams: {
        id: pub.id,
        archivo: pub.archivo_pdf,
        titulo: pub.titulo
      }
    });
  }

  /**
   * 6) Eliminar publicación (solo si esAdmin)
   *    Por ahora, solo eliminamos del frontend
   */
  async eliminarPublicacion(index: number) {
  const publicacion = this.publicaciones[index];

  const modal = await this.modalCtrl.create({
    component: ConfirmarEliminacionComponent,
    componentProps: { titulo: publicacion.titulo }
  });
  await modal.present();

  const { role } = await modal.onDidDismiss();
  if (role === 'confirmar') {
    try {
      await this.http.delete(`http://localhost:3000/api/publicaciones/eliminar-publicacion/${publicacion.id}`).toPromise();

      // Eliminar del array solo si la petición fue exitosa
      this.publicaciones.splice(index, 1);
    } catch (error) {
      console.error('❌ Error al eliminar:', error);
    }
  }
}


  /**
   * 7) Editar publicación (para admin)
   */
  editarPublicacion(index: number) {
    const publicacion = this.publicaciones[index];
    this.router.navigate(['/agregar-publicacion'], {
      queryParams: {
        modo: 'editar',
        id: publicacion.id,
        titulo: publicacion.titulo,
        descripcion: publicacion.descripcion,
        imagen: publicacion.imagen,
        tipo: publicacion.tipo,
        categoria: publicacion.categoria,
        disponible: publicacion.disponible,
        fecha_registro: publicacion.fecha_registro
      }
    });
  }

  /**
   * 8) Ir a página de creación (para admin)
   */
  agregarPublicacion() {
    this.navCtrl.navigateForward('/agregar-publicacion');
  }
}
