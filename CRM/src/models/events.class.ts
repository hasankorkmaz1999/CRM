export class Event {
    id?: string; // Optional, wenn es aus Firestore kommt
    title: string;
    date: Date;
    users: string[]; // Array von Benutzernamen oder IDs
    description?: string; // Optional, falls Events eine Beschreibung haben
    location?: string; // Optional, falls Events einen Ort haben
    createdAt?: Date; // Zeitstempel, wenn das Event erstellt wurde
  
    constructor(obj?: any) {
      this.id = obj?.id || ''; // ID aus Firestore
      this.title = obj?.title || '';
      this.date = obj?.date ? new Date(obj.date) : new Date(); // Umwandlung in ein Date-Objekt
      this.users = obj?.users || [];
      this.description = obj?.description || '';
      this.location = obj?.location || '';
      this.createdAt = obj?.createdAt ? new Date(obj.createdAt) : undefined;
    }
  }
  