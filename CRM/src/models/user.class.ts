export class User {
  firstName: string;
  lastName: string;
  birthDate: string | Date;
  street: string;
  zipCode: number;
  city: string;
  email: string;
  phone: number;
  id: string;
  profilePicture?: string;
  role?: string; 

  constructor(obj?: any) {
    this.firstName = obj ? obj.firstName: '';
    this.lastName = obj ? obj.lastName: '';
    this.birthDate = obj ? obj.birthDate: '';
    this.street = obj ? obj.street: '';
    this.zipCode = obj ? obj.zipCode: '';
    this.city = obj ? obj.city: '';
    this.email = obj ? obj.email: '';
    this.id = obj ? obj.id: '';
    this.profilePicture = obj ? obj.profilePicture : '';
    this.phone = obj ? obj.phone: '';
    this.role = obj ? obj.role : '';
  }
}
