import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Log } from '../../models/logs.class';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  constructor(private firestore: Firestore) {}

  // Allgemeine Log-Methode
  async log(action: string, entityType: string, details: any) {
    const log = new Log({
      action,
      entityType,
      details,
    });

    const logsCollection = collection(this.firestore, 'logs');
    try {
      await addDoc(logsCollection, { ...log });
      console.log('Log saved:', log);
    } catch (error) {
      console.error('Error saving log:', error);
    }
  }

  // Spezifische Methode für Benutzeraktionen
  async logUserAction(action: 'add' | 'edit' | 'delete', user: any) {
    const logDetails = {
      id: user.uid || 'unknown',
      name: `${user.firstName || 'Unknown'} ${user.lastName || 'User'}`.trim(),
    };

    await this.log(action, 'user', logDetails); // Nutzt die allgemeine Log-Methode
  }


  async logCustomerAction(action: 'add' | 'edit' | 'delete', customer: { id: string; name: string }) {
    const logDetails = {
      id: customer.id || 'unknown',
      name: customer.name || 'Unknown Customer',
    };
  
    await this.log(action, 'customer', logDetails);
  }


  async logEventAction(action: 'add' | 'edit' | 'delete', event: { id: string; type: string }) {
    const logDetails = {
      id: event.id || 'unknown',
      name: event.type || 'Unknown Event',
    };
  
    await this.log(action, 'event', logDetails);
  }
  
  
}
