import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));


 
  const originalConsoleWarn = console.warn;

  console.warn = (message?: any, ...optionalParams: any[]) => {
    // Falls die Nachricht ein String ist und "BloomFilterError" oder "strokeDashoffset" enthält, unterdrücken
    if (typeof message === 'string' && (message.includes('strokeDashoffset') || message.includes('BloomFilterError'))) {
      return;
    }
  
    // Falls die Nachricht ein Objekt ist und den Fehler enthält, unterdrücken
   

    if (typeof message === 'string' && (message.includes('BloomFilterError') || message.includes('BloomFilterError'))) {
      return;
    }
  
    // Alle anderen Warnungen normal anzeigen
    originalConsoleWarn(message, ...optionalParams);
  };
  