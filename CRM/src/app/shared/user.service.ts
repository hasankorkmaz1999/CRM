import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<any>(null); // Aktueller Benutzer
  currentUser$ = this.currentUserSubject.asObservable(); // Observable für den Benutzer

  // Benutzer im Service setzen
  setCurrentUser(user: any) {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // Benutzer aus dem Service löschen
  clearCurrentUser() {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  // Benutzer aus localStorage laden
  loadUserFromStorage() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUserSubject.next(user);
  }
}