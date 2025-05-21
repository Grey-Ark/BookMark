import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LectorPage } from './lector.page';

describe('LectorPage', () => {
  let component: LectorPage;
  let fixture: ComponentFixture<LectorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LectorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
