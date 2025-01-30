import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  setCurrentUser(user: any) {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  clearCurrentUser() {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  loadUserFromStorage() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (user?.uid) {
      this.currentUserSubject.next(user);
    }
  }
}
