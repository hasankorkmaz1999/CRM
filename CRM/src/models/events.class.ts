export class Event {
  id?: string;
  createdBy?: string;
  date: Date;
  users: string[]; 
  description?: string;
  createdAt?: Date;
  type: string;
  time?: string;

  constructor(data: any) {
    this.id = data.id || '';
    this.createdBy = data.createdBy || 'Unknown';
    this.date = new Date(data.date) || new Date();
    this.users = data.users || [];
    this.description = data.description || '';
    this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
    this.type = data.type || 'Other';
    this.time = data.time || '';
  }
}
