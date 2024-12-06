import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button'; 
import {MatTooltipModule} from '@angular/material/tooltip'; 
import {MatDialogModule} from '@angular/material/dialog'; 
import { HttpClientModule } from '@angular/common/http';
import { Auth, signInWithEmailAndPassword, onAuthStateChanged } from '@angular/fire/auth';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    RouterModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    HttpClientModule
    
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent  implements OnInit {
  isLoginRoute: boolean = false;
  userRole: string | null = '';
  userName: string | null = '';

  constructor(private router: Router, private auth: Auth) {
    this.router.events.subscribe(() => {
      this.isLoginRoute = this.router.url === '/login';
    });
  }

  ngOnInit(): void {
    const isLoggedIn = !!localStorage.getItem('userRole'); // Prüfen, ob userRole vorhanden ist
    if (isLoggedIn) {
      // Benutzer ist eingeloggt, Rolle und Name laden
      this.userRole = localStorage.getItem('userRole');
      this.userName = localStorage.getItem('userName');
      this.router.navigate(['/dashboard']); // Weiterleitung zum Dashboard
    } else {
      // Benutzer ist nicht eingeloggt, zur Login-Seite weiterleiten
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.auth.signOut()
      .then(() => {
        localStorage.clear(); // Lokale Sitzungsdaten löschen
        this.router.navigate(['/login']); // Weiterleitung zur Login-Seite
        console.log('User logged out successfully');
      })
      .catch((error) => {
        console.error('Error during logout:', error);
      });
  }
}
