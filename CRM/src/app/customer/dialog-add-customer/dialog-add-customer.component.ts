import { Component, NgModule, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Firestore, collection, addDoc, updateDoc } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { LoggingService } from '../../shared/logging.service';

@Component({
  selector: 'app-dialog-add-customer',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './dialog-add-customer.component.html',
  styleUrl: './dialog-add-customer.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DialogAddCustomerComponent {
  customerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private dialogRef: MatDialogRef<DialogAddCustomerComponent>,
    private loggingService: LoggingService
  ) {
    this.customerForm = this.fb.group({
      firstName: [''], // Vorname
      lastName: [''], // Nachname
      email: [''], // E-Mail
      phone: [''], // Telefonnummer
      street: [''], // Adresse: Straße
      city: [''], // Adresse: Stadt
      zipCode: [''], // Adresse: Postleitzahl
      country: [''], // Adresse: Land
      notes: [''], // Zusätzliche Notizen
    });
  }

  async saveCustomer() {
    if (this.customerForm.valid) {
      const formData = this.customerForm.value;
  
      // Struktur des Kundenobjekts für Firestore
      const customerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        status: 'new',
      };
  
      try {
        const customerCollection = collection(this.firestore, 'customers');
        const customerDocRef = await addDoc(customerCollection, customerData); // Kunde in Firestore speichern
  
        // Die generierte ID zum gespeicherten Dokument hinzufügen
        await updateDoc(customerDocRef, { id: customerDocRef.id });
  
        console.log('Customer successfully saved with ID:', customerDocRef.id);
  
        // Logge die Aktion mit der hinzugefügten ID
        this.logCustomerAction('add', customerDocRef.id, { ...customerData, id: customerDocRef.id });
  
        // Schließe den Dialog und signalisiere dem Aufrufer, dass der Kunde hinzugefügt wurde
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error saving customer:', error);
      }
    } else {
      console.warn('Customer form is invalid.');
    }
  }
  


  logCustomerAction(action: string, customerId: string, customerData: any) {
    this.loggingService.log(action, 'customer', {
      id: customerId,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerData.email,
    });
  }
}
