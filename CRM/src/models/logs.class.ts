export class Log {
    timestamp: string; // Zeitpunkt der Aktion
    action: string; // Art der Aktion: 'add', 'edit', 'delete'
    entityType: string; // Typ des Objekts: 'user', 'customer', 'event'
    details: {
      id?: string; // Optional: ID des betroffenen Objekts
      name?: string; // Optional: Name des Objekts (z. B. Benutzername, Event-Typ)
      changes?: { // Optional: Änderungen im Falle von Bearbeitungen
        [key: string]: {
          old: any; // Alter Wert
          new: any; // Neuer Wert
        };
      };
    };
  
    constructor(obj?: any) {
      this.timestamp = obj?.timestamp || new Date().toISOString();
      this.action = obj?.action || '';
      this.entityType = obj?.entityType || '';
      this.details = obj?.details || {};
    }
  }
  