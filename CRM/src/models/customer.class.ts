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
    country: string;
  };
  createdAt: Date;
  
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
      country: '',
    };
    this.createdAt = obj?.createdAt ? new Date(obj.createdAt) : new Date();
   
    this.profilePicture = obj?.profilePicture || '';
    this.status = obj?.status || 'new'; // Standardstatus
  }
}
