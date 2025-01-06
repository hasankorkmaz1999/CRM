import { Injectable } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private currentUserNameSubject = new BehaviorSubject<string>('Unknown User');
  currentUserName$ = this.currentUserNameSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentUserSubject.next(user);
        this.fetchUserDetails(user.uid).then((name) => {
          this.currentUserNameSubject.next(name || 'Unknown User');
        });
      } else {
        this.currentUserSubject.next(null);
        this.currentUserNameSubject.next('Unknown User');
      }
    });
  }

  // Lädt Benutzerinformationen aus Firestore
  private async fetchUserDetails(uid: string): Promise<string | null> {
    const userCollection = collection(this.firestore, 'users');
    const userQuery = query(userCollection, where('uid', '==', uid));

    try {
      const querySnapshot = await getDocs(userQuery);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const firstName = userData['firstName'] || '';
        const lastName = userData['lastName'] || '';
        return `${firstName} ${lastName}`.trim();
      } else {
        console.warn('No user found with this UID.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }

  // Gibt den aktuellen Benutzer synchron zurück
  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }

  // Gibt den Namen des aktuellen Benutzers synchron zurück
  getCurrentUserNameSync(): string {
    return this.currentUserNameSubject.value;
  }

  getUserProfilePictureByName(userName: string): Promise<string> {
    const usersCollection = collection(this.firestore, 'users');
    const userQuery = query(usersCollection, where('firstName', '==', userName.split(' ')[0]), where('lastName', '==', userName.split(' ')[1]));
    return getDocs(userQuery).then((snapshot) => {
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        console.log('User Profile Picture URL:', userData['profilePicture']); // Debugging
        return userData['profilePicture'] || '/assets/img/user.png';
      }
      return '/assets/img/user.png';
    });
  }
  
  
  
}
