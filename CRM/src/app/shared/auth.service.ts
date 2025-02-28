import { Injectable } from '@angular/core';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserDetailsSubject = new BehaviorSubject<{
    uid: string;
    name: string;
    profilePicture: string;
  }>(this.getStoredUserDetails());
  
  private getStoredUserDetails() {
    try {
      return JSON.parse(localStorage.getItem('currentUserDetails')!) || {
        uid: '',
        name: 'Guest User',
        profilePicture: '/assets/img/user.png',
      };
    } catch (error) {
      console.error('Error parsing user details from localStorage:', error);
      return {
        uid: '',
        name: 'Guest User',
        profilePicture: '/assets/img/user.png',
      };
    }
  }
  
  currentUserDetails$ = this.currentUserDetailsSubject.asObservable();

  constructor(private firestore: Firestore) {}

  public async fetchUserDetails(email: string): Promise<void> {
    const userCollection = collection(this.firestore, 'users');
    const userQuery = query(userCollection, where('email', '==', email));
  
    try {
      const querySnapshot = await getDocs(userQuery);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userDetails = {
          uid: userDoc.id,
          name: `${userData['firstName']} ${userData['lastName']}`.trim(),
          profilePicture: userData['profilePicture'] || '/assets/img/user.png',
        };
  
        this.currentUserDetailsSubject.next(userDetails);
        localStorage.setItem('currentUserDetails', JSON.stringify(userDetails));
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }
  

  getStoredUser(): { uid: string; name: string; profilePicture: string } {
    const storedData = localStorage.getItem('currentUserDetails');
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (error) {
        console.error('Fehler beim Parsen von localStorage:', error);
      }
    }
    return { uid: '', name: 'Guest User', profilePicture: '/assets/img/user.png' };
  }
  
  
  

  resetCurrentUserDetails() {
    const defaultDetails = {
      uid: '',
      name: 'Guest User',
      profilePicture: '/assets/img/user.png',
    };
    this.currentUserDetailsSubject.next(defaultDetails);
    localStorage.setItem('currentUserDetails', JSON.stringify(defaultDetails));
  }

  getCurrentUserDetailsSync(): {
    uid: string;
    name: string;
    profilePicture: string;
  } {
    return this.currentUserDetailsSubject.value;
  }
}
