import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadsCommentsComponent } from './threads-comments.component';

describe('ThreadsCommentsComponent', () => {
  let component: ThreadsCommentsComponent;
  let fixture: ComponentFixture<ThreadsCommentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadsCommentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThreadsCommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
