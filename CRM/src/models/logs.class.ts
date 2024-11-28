export class Log {
    timestamp: string; // Zeitpunkt der Aktion
    action: string; // Art der Aktion: 'add', 'edit', 'delete'
    entityType: string; // Typ des Objekts: 'user', 'customer', 'event'
    details: any; // Zusätzliche Informationen zur Aktion (z. B. Name, ID)
  
    constructor(obj?: any) {
      this.timestamp = obj?.timestamp || new Date().toISOString();
      this.action = obj?.action || '';
      this.entityType = obj?.entityType || '';
      this.details = obj?.details || {};
    }
  }
  