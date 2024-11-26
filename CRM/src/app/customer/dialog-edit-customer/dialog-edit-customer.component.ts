import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Customer } from '../../../models/customer.class';

@Component({
  selector: 'app-dialog-edit-customer',
  standalone: true,
  imports: [],
  templateUrl: './dialog-edit-customer.component.html',
  styleUrl: './dialog-edit-customer.component.scss',
})
export class DialogEditAddressComponent {
  customer!: Customer; // Non-Null Assertion Operator
  customerId!: string; // Non-Null Assertion Operator

  constructor(
    public dialogRef: MatDialogRef<DialogEditAddressComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { customer: Customer; customerId: string }
  ) {
    this.customer = data.customer; // Initialisierung mit übergebenen Daten
    this.customerId = data.customerId;
  }

  saveAddress() {
    console.log('Address saved for:', this.customerId, this.customer);
    this.dialogRef.close(this.customer); // Schließe den Dialog und sende die geänderten Daten zurück
  }
}
