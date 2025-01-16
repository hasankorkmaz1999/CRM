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

    const actionText = this.getActionText(action);
    const logMessage = `User ${logDetails.name} has been ${actionText}.`;
    await this.log(action, 'user', { ...logDetails, message: logMessage });
  }

  // Spezifische Methode für Kundenaktionen
  async logCustomerAction(action: 'add' | 'edit' | 'delete', customer: { id: string; name: string }) {
    const logDetails = {
      id: customer.id || 'unknown',
      name: customer.name || 'Unknown Customer',
    };

    const actionText = this.getActionText(action);
    const logMessage = `Customer ${logDetails.name} has been ${actionText}.`;
    await this.log(action, 'customer', { ...logDetails, message: logMessage });
  }

  // Spezifische Methode für Event-Aktionen
  async logEventAction(action: 'add' | 'edit' | 'delete', event: { id: string; type: string }) {
    const logDetails = {
      id: event.id || 'unknown',
      name: event.type || 'Unknown Event',
    };

    const actionText = this.getActionText(action);
    const logMessage = `Event ${logDetails.name} has been ${actionText}.`;
    await this.log(action, 'event', { ...logDetails, message: logMessage });
  }

  // Spezifische Methode für Kaufaktionen
  async logPurchaseAction(action: 'add' | 'edit' | 'delete', purchase: any, customerName: string, createdBy: string) {
    const logDetails = {
      purchaseId: purchase.id,
      productName: purchase.productName,
      quantity: purchase.quantity,
      purchaseType: purchase.purchaseType,
      totalPrice: purchase.totalPrice,
      customerName: customerName,
      createdBy: createdBy,
    };
  
    // Extract the first names
    const customerFirstName = customerName.split(' ')[0]; // Take the first word from the customer's name
    const createdByFirstName = createdBy.split(' ')[0]; // Take the first word from the creator's name
  
    const actionText = this.getActionText(action);
    const logMessage = `New purchase of ${purchase.quantity}x ${purchase.productName} ${actionText} by ${createdByFirstName} for ${customerFirstName}.`;
  
    await this.log(action, 'purchase', { ...logDetails, message: logMessage });
  }
  

  // Hilfsmethode zum Übersetzen der Aktion in lesbaren Text
  private getActionText(action: 'add' | 'edit' | 'delete'): string {
    switch (action) {
      case 'add':
        return 'added';
      case 'edit':
        return 'edited';
      case 'delete':
        return 'deleted';
      default:
        return 'updated';
    }
  }

  // Methode zum Generieren einer Log-Nachricht (Fallback)
  generateLogMessage(log: any): string {
    if (log.details?.message) {
      return log.details.message;
    }

    const entityType = log.entityType
      ? log.entityType.charAt(0).toUpperCase() + log.entityType.slice(1)
      : 'Entity';
    const action = log.action || 'updated';
    const name = log.details?.name || 'Unknown';

    const actionText = this.getActionText(action as 'add' | 'edit' | 'delete');
    return `${entityType} ${name} has been ${actionText}.`;
  }
}

  

