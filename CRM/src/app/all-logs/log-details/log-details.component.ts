import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-log-details',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './log-details.component.html',
  styleUrls: ['./log-details.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LogDetailsComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  // Rückgabetyp explizit angeben
  objectKeys(obj: Record<string, any> | undefined): string[] {
    return obj ? Object.keys(obj) : [];
  }

  // Function to format values (Date or String)
  formatValue(value: any): string {
    if (!value) return 'Unknown';
  
    // Prüfe, ob der Wert ein Firestore Timestamp ist (Firestore Sekundenformat)
    if (value.seconds) {
      const date = new Date(value.seconds * 1000);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  
    // Prüfe, ob der Wert ein ISO-Datumsstring ist oder ein normales Datum
    if (typeof value === 'string' || value instanceof Date) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    }
  
    // Gib den Wert zurück, wenn er nicht formatiert werden kann
    return value.toString();
  }
  
}
