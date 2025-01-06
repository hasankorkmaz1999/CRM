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
export class AppComponent implements OnInit, AfterViewInit {
  isLoginRoute: boolean = false;
  userName: string = 'Unknown User'; // Benutzername für den Header
  userRole: string = ''; // Benutzerrolle

  constructor(
    private router: Router,
    private auth: Auth,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.router.events.subscribe(() => {
      this.isLoginRoute = this.router.url === '/login';
    });
  }

  ngOnInit(): void {
    // Abonnieren der aktuellen Benutzerdetails aus dem AuthService
    this.authService.currentUserDetails$.subscribe((details) => {
      this.userName = details.name;
      this.userRole = details.role;
    });
  
    // Überprüfen, ob der Benutzer eingeloggt ist
    const isLoggedIn = !!localStorage.getItem('userRole');
    if (!isLoggedIn) {
      this.router.navigate(['/login']);
    }
  
    // Dialog Cleanup
    this.dialog.afterAllClosed.subscribe(() => {
      const appRoot = document.querySelector('app-root');
      if (appRoot?.hasAttribute('aria-hidden')) {
        appRoot.removeAttribute('aria-hidden');
      }
    });
  }
  
  

  ngAfterViewInit(): void {
    const appRoot = document.querySelector('app-root');
    if (appRoot?.hasAttribute('aria-hidden')) {
      appRoot.removeAttribute('aria-hidden');
    }
  }

  logout() {
    this.auth.signOut()
      .then(() => {
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        this.router.navigate(['/login']);
        console.log('User logged out successfully');
      })
      .catch((error) => {
        console.error('Error during logout:', error);
      });
  }
}
