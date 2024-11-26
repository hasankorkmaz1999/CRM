export class Customer {
    id: string; // Eindeutige ID
    firstName: string; // Vorname des Kunden
    lastName: string; // Nachname des Kunden
    email: string; // E-Mail-Adresse
    phone: string; // Telefonnummer
    address: {
      street: string;
      city: string;
      zipCode: string;
      country: string;
    }; // Adresse des Kunden
    createdAt: Date; // Datum, an dem der Kunde hinzugefügt wurde
    notes?: string;
    profilePicture?: string; // Zusätzliche Notizen oder Details
  
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
        country: ''
      };
      this.createdAt = obj?.createdAt ? new Date(obj.createdAt) : new Date();
      this.notes = obj?.notes || '';
      this.profilePicture = obj?.profilePicture || '';
    }
  }
  