export class Event {
  id?: string;
  title: string;
  date: Date;
  users: string[]; // Namen der Benutzer
  description?: string;
  location?: string;
  createdAt?: Date;

  constructor(data: any) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.date = new Date(data.date) || new Date();
    this.users = data.users || [];
    this.description = data.description || '';
    this.location = data.location || '';
    this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
  }
}
