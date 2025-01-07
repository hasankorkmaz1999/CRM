export class Todo {
  id?: string; // Optionale ID, die von Firestore generiert wird
 
  description?: string; // Beschreibung der Aufgabe
  completed: boolean; // Status der Aufgabe (erledigt oder nicht)
  createdAt: string ; // Erstellungsdatum kann ein String oder Date sein
  userId: string; // ID des Benutzers, dem die Aufgabe gehört
  

  constructor(obj?: any) {
    this.id = obj?.id;
   
    this.description = obj?.description || '';
    this.completed = obj?.completed || false;
    this.createdAt = obj?.createdAt || new Date().toISOString();// Immer in ein Date umwandeln
    this.userId = obj?.userId || '';
   
  }
}





