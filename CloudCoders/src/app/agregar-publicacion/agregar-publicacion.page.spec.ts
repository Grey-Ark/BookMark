import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgregarPublicacionPage } from './agregar-publicacion.page';

describe('AgregarPublicacionPage', () => {
  let component: AgregarPublicacionPage;
  let fixture: ComponentFixture<AgregarPublicacionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgregarPublicacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
