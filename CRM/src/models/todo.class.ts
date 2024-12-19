export class Todo {
    id?: string; // Optionale ID, die von Firestore generiert wird
    title: string; // Titel der Aufgabe
    description?: string; // Beschreibung der Aufgabe
    completed: boolean; // Status der Aufgabe (erledigt oder nicht)
    createdAt: Date; // Erstellungsdatum
    userId: string; // ID des Benutzers, dem die Aufgabe gehört
  
    constructor(data: Partial<Todo> = {}) {
      this.id = data.id;
      this.title = data.title || '';
      this.description = data.description || '';
      this.completed = data.completed || false;
      this.createdAt = data.createdAt || new Date();
      this.userId = data.userId || '';
    }
  }
  