import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));


 
const originalConsoleWarn = console.warn;

console.warn = (message?: any, ...optionalParams: any[]) => {
 
  if (typeof message === 'string' && message.includes('strokeDashoffset')) {
    return; 
  }
  
  originalConsoleWarn(message, ...optionalParams);
};
