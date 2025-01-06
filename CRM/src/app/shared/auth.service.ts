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

  private currentUserDetailsSubject = new BehaviorSubject<{
    name: string;
    role: string;
    profilePicture: string;
  }>({
    name: 'Unknown User',
    role: 'Unknown Role',
    profilePicture: '/assets/img/user.png',
  });
  currentUserDetails$ = this.currentUserDetailsSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    onAuthStateChanged(this.auth, (user) => {
      console.log('Firebase Auth Current User:', user); // Debugging
      if (user) {
        this.currentUserSubject.next(user);
        this.fetchUserDetails(user.uid).then((details) => {
          if (details) {
            this.currentUserDetailsSubject.next(details);
          } else {
            this.resetCurrentUserDetails();
          }
        });
      } else {
        this.currentUserSubject.next(null);
        this.resetCurrentUserDetails();
      }
    });
  }

  // Lädt Benutzerinformationen aus Firestore
  public async fetchUserDetails(uid: string): Promise<{
    name: string;
    role: string;
    profilePicture: string;
  } | null> {
    const userCollection = collection(this.firestore, 'users');
    const userQuery = query(userCollection, where('uid', '==', uid));

    try {
      const querySnapshot = await getDocs(userQuery);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const firstName = userData['firstName'] || '';
        const lastName = userData['lastName'] || '';
        const role = userData['role'] || 'Unknown Role';
        const profilePicture = userData['profilePicture'] || '/assets/img/user.png';

        return {
          name: `${firstName} ${lastName}`.trim(),
          role: role,
          profilePicture: profilePicture,
        };
      } else {
        console.warn('No user found with this UID.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }

  // Setzt die Benutzerinformationen auf die Standardwerte zurück
  private resetCurrentUserDetails() {
    this.currentUserDetailsSubject.next({
      name: 'Unknown User',
      role: 'Unknown Role',
      profilePicture: '/assets/img/user.png',
    });
  }

  // Gibt den aktuellen Benutzer synchron zurück
  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }

  // Gibt die aktuellen Benutzerdetails synchron zurück
  getCurrentUserDetailsSync(): {
    name: string;
    role: string;
    profilePicture: string;
  } {
    return this.currentUserDetailsSubject.value;
  }
  
  
}
