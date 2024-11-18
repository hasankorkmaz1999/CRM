import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddPictureComponent } from './dialog-add-picture.component';

describe('DialogAddPictureComponent', () => {
  let component: DialogAddPictureComponent;
  let fixture: ComponentFixture<DialogAddPictureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogAddPictureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogAddPictureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
