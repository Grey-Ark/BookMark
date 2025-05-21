import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonicModule, NavController } from '@ionic/angular';

@Component({
  selector: 'app-confirmar-eliminacion',
  templateUrl: './confirmar-eliminacion.component.html',
  styleUrls: ['./confirmar-eliminacion.component.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class ConfirmarEliminacionComponent {
  @Input() titulo: string = '';

  constructor(private modalCtrl: ModalController) {}

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancelar');
  }

  confirmar() {
    this.modalCtrl.dismiss(true, 'confirmar');
  }
}
