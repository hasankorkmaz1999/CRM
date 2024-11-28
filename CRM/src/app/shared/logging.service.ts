import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  constructor(private firestore: Firestore) {}

  async log(action: string, entityType: string, details: any) {
    const newLog = {
      timestamp: new Date().toISOString(),
      action,
      entityType,
      details,
    };

    const logsCollection = collection(this.firestore, 'logs');
    try {
      await addDoc(logsCollection, newLog);
      console.log('Log saved:', newLog);
    } catch (error) {
      console.error('Error saving log:', error);
    }
  }
}
