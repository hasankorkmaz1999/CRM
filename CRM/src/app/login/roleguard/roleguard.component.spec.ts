import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleguardComponent } from './roleguard.component';

describe('RoleguardComponent', () => {
  let component: RoleguardComponent;
  let fixture: ComponentFixture<RoleguardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleguardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RoleguardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
