import { Purchase } from '../models/purchase.class';

export class Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    zipCode: string;
   
  };
  createdAt: Date;
  purchases: {
    id: string;
    productName: string;
    price: number;
    purchaseDate: string; // ISO-String
    quantity: number;
    totalPrice: number;
    purchaseType: string;
    createdBy: string;
    createdByProfilePicture?: string;
  }[];
  profilePicture?: string;
  status: 'active' | 'inactive' | 'pending' | 'new'; // Status mit festgelegten Werten

  constructor(obj?: any) {
    this.id = obj?.id || '';
    this.firstName = obj?.firstName || '';
    this.lastName = obj?.lastName || '';
    this.email = obj?.email || '';
    this.phone = obj?.phone || '';
    this.address = obj?.address || {
      street: '',
      city: '',
      zipCode: '',
    
    };
    this.createdAt = obj?.createdAt ? new Date(obj.createdAt) : new Date();
    this.purchases = obj?.purchases || [];
    this.profilePicture = obj?.profilePicture || '';
    this.status = obj?.status || 'new'; // Standardstatus
  }
}
