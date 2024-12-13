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
import { UserService } from './shared/user.service';
import { SharedModule } from './shared/shared.module';



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
    SharedModule
    
    
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent  implements OnInit {
  isLoginRoute: boolean = false;
  userRole: string | null = '';
  userName: string | null = '';

  constructor(
    private router: Router,
     private auth: Auth,
     private userService: UserService
    ) {
    this.router.events.subscribe(() => {
      this.isLoginRoute = this.router.url === '/login';
    });
  }

  ngOnInit(): void {
    this.userService.userRole$.subscribe((role) => {
      this.userRole = role;
    });
    this.userService.userName$.subscribe((name) => {
      this.userName = name;
    });

    const isLoggedIn = !!localStorage.getItem('userRole');
    if (!isLoggedIn) {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.auth.signOut()
      .then(() => {
        this.userService.setUserName(null);
        this.userService.setUserRole(null);
        this.router.navigate(['/login']);
        console.log('User logged out successfully');
      })
      .catch((error) => {
        console.error('Error during logout:', error);
      });
  }
}
