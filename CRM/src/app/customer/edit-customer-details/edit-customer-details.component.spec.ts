import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCustomerDetailsComponent } from './edit-customer-details.component';

describe('EditCustomerDetailsComponent', () => {
  let component: EditCustomerDetailsComponent;
  let fixture: ComponentFixture<EditCustomerDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCustomerDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditCustomerDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
