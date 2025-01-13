import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
  styleUrl: './customer-detail.component.scss',
  encapsulation: ViewEncapsulation.None,
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
      this.customer = new Customer(data); // Kundeninformationen laden
      console.log('Customer loaded:', this.customer); // Optional: Debugging
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
        this.getCustomer();
      }
    });
  }


  
  
  updateCustomerStatus(newStatus: 'active' | 'inactive' | 'pending' | 'new') {
    if (!this.customer || !this.customer.id) {
      console.warn('Customer or Customer ID is null, cannot update status.');
      return;
    }
  
    const customerDoc = doc(this.firestore, `customers/${this.customer.id}`);
    updateDoc(customerDoc, { status: newStatus })
      .then(() => {
        console.log('Customer status updated to:', newStatus);
        this.customer.status = newStatus;
      })
      .catch((error) => {
        console.error('Error updating customer status:', error);
      });
  }
  
  
  
   

 

  addOrEditProfilePicture() {
    const dialogRef = this.dialog.open(DialogAddPictureComponent, {
      data: { id: this.customerId, type: 'customer' }
    });
  
    dialogRef.afterClosed().subscribe((imageUrl: string) => {
      if (imageUrl) {
        this.customer.profilePicture = imageUrl;
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
