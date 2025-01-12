import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DialogAddCustomerComponent } from './dialog-add-customer/dialog-add-customer.component';
import { MatDialog } from '@angular/material/dialog';
import { Firestore, collection, collectionData, doc, deleteDoc } from '@angular/fire/firestore';
import { Customer } from '../../models/customer.class';
import { LoggingService } from '../shared/logging.service';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';

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
     private router: Router
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
      // Konvertiere die Daten in Customer-Objekte
      this.customers = data.map((customerData) => new Customer(customerData));

      // Sortiere alphabetisch nach Nachname (oder Vorname, falls gewünscht)
      this.customers.sort((a, b) => a.firstName.localeCompare(b.firstName));

      // Aktualisiere die gefilterten Kunden
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
      .sort((a, b) => a.firstName.localeCompare(b.firstName)); // Alphabetisch sortieren
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(DialogAddCustomerComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCustomers(); // Aktualisiere die Liste nach dem Hinzufügen
      }
    });
  }

 

  openDeleteDialog(event: Event, customer: any): void {
    event.stopPropagation(); // Verhindert das Auslösen von navigateToCustomer
    // Öffne den Delete-Dialog
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { type: 'customer', name: `${customer.firstName} ${customer.lastName}` },
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteCustomer(customer.id);
      }
    });
  }

  deleteCustomer(customerId: string): void {
    const customerDoc = doc(this.firestore, `customers/${customerId}`);
    deleteDoc(customerDoc)
      .then(() => console.log('Customer deleted successfully'))
      .catch((error) => console.error('Error deleting customer:', error));
  }
  
  

  logCustomerDeletion(customer: Customer) {
    // Logge die Löschaktion
    this.loggingService.log('delete', 'customer', {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
    });
  }
}
