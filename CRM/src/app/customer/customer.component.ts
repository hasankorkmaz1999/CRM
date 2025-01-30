import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DialogAddCustomerComponent } from './dialog-add-customer/dialog-add-customer.component';
import { MatDialog } from '@angular/material/dialog';
import { Firestore, collection, collectionData, doc, deleteDoc } from '@angular/fire/firestore';
import { Customer } from '../../models/customer.class';
import { LoggingService } from '../shared/logging.service';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../shared/snackbar.service';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss',
 
})
export class CustomerComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  searchQuery: string = '';
  

  constructor(
    private firestore: Firestore,
     private dialog: MatDialog,
     private loggingService: LoggingService,
     private route: ActivatedRoute,
     private router: Router,
     private snackbarService: SnackbarService,
    ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.route.queryParams.subscribe((params) => {
      if (params['addCustomer'] === 'true') {
        this.openAddDialog();
      }
    });
  }

  navigateToCustomer(customerId: string): void {
    if (customerId) {
      this.router.navigate(['/customer', customerId]);
    } else {
      console.error('Invalid customer ID.');
    }
  }
  
  loadCustomers() {
    const customerCollection = collection(this.firestore, 'customers');
    collectionData(customerCollection, { idField: 'id' }).subscribe((data) => {
      this.customers = data.map((customerData) => new Customer(customerData));
      this.customers.sort((a, b) => a.firstName.localeCompare(b.firstName));
      this.filteredCustomers = [...this.customers];
    });
  }

  filterCustomers() {
    const query = this.searchQuery.toLowerCase();
    this.filteredCustomers = this.customers
      .filter((customer) =>
        customer.firstName.toLowerCase().includes(query) ||
        customer.lastName.toLowerCase().includes(query)
      )
      .sort((a, b) => a.firstName.localeCompare(b.firstName)); 
  }

  openDeleteDialog(event: Event, customer: any): void {
    const buttonElement = document.activeElement as HTMLElement;
    if (buttonElement) {
      buttonElement.blur();
    }
    event.stopPropagation(); 
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      autoFocus: false, 
      data: { type: 'customer', name: `${customer.firstName} ${customer.lastName}` },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteCustomer(customer.id, `${customer.firstName} ${customer.lastName}`);
      }
    });
  }
  
  openAddDialog(): void {
    const buttonElement = document.activeElement as HTMLElement;
    if (buttonElement) {
      buttonElement.blur();
    }
    const dialogRef = this.dialog.open(DialogAddCustomerComponent, {
      autoFocus: false, 
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCustomers(); 
      }
    });
  }
  
  deleteCustomer(customerId: string, customerName: string): void {
    const customerDoc = doc(this.firestore, `customers/${customerId}`);
    deleteDoc(customerDoc)
      .then(() => {
        this.loggingService.logCustomerAction('delete', { id: customerId, name: customerName });
        this.snackbarService.showActionSnackbar('customer', 'delete');
      })
      .catch((error) => {
        console.error('Error deleting customer:', error);
      });
  }
  
}
