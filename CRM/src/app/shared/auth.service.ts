import { Injectable } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser: User | null = null;
  private currentUserName: string | null = null; // Speichert FirstName + LastName

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.fetchUserDetails(user.uid); // Lade zusätzliche Details
      } else {
        this.currentUser = null;
        this.currentUserName = null;
        console.log('No user is signed in.');
      }
    });
  }

  // Gibt die UID des aktuellen Benutzers zurück
  getCurrentUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  // Gibt den Anzeigenamen zurück oder lädt Benutzerinformationen
  async getCurrentUserDisplayName(): Promise<string> {
    if (this.currentUserName) {
      return this.currentUserName;
    }

    if (this.currentUser?.uid) {
      const fullName = await this.fetchUserDetails(this.currentUser.uid);
      return fullName || 'Unknown User';
    }

    return 'Unknown User';
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
        const fullName = `${firstName} ${lastName}`.trim();
        this.currentUserName = fullName; // Speichert es für zukünftige Abfragen
        console.log(`User: ${fullName}`);
        return fullName;
      } else {
        console.warn('No user found with this UID.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }

  // Prüft, ob ein Benutzer eingeloggt ist
  isUserLoggedIn(): boolean {
    return !!this.currentUser;
  }

  // Zusätzliche Methode: Gibt den aktuellen Benutzer zurück
  // Zusätzliche Methode: Gibt den aktuellen Benutzer zurück
getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, (user) => {
        resolve(user); // Gibt entweder den Benutzer oder `null` zurück
      });
    });
  }
  
}
