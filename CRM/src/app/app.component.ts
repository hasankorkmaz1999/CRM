import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClientModule } from '@angular/common/http';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { AuthService } from './shared/auth.service';
import { SharedModule } from './shared/shared.module';
import { CalendarModule } from 'angular-calendar';
import { UserService } from './shared/user.service';

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
    HttpClientModule,
    SharedModule,
    CalendarModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  isLoginRoute: boolean = false;
  userName: string = 'Unknown User'; // Benutzername für den Header
  userRole: string = ''; // Benutzerrolle

  constructor(
    private router: Router,
    private userService: UserService,
  
    private dialog: MatDialog
  ) {
    this.router.events.subscribe(() => {
      this.isLoginRoute = this.router.url === '/login';
    });
  }

  ngOnInit(): void {
    // Benutzer aus dem Service abonnieren
    this.userService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName = user.name || 'Unknown User';
        this.userRole = user.role || '';
        console.log('Aktueller Benutzer:', user);
      } else {
        this.userName = 'Unknown User';
        this.userRole = '';
      }
    });
  
    // Benutzer aus localStorage laden (nur beim Initialisieren)
    this.userService.loadUserFromStorage();
  }
  
  // Logout-Funktion
  logout() {
    this.userService.clearCurrentUser(); // Benutzer im Service löschen
    console.log('Benutzer wurde erfolgreich ausgeloggt.');
    this.router.navigate(['/login']);
  }

}