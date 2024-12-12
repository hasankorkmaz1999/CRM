import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userNameSubject = new BehaviorSubject<string | null>(localStorage.getItem('userName'));
  private userRoleSubject = new BehaviorSubject<string | null>(localStorage.getItem('userRole'));

  userName$ = this.userNameSubject.asObservable();
  userRole$ = this.userRoleSubject.asObservable();

  setUserName(userName: string | null) {
    this.userNameSubject.next(userName);
    if (userName) {
      localStorage.setItem('userName', userName);
    } else {
      localStorage.removeItem('userName');
    }
  }

  setUserRole(userRole: string | null) {
    this.userRoleSubject.next(userRole);
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    } else {
      localStorage.removeItem('userRole');
    }
  }
}
