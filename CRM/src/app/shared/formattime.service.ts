

export function formatTimeTo12Hour(time: string): string {
    if (!time) {
      console.error('Invalid time input:', time);
      return 'Invalid time'; // Rückgabe, falls die Eingabezeit leer oder ungültig ist
    }
  
    const [hours, minutes] = time.split(':').map((value) => parseInt(value, 10));
    if (isNaN(hours) || isNaN(minutes)) {
      console.error('Time parsing failed:', time);
      return 'Invalid time';
    }
  
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Konvertiere in 12-Stunden-Format
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${meridiem}`;
  }
  
  


  export function formatDateToLong(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  


  export function extractTimeFromString(time: string): [number, number] {
    if (!time) {
      console.error('Invalid time input:', time);
      return [0, 0]; // Standardwert für ungültige Eingabe
    }
  
    const [hourMinute, meridiem] = time.split(' ');
    let [hours, minutes] = hourMinute.split(':').map((value) => parseInt(value, 10));
  
    if (isNaN(hours) || isNaN(minutes)) {
      console.error('Time parsing failed:', time);
      return [0, 0]; // Standardwert für ungültige Eingabe
    }
  
    if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
  
    return [hours, minutes];
  }