import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogEditAddressComponent } from './dialog-edit-address.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('DialogEditAddressComponent', () => {
  let component: DialogEditAddressComponent;
  let fixture: ComponentFixture<DialogEditAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogEditAddressComponent, BrowserAnimationsModule],
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

    fixture = TestBed.createComponent(DialogEditAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
