import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularCalendarComponent } from './angular-calendar.component';

describe('AngularCalendarComponent', () => {
  let component: AngularCalendarComponent;
  let fixture: ComponentFixture<AngularCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularCalendarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AngularCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
