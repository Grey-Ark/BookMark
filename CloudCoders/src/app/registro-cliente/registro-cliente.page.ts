import { Component} from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HttpClientModule, NavbarComponent],
  templateUrl: './registro-cliente.page.html',
  styleUrls: ['./registro-cliente.page.scss'],
})
export class RegistroClientePage {
  correoPersonal: string = '';
  contrasena: string = '';

  apiUrl = 'http://localhost:8000/registro';

  constructor(private navCtrl: NavController, private http: HttpClient) {}

  // Método de registro de cliente
  register() {
    const userData = {
      email: this.correoPersonal,
      password: this.contrasena,
    };
  
    this.http.post(this.apiUrl, userData).subscribe(
      (response: any) => {
        console.log('Registro exitoso:', response);
        alert(response.mensaje || 'Registro exitoso');
    
        const esAdmin = this.correoPersonal.startsWith('admin@');
    
        const clienteConRol = {
          email: this.correoPersonal,
          userId: response.userId,
          rol: esAdmin ? 'admin' : 'usuario',
        };
    
        localStorage.setItem('estudiante', JSON.stringify(clienteConRol));
        this.navCtrl.navigateRoot('/');
      },
      (error) => {
        console.error('Error en el registro:', error);
        alert(error.error?.error || 'Error en el registro');
      }
    );
  }
  
  // Método para volver a la pantalla de login
  goBack() {
    this.navCtrl.navigateBack('/'); // Regresar a la pantalla de login
  }
}