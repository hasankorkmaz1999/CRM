import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEditUserComponent } from './dialog-edit-user.component';
import { Firestore, getFirestore, provideFirestore } from '@angular/fire/firestore';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('DialogEditUserComponent', () => {
  let component: DialogEditUserComponent;
  let fixture: ComponentFixture<DialogEditUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogEditUserComponent, BrowserAnimationsModule],
      providers: [
        importProvidersFrom(
          provideFirebaseApp(() =>
            initializeApp({
              apiKey: 'AIzaSyBE4L3ciJ2mae2bplSv_oJEz5lfucAABFs',
              authDomain: 'crm1-9fda4.firebaseapp.com',
              projectId: 'crm1-9fda4',
              storageBucket: 'crm1-9fda4.appspot.com',
              messagingSenderId: '352496201349',
              appId: '1:352496201349:web:9219d8671f3db1c3e003ec',
            })
          ),
          provideFirestore(() => getFirestore())
        ),
      ],
    }).compileComponents();
    
    fixture = TestBed.createComponent(DialogEditUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
