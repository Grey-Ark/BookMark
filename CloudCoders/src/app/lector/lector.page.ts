import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-lector',
  templateUrl: './lector.page.html',
  styleUrls: ['./lector.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, PdfViewerModule, FormsModule, HttpClientModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LectorPage implements OnInit {
  archivo!: string;
  titulo!: string;
  contenidoId!: string;

  publicaciones: any[] = [];

  private apiPhpBase = 'http://localhost:8000';
  private apiPythonBase = 'http://localhost:4000';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    this.route.queryParams.subscribe(params => {
    const rawArchivo = params['archivo'] || '';
    // YA ES UNA RUTA COMPLETA tipo /uploads/aura.pdf
    this.archivo = `${this.apiPythonBase}${rawArchivo}`;
    this.titulo  = params['titulo']  || '';
    this.contenidoId = params['id']  || '';
    if (this.contenidoId) {
      this.marcarComoLeido(this.contenidoId);
    }
  });
}

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private marcarComoLeido(id: string): void {
    const url = `${this.apiPhpBase}/catalogo/${encodeURIComponent(id)}/leer`;
    this.http.post<any>(url, {}, { headers: this.getAuthHeaders() }).subscribe();
  }

  private cargarPublicaciones(): void {
    const url = `${this.apiPhpBase}/catalogo`;
    this.http.get<{ datos: any[] }>(url, { headers: this.getAuthHeaders() }).subscribe({
      next: res => {
        this.publicaciones = res.datos.map(item => ({
          ...item,
          portada: item.imagen
            ? `${this.apiPythonBase}${item.imagen.startsWith('/') ? '' : '/uploads/'}${item.imagen}`
            : 'assets/portadas/default.jpg',
          nombre_pdf: item.archivo_pdf
            ? item.archivo_pdf.replace('/uploads/', '') // extraer solo el nombre
            : ''
        }));
      }
    });
  }

  abrirPDF(pub: any) {
    this.router.navigate(['/lector'], {
      queryParams: {
        id: pub.id,
        archivo: pub.archivo_pdf,
        titulo: pub.titulo
      }
    });
  }
}
