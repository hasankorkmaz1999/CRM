import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClientModule } from '@angular/common/http';

import { SharedModule } from './shared/shared.module';
import { CalendarModule } from 'angular-calendar';
import { UserService } from './shared/user.service';
import { TodoFloatingComponent } from './todo-floating/todo-floating.component';

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
    TodoFloatingComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  isLoginRoute: boolean = false;
  userName: string = 'Unknown User';
  userRole: string = '';
  userProfilePicture: string = '';
  menuPositionX: 'before' | 'after' = 'after';
  menuPositionY: 'above' | 'below' = 'below';

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
    this.userService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName = user.name || 'Unknown User';
        this.userRole = user.role || '';
        this.userProfilePicture = user.profilePicture || '/assets/img/user.png';
      } else {
        this.userName = 'Unknown User';
        this.userRole = '';
        this.userProfilePicture = '/assets/img/user.png';
      }
    });
    this.userService.loadUserFromStorage();
  }

  changeMenuPosition(): void {
    this.menuPositionX = 'before';
    this.menuPositionY = 'above';
  }

  navigateToHelp(): void {
    this.router.navigate(['/help']);
  }

  logout() {
    this.userService.clearCurrentUser();
    this.router.navigate(['/login']);
  }
}
