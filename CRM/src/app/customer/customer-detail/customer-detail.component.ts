import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
      console.log('Customer loaded:', this.customer);
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
    const createdByProfilePicture = currentUser?.profilePicture || '/assets/img/default-profile.png';
  
   
    const newPurchase = {
      id: this.generateUniqueId(),
      productName: productName,
      quantity: quantity,
      purchaseType: purchaseType,
      createdBy: createdBy,
      createdByProfilePicture: createdByProfilePicture,
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
    .then(() => {
      console.log('Purchase successfully added:', newPurchase);

           this.resetForm();


      this.showSnackbar();
    })
    .catch((error) => console.error('Error adding purchase:', error));
  }


  showSnackbar(): void {
    const snackbar = document.getElementById('snackbar');
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
  
 

  width: number = 700;
  height: number = 410;
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
