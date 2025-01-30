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
    profilePicture: string;}>(
    JSON.parse(localStorage.getItem('currentUserDetails') || `{
      "uid": "",
      "name": "Unknown User",
      "profilePicture": "/assets/img/user.png",
    }`)
  );
  currentUserDetails$ = this.currentUserDetailsSubject.asObservable();

  constructor(private firestore: Firestore) {}

  public async fetchUserDetails(email: string): Promise<{
    uid: string;
    name: string;
    profilePicture: string;
  } | null> {
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
        return userDetails;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }

  resetCurrentUserDetails() {
    const defaultDetails = {
      uid: '',
      name: 'Unknown User',
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
