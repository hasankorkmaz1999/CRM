export class Event {
  id?: string;
 
  date: Date;
  users: string[]; // Namen der Benutzer
  description?: string;
  createdAt?: Date;
  type: string; // Hinzugefügtes Feld für den Event-Typ

  constructor(data: any) {
    this.id = data.id || '';
  
    this.date = new Date(data.date) || new Date();
    this.users = data.users || [];
    this.description = data.description || '';
    this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
    this.type = data.type || 'Other'; // Standardwert, falls kein Typ angegeben wird
  }
}
