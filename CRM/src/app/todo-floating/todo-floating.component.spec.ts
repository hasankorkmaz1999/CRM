import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodoFloatingComponent } from './todo-floating.component';

describe('TodoFloatingComponent', () => {
  let component: TodoFloatingComponent;
  let fixture: ComponentFixture<TodoFloatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoFloatingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TodoFloatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
