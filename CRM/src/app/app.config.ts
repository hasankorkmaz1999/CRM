import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MatNativeDateModule } from '@angular/material/core'; // Wichtig!
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { importProvidersFrom } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore'; // Neu importiert!

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom(MatNativeDateModule),
    importProvidersFrom(
      provideFirebaseApp(() =>
        initializeApp({
          projectId: 'crm1-9fda4',
          appId: '1:352496201349:web:9219d8671f3db1c3e003ec',
          storageBucket: 'crm1-9fda4.firebasestorage.app',
          apiKey: 'AIzaSyBE4L3ciJ2mae2bplSv_oJEz5lfucAABFs',
          authDomain: 'crm1-9fda4.firebaseapp.com',
          messagingSenderId: '352496201349',
        })
      )
    ),
    importProvidersFrom(provideFirestore(() => getFirestore())), // Hier wird MatNativeDateModule hinzugefügt
  ],
};
 