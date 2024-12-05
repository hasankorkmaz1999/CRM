import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private auth: Auth, private firestore: Firestore, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const user = this.auth.currentUser;
  
    if (user) {
      const userRef = doc(this.firestore, `users/${user.uid}`);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return true; // Zugang gewährt
      }
    }
  
    this.router.navigate(['/login']); // Zugang verweigert -> Zur Login-Seite
    return false;
  }
}
