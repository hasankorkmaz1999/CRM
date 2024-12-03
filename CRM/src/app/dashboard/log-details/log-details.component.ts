import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-log-details',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './log-details.component.html',
  styleUrls: ['./log-details.component.scss'],
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

    // Check if the value is a string
    if (typeof value === 'string') {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
      }
      return value; // If not a date, return as string
    }

    if (value.seconds) {
      // Handle Firestore Timestamp
      const date = new Date(value.seconds * 1000);
      return date.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    }

    return value.toString(); // Fallback to string
  }
}
