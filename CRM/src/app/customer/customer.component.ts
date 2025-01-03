import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DialogAddCustomerComponent } from './dialog-add-customer/dialog-add-customer.component';
import { MatDialog } from '@angular/material/dialog';
import { Firestore, collection, collectionData, doc, deleteDoc } from '@angular/fire/firestore';
import { Customer } from '../../models/customer.class';
import { LoggingService } from '../shared/logging.service';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { ActivatedRoute } from '@angular/router';

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
    ) {}

  ngOnInit(): void {
    this.loadCustomers();


    this.route.queryParams.subscribe((params) => {
      if (params['addCustomer'] === 'true') {
        this.openAddDialog();
      }
    });
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

 

  openDeleteDialog(customer: Customer) {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      autoFocus: false, 
      data: {
        type: 'customer',
        name: `${customer.firstName} ${customer.lastName}`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const customerDoc = doc(this.firestore, `customers/${customer.id}`);
        deleteDoc(customerDoc)
          .then(() => {
            console.log(`Customer ${customer.firstName} ${customer.lastName} deleted`);
            this.logCustomerDeletion(customer); // Logge die Löschaktion
            this.loadCustomers(); // Aktualisiere die Liste nach dem Löschen
          })
          .catch((error) => {
            console.error('Error deleting customer:', error);
          });
      }
    });
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
