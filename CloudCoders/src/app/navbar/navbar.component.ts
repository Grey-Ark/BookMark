import { Component, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Agrega esta línea
})
export class NavbarComponent  {

  menuOpen = false;
  event: any;

  constructor(private popoverController: PopoverController) {}

  openMenu(ev: any) {
    this.event = ev;
    this.menuOpen = true;
  }

  verVehiculos() {
    console.log("Ver vehículos");
    this.menuOpen = false;
  }

  editarVehiculos() {
    console.log("Editar vehículos");
    this.menuOpen = false;
  }

  salir() {
    console.log("Salir de la app");
    this.menuOpen = false;
  }

}

