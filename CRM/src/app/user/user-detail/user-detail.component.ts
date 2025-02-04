import {Component,HostListener,OnInit,ViewEncapsulation,} from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import {Firestore,collection,collectionData,doc,docData,} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.class';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { DialogEditUserComponent } from '../dialog-edit-user/dialog-edit-user.component';
import { DialogAddPictureComponent } from '../../dialog-add-picture/dialog-add-picture.component';
import { Location } from '@angular/common';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [SharedModule, MatMenuModule, NgxChartsModule],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class UserDetailComponent implements OnInit {
  userId = '';
  user: User = new User();
  userEvents: any[] = [];

  lineChartData: any[] = [];
  view: [number, number] = [1200, 400];

  colorScheme = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3BADEB' ,'#F0365F' ,  '#fff'],
  };

  showLabels: boolean = true;
  animations = false;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Date';
  yAxisLabel: string = 'Total Quantity';

  timeline: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    public dialog: MatDialog,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((paramMap) => {
      this.userId = paramMap.get('id') ?? '';

      this.getUser();
      this.loadUserEvents();
      this.loadUserPurchases();
      this.updateChartView();
    });
  }

  getUser() {
    const userDoc = doc(this.firestore, `users/${this.userId}`);
    docData(userDoc).subscribe((user: any) => {
      this.user = new User(user);
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.updateChartView();
  }

  updateChartView(): void {
    const screenWidth = window.innerWidth;
    let widthPercentage = 0.9; 
    if (screenWidth < 1380) {
      widthPercentage = 0.75;
    } else if (screenWidth < 2010) {
      widthPercentage = 0.65; 
    } else {
      widthPercentage = 0.6; 
    }
    const maxChartWidth = Math.min(screenWidth * widthPercentage, 1300); 
    const chartHeight = 400;
    this.view = [maxChartWidth, chartHeight];
  }

  parseAndCombineDateTime(dateString: string, timeString: string): Date {
    try {
      const [time, meridiem] = timeString.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      const isPM = meridiem === 'PM';
      const parsedDate = new Date(dateString);
      parsedDate.setHours(isPM && hours !== 12 ? hours + 12 : hours === 12 ? 0 : hours);
      parsedDate.setMinutes(minutes || 0);
      parsedDate.setSeconds(0);
      parsedDate.setMilliseconds(0);
      return parsedDate;
    } catch (error) {
      console.error('Error parsing and combining date and time:', error);
      return new Date(NaN);
    }
  }

  editUserDetails() {
    const buttonElement = document.activeElement as HTMLElement; 
    if (buttonElement) {
      buttonElement.blur(); 
    }
    const dialog = this.dialog.open(DialogEditUserComponent, {
      data: {
        user: { ...this.user },
        userId: this.userId,
      },
    });
    dialog.afterClosed().subscribe((updated) => {
      if (updated) {
        this.getUser();
      }
    });
  }

  loadUserEvents(): void {
    const eventsCollection = collection(this.firestore, 'events');
    const now = new Date();
    collectionData(eventsCollection, { idField: 'id' }).subscribe(
      (events: any[]) => {
        this.userEvents = this.filterAndSortEvents(events, now);
      }
    );
  }
  
  private filterAndSortEvents(events: any[], now: Date): any[] {
    const filteredEvents = events.filter((event) => {
      const eventDateTime = this.parseAndCombineDateTime(event.date, event.time);
      return (
        event.users.some(
          (participant: string) =>
            participant === `${this.user.firstName} ${this.user.lastName}`
        ) && eventDateTime > now
      );
    });
    return filteredEvents.sort((a, b) => {
      const dateA = this.parseAndCombineDateTime(a.date, a.time).getTime();
      const dateB = this.parseAndCombineDateTime(b.date, b.time).getTime();
      return dateA - dateB;
    });
  }
  
  addOrEditProfilePicture() {
    const buttonElement = document.activeElement as HTMLElement; 
    if (buttonElement) {
      buttonElement.blur(); 
    }
    const dialogRef = this.dialog.open(DialogAddPictureComponent, {
      data: { id: this.userId, type: 'user' }, 
    });
    dialogRef.afterClosed().subscribe((imageUrl: string) => {
      if (imageUrl) {
        this.user.profilePicture = imageUrl; 
      }
    });
  }

  getProfilePictureButtonLabel(): string {
    return this.user.profilePicture ? 'Edit picture' : 'Add picture';
  }

  goBack() {
    this.location.back();
  }

  loadUserPurchases(): void {
    const customersCollection = collection(this.firestore, 'customers');
    collectionData(customersCollection, { idField: 'id' }).subscribe(
      (customers: any[]) => {
        const allPurchases = this.extractUserPurchases(customers);
        if (allPurchases.length > 0) {
          this.formatChartData(allPurchases);
        } else {
          this.lineChartData = [];
        }
      }
    );
  }
  
  private extractUserPurchases(customers: any[]): any[] {
    const allPurchases: any[] = [];
    customers.forEach((customer) => {
      if (customer.purchases && customer.purchases.length > 0) {
        allPurchases.push(
          ...customer.purchases.filter(
            (purchase: any) =>
              purchase.createdBy ===
              `${this.user.firstName} ${this.user.lastName}`
          )
        );
      }
    });
    return allPurchases;
  }
  
  formatChartData(purchases: any[]): void {
    const productMap = this.buildProductMap(purchases);
    this.lineChartData = Object.keys(productMap).map((productName) =>
      this.createChartSeries(productName, productMap)
    );
  }
  
  private buildProductMap(purchases: any[]): { [key: string]: { [key: string]: number } } {
    const productMap: { [key: string]: { [key: string]: number } } = {};
    purchases.forEach((purchase) => {
      const productName = purchase.productName;
      const date = new Date(purchase.purchaseDate).toLocaleDateString('en-US', {
        year: 'numeric',month: 'short', day: 'numeric',
      });
      if (!productMap[productName]) {
        productMap[productName] = {};
      }
      if (!productMap[productName][date]) {
        productMap[productName][date] = 0;
      }
      productMap[productName][date] += purchase.quantity;
    });
    return productMap;
  }
  
  private createChartSeries(productName: string, productMap: { [key: string]: { [key: string]: number } }) {
    const series = Object.keys(productMap[productName])
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((date) => {
        return { name: date, value: productMap[productName][date] }; 
      });

    return { name: productName, series };
}

  
}
