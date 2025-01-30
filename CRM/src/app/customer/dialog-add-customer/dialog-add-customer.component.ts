import { Component, NgModule, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
} from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { LoggingService } from '../../shared/logging.service';
import { SnackbarService } from '../../shared/snackbar.service';

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
    private loggingService: LoggingService,
    private fb: FormBuilder,
    private firestore: Firestore,
    private dialogRef: MatDialogRef<DialogAddCustomerComponent>,
    private snackbarService: SnackbarService
  ) {
    this.customerForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      phone: [''],
      street: [''],
      city: [''],
      zipCode: [''],
    });
  }

  async saveCustomer() {
    if (!this.customerForm.valid) return;
    try {
      const customerData = this.createCustomerData();
      const customerId = await this.addCustomerToFirestore(customerData);
      await this.handlePostSaveActions(customerData, customerId);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  }

  private createCustomerData() {
    const formData = this.customerForm.value;
    return {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: {
        street: formData.street,
        city: formData.city,
        zipCode: formData.zipCode,
      },
      createdAt: new Date().toISOString(),
      status: 'new',
    };
  }

  private async addCustomerToFirestore(customerData: any): Promise<string> {
    const customerCollection = collection(this.firestore, 'customers');
    const customerDocRef = await addDoc(customerCollection, customerData);
    await updateDoc(customerDocRef, { id: customerDocRef.id });
    return customerDocRef.id;
  }
  
  private async handlePostSaveActions(customerData: any, customerId: string) {
    await this.loggingService.logCustomerAction('add', {
      id: customerId,
      name: `${customerData.firstName} ${customerData.lastName}`,
    });
    this.snackbarService.showActionSnackbar('customer', 'add');
  }
}
