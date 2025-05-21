import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { NavbarComponent } from '../navbar/navbar.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, NavbarComponent, HttpClientModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  correo_personal: string = '';
  password: string = '';
  apiUrl = 'http://localhost:8000/login';

  constructor(private navCtrl: NavController, private http: HttpClient) {}

  login() {
    if (!this.correo_personal || !this.password) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    const loginData = {
      email: this.correo_personal,
      password: this.password,
    };

    this.http.post<{ message: string; token: string; cliente: any }>(this.apiUrl, loginData)
      .subscribe({
        next: (response) => {
          console.log('✅ Login exitoso:', response);

          // Guardar el token en localStorage
          localStorage.setItem('authToken', response.token);

          // Guardar los datos del estudiante en localStorage
          localStorage.setItem('cliente', JSON.stringify(response.cliente));

          alert('Inicio de sesión exitoso');
          this.navCtrl.navigateRoot('/home'); // Redirige al Home
        },
        error: (err) => {
          console.error('❌ Error al iniciar sesión:', err);
          alert('Matrícula o contraseña incorrecta.');
        },
      });
  }

  goToRegister() {
    this.navCtrl.navigateForward('/registro-cliente');
  }
}
