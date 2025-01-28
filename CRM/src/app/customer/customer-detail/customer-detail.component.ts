import { Component, ElementRef, HostListener, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, docData, updateDoc } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Customer } from '../../../models/customer.class';
import { Location } from '@angular/common';
import { Purchase } from '../../../models/purchase.class';
import { DialogAddPictureComponent } from '../../dialog-add-picture/dialog-add-picture.component';
import { EditCustomerDetailsComponent } from '../edit-customer-details/edit-customer-details.component';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { LoggingService } from '../../shared/logging.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [SharedModule, NgxChartsModule],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CustomerDetailComponent implements OnInit {
  customerId = '';
  customer: Customer = new Customer(); 

 

  
  constructor(
    private loggingService: LoggingService,
    private route: ActivatedRoute,
    private firestore: Firestore,
    public dialog: MatDialog,
    private location: Location
  ) { this.updateChartDimensions();}

  ngOnInit(): void {
    this.route.paramMap.subscribe((paramMap) => {
      this.customerId = paramMap.get('id') ?? '';
     
      this.getCustomer();
    });
  }

  
  
  
  
  
  
  

  getCustomer() {
    const customerDoc = doc(this.firestore, `customers/${this.customerId}`);
    docData(customerDoc).subscribe((data: any) => {
      this.customer = new Customer(data);
      
      this.generateBarChartData();
    });
  }
  
  


  editCustomerDetails() {
    const buttonElement = document.activeElement as HTMLElement; // Get the currently focused element
    if (buttonElement) {
      buttonElement.blur(); // Remove focus from the button
    }
  
    const dialogRef = this.dialog.open(EditCustomerDetailsComponent, {
      data: {
        customer: this.customer,
        customerId: this.customerId,
      },
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
       
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
       
        this.customer.status = newStatus;
      })
      .catch((error) => {
        console.error('Error updating customer status:', error);
      });
  }
  
  
  
   

 

  addOrEditProfilePicture() {
    const buttonElement = document.activeElement as HTMLElement; // Get the currently focused element
    if (buttonElement) {
      buttonElement.blur(); // Remove focus from the button
    }
  
    const dialogRef = this.dialog.open(DialogAddPictureComponent, {
      data: { id: this.customerId, type: 'customer' }
    });
  
    dialogRef.afterClosed().subscribe((imageUrl: string) => {
      if (imageUrl) {
        this.customer.profilePicture = imageUrl;
      }
    });
  }
  
  
  

  getProfilePictureButtonLabel(): string {
    return this.customer.profilePicture ? 'Edit picture' : 'Add picture';
  }


  goBack() {
    this.location.back();
  }


  selectedProduct: 'Product A' | 'Product B' | 'Product C' = 'Product A';
  purchaseQuantity: number = 1;
  purchaseType: 'Online' | 'In-Store' | 'Subscription' = 'Online'; 

  addPurchase(
    productName: 'Product A' | 'Product B' | 'Product C',
    quantity: number,
    purchaseType: 'Online' | 'In-Store' | 'Subscription'
  ): void {
    if (!productName || quantity <= 0) {
      console.warn('Invalid product or quantity');
      return;
    }
  
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const createdBy = currentUser?.name || 'Unknown User';
  
    console.log('Current User:', currentUser); // Debug: Prüfen, ob der Benutzer korrekt geladen wurde
  
    const customerName = `${this.customer.firstName || 'Unknown'} ${this.customer.lastName || ''}`.trim();
    console.log('Customer Name:', customerName); // Debug: Prüfen, ob der Kundenname korrekt geladen wurde
  
    const newPurchase = {
      id: this.generateUniqueId(),
      productName: productName,
      quantity: quantity,
      purchaseType: purchaseType,
      createdBy: createdBy,
      
      price: this.getPrice(productName), 
      purchaseDate: new Date().toISOString(), 
      totalPrice: this.getPrice(productName) * quantity,
    };
  
    if (!this.customer.purchases) {
      this.customer.purchases = [];
    }
    this.customer.purchases.push(newPurchase);
  
    const customerDoc = doc(this.firestore, `customers/${this.customerId}`);
    updateDoc(customerDoc, { purchases: this.customer.purchases })
      .then(async () => {
        console.log('Purchase successfully added:', newPurchase);
  
        // Log über LoggingService erstellen
        await this.loggingService.logPurchaseAction('add', newPurchase, customerName, createdBy);
  
        // Snackbar anzeigen
        this.showSnackbarPurchase();
  
        // Formular zurücksetzen
        this.resetForm();
      })
      .catch((error) => console.error('Error adding purchase:', error));
  }
  



  

  showSnackbarPurchase(): void {
    const snackbar = document.getElementById('snackbar-purchase');
    if (snackbar) {
      snackbar.classList.add('show');
      setTimeout(() => {
        snackbar.classList.remove('show');
      }, 2000); 
    }
  }
  


  private resetForm(): void {
    this.selectedProduct = 'Product A';
    this.purchaseQuantity = 1;
    this.purchaseType = 'Online';
  }
  
  
 
  private getPrice(productName: 'Product A' | 'Product B' | 'Product C'): number {
    const productPrices = {
      'Product A': 50,
      'Product B': 100,
      'Product C': 150,
    };
    return productPrices[productName];
  }
  



  
 
  private generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9); 
  }






  getTotalSpent(): number {
    if (!this.customer.purchases) return 0;
    return this.customer.purchases.reduce((total, purchase) => total + purchase.totalPrice, 0);
  }
  
  getAveragePurchaseValue(): string {
    if (!this.customer.purchases || this.customer.purchases.length === 0) return '0.00';
    const avgValue = this.getTotalSpent() / this.customer.purchases.length;
    return avgValue.toFixed(2); 
  }
  
  getMostPurchasedProduct(): string | null {
    if (!this.customer.purchases || this.customer.purchases.length === 0) return null;
  
    const productCount: { [key: string]: number } = {};
    this.customer.purchases.forEach((purchase) => {
      if (!productCount[purchase.productName]) {
        productCount[purchase.productName] = 0;
      }
      productCount[purchase.productName] += purchase.quantity;
    });
  
    return Object.keys(productCount).reduce((a, b) =>
      productCount[a] > productCount[b] ? a : b
    );
  }
  

  @HostListener('window:resize', ['$event']) // Überwache die Fenstergröße
  onResize(): void {
    this.updateChartDimensions();
  }

  updateChartDimensions(): void {
    const screenWidth = window.innerWidth;
  
    // Breakpoints für die Chart-Breite
    if (screenWidth <= 420) {
      this.view = [250, 400]; // Maximale Breite für kleine Geräte
    } else if (screenWidth <= 490) {
      this.view = [340, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 600) {
      this.view = [400, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 740) {
      this.view = [450, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 830) {
      this.view = [550, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 930) {
      this.view = [650, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 1020) {
      this.view = [700, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 1200) {
      this.view = [750, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 1600) {
      this.view = [1000, 400]; // Standardbreite für Desktops bis 1770px
    } else if (screenWidth <= 1800) {
      this.view = [1200, 400]; // Große Desktops bis 1920px
    } else if (screenWidth <= 1890) {
      this.view = [1400, 400]; // Sehr große Desktops bis 2070px
    } else {
      this.view = [1000, 400]; // Extra große Geräte (über 2070px)
    }
  }



  updateChartView(): void {
  
  }
  
 
  view: [number, number] = [1000, 400]; 
  
  barChartData: any[] = [];
  colorScheme = {
    name: 'customScheme',
    selectable: true, 
    group: ScaleType.Ordinal,
    domain: ['#3BADEB', '#F0365F', '#fff'], 
  };
  

  generateBarChartData(): void {
    if (!this.customer.purchases) {
      this.barChartData = [];
      return;
    }
  
    const productTotals: { [productName: string]: number } = {};
    this.customer.purchases.forEach((purchase) => {
      if (!productTotals[purchase.productName]) {
        productTotals[purchase.productName] = 0;
      }
      productTotals[purchase.productName] += purchase.totalPrice || 0;
    });
  
    const sortedProductOrder = ['Product A', 'Product B', 'Product C'];
    this.barChartData = sortedProductOrder.map((productName) => ({
      name: productName,
      value: productTotals[productName] || 0,
    }));
  
   
  }
  
  
  yAxisTickFormatting(value: number): string {
    return `$${value}`;
  }

 
  
  
 
  
  
}
