import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, docData, updateDoc } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Customer } from '../../../models/customer.class';
import { Location } from '@angular/common';

import { DialogAddPictureComponent } from '../../dialog-add-picture/dialog-add-picture.component';
import { EditCustomerDetailsComponent } from '../edit-customer-details/edit-customer-details.component';


@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.scss'
})
export class CustomerDetailComponent implements OnInit {
  customerId = '';
  customer: Customer = new Customer(); 

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    public dialog: MatDialog,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((paramMap) => {
      this.customerId = paramMap.get('id') ?? '';
      console.log('Got Customer ID:', this.customerId);
      this.getCustomer();
    });
  }

  getCustomer() {
    const customerDoc = doc(this.firestore, `customers/${this.customerId}`);
    docData(customerDoc).subscribe((data: any) => {
      this.customer = new Customer(data);
      console.log('Fetched customer data:', this.customer);
    });
  }

  editCustomerDetails() {
    const dialogRef = this.dialog.open(EditCustomerDetailsComponent, {
      data: {
        customer: this.customer,
        customerId: this.customerId,
      },
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Customer details updated.');
        this.getCustomer(); // Aktualisiere die Anzeige
      }
    });
  }
  
  

 

  addOrEditProfilePicture() {
    const dialogRef = this.dialog.open(DialogAddPictureComponent, {
      data: { id: this.customerId, type: 'customer' } // Typ ist 'customer'
    });
  
    dialogRef.afterClosed().subscribe((imageUrl: string) => {
      if (imageUrl) {
        this.customer.profilePicture = imageUrl; // Aktualisiere das lokale Kundenobjekt
        console.log('Customer profile picture updated:', imageUrl);
      }
    });
  }
  
  

  getProfilePictureButtonLabel(): string {
    return this.customer.profilePicture ? 'Edit picture' : 'Add picture';
  }


  goBack() {
    this.location.back();
  }
  
  
  
}
