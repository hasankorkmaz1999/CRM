export class Purchase {
    id: string; 
    productName: 'Product A' | 'Product B' | 'Product C';
    price: number; 
    purchaseDate: Date; 
    quantity: number; 
    totalPrice: number; 
    purchaseType: 'Online' | 'In-Store' | 'Subscription';
    createdBy: string; 
    createdByProfilePicture?: string; 
  
    constructor(obj?: any) {
      this.id = obj?.id || '';
      this.productName = obj?.productName || 'Product A'; 
      this.price = this.getPrice(obj?.productName || 'Product A');
      this.purchaseDate = obj?.purchaseDate ? new Date(obj.purchaseDate) : new Date();
      this.purchaseType = obj?.purchaseType || 'Online';
      this.quantity = obj?.quantity || 1;
      this.totalPrice = this.price * this.quantity;
      this.createdBy = obj?.createdBy || 'Unknown User';
      this.createdByProfilePicture = obj?.createdByProfilePicture || '/assets/img/default-profile.png';
    }
  
  
    private getPrice(productName: 'Product A' | 'Product B' | 'Product C'): number {
      const productPrices = {
        'Product A': 50,
        'Product B': 100,
        'Product C': 150,
      };
      return productPrices[productName];
    }
  }
  