import { Component, Inject, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { Customer } from '../../../models/customer.class';
import { LoggingService } from '../../shared/logging.service';

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
    private firestore: Firestore,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    const customer = this.data.customer;

    // Initialisiere das Formular mit den Daten des Kunden
    this.customerForm = this.fb.group({
      firstName: [customer.firstName],
      lastName: [customer.lastName],
      email: [customer.email],
      phone: [customer.phone],
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

      const updatedCustomer = {
        ...this.data.customer,
        ...formValue,
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

        // Logge die Aktion
        this.logCustomerAction('edit', this.data.customerId, updatedCustomer);

        this.dialogRef.close(true); // Schließe den Dialog
      } catch (error) {
        console.error('Error updating customer:', error);
      }
    }
  }

  logCustomerAction(action: string, customerId: string, updatedCustomer: any) {
    this.loggingService.log(action, 'customer', {
      id: customerId,
      firstName: updatedCustomer.firstName,
      lastName: updatedCustomer.lastName,
      email: updatedCustomer.email,
    });
  }
}