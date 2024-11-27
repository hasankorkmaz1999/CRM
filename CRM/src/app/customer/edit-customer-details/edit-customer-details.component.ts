import { Component, Inject, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { Customer } from '../../../models/customer.class';

@Component({
  selector: 'app-edit-customer-details',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './edit-customer-details.component.html',
  styleUrl: './edit-customer-details.component.scss'
})
export class EditCustomerDetailsComponent implements OnInit {
  customerForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditCustomerDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { customer: Customer; customerId: string },
    private fb: FormBuilder,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    const customer = this.data.customer;

    // Initialisiere das Formular mit den Daten des Kunden
    this.customerForm = this.fb.group({
      firstName: [customer.firstName, Validators.required],
      lastName: [customer.lastName, Validators.required],
      email: [customer.email, [Validators.required, Validators.email]],
      phone: [customer.phone, Validators.required],
      street: [customer.address.street],
      city: [customer.address.city],
      zipCode: [customer.address.zipCode],
      country: [customer.address.country],
      notes: [customer.notes],
    });
  }

  async save() {
    if (this.customerForm.valid) {
      const formValue = this.customerForm.value;
  
      // Überprüfe und konvertiere `createdAt` in ein gültiges Date-Objekt oder Timestamp
      let createdAt = this.data.customer.createdAt;
      if (typeof createdAt === 'string') {
        createdAt = new Date(createdAt); // Konvertiere String zu Date
      }
  
      if (isNaN(createdAt.getTime())) {
        // Fallback: Wenn `createdAt` ungültig ist, setze es auf das aktuelle Datum
        createdAt = new Date();
      }
  
      const updatedCustomer = {
        ...this.data.customer,
        ...formValue,
        createdAt: createdAt.toISOString(), // In Firestore-kompatibles Format konvertieren
        address: {
          street: formValue.street,
          city: formValue.city,
          zipCode: formValue.zipCode,
          country: formValue.country,
        },
      };
  
      try {
        const customerDoc = doc(this.firestore, `customers/${this.data.customerId}`);
        await updateDoc(customerDoc, updatedCustomer); // Update in Firestore
        console.log('Customer updated:', updatedCustomer);
        this.dialogRef.close(true); // Schließe den Dialog
      } catch (error) {
        console.error('Error updating customer:', error);
      }
    }
  }
  
}