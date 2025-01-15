import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { Customer } from '../../../models/customer.class';
import { LoggingService } from '../../shared/logging.service';
import { SnackbarService } from '../../shared/snackbar.service';

@Component({
  selector: 'app-edit-customer-details',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './edit-customer-details.component.html',
  styleUrl: './edit-customer-details.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class EditCustomerDetailsComponent implements OnInit {
  customerForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditCustomerDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { customer: Customer; customerId: string },
    private fb: FormBuilder,
    private firestore: Firestore,
    private snackbarService: SnackbarService,
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
      
     
    });
  }

  async save() {
    if (this.customerForm.valid) {
      const formValue = this.customerForm.value;
  
      // Nur die veränderbaren Felder aktualisieren, `createdAt` bleibt unverändert
      const updatedCustomer = {
        ...formValue,
        address: {
          street: formValue.street,
          city: formValue.city,
          zipCode: formValue.zipCode,
        
        },
      };
  
      try {
        const customerDoc = doc(this.firestore, `customers/${this.data.customerId}`);
        await updateDoc(customerDoc, updatedCustomer); // Update in Firestore
        console.log('Customer updated:', updatedCustomer);
  
       
  
        this.dialogRef.close(true);
        
        this.snackbarService.showActionSnackbar('customer', 'update');// Schließe den Dialog
      } catch (error) {
        console.error('Error updating customer:', error);
      }
    }
  }
  

 
}