import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.class';
import {MatMenuModule} from '@angular/material/menu'; 
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
  user: User = new User ;
  userEvents: any[] = []; // Liste aller Events des aktuellen Benutzers



  lineChartData: any[] = []; 
  view: [number, number] = [1200, 400]; 
  
  colorScheme = {
    name: 'customScheme',
    selectable: true, 
    group: ScaleType.Ordinal,
    domain: ['#3BADEB', '#fff', '#F0365F'], 
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



  constructor(private route: ActivatedRoute,
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
      this.user = new User (user);
     
    });
  }

  @HostListener('window:resize', ['$event']) // Überwache die Fenstergröße
  onResize(): void {
    this.updateChartView();
  }

  updateChartView(): void {
    const screenWidth = window.innerWidth;
  
    // Breakpoints für die Chart-Breite
    if (screenWidth <= 380) {
      this.view = [260, 400]; // Maximale Breite für kleine Geräte
    } else if (screenWidth <= 600) {
      this.view = [300, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 680) {
      this.view = [400, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 820) {
      this.view = [450, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 930) {
      this.view = [550, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 1020) {
      this.view = [650, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 1200) {
      this.view = [750, 400]; // Etwas größere Breite für Tablets
    } else if (screenWidth <= 1550) {
      this.view = [900, 400]; // Standardbreite für Desktops bis 1770px
    } else if (screenWidth <= 1700) {
      this.view = [1000, 400]; // Große Desktops bis 1920px
    } else if (screenWidth <= 2040) {
      this.view = [1150, 400]; // Sehr große Desktops bis 2070px
    } else {
      this.view = [1200, 400]; // Extra große Geräte (über 2070px)
    }
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
    const buttonElement = document.activeElement as HTMLElement; // Get the currently focused element
    if (buttonElement) {
      buttonElement.blur(); // Remove focus from the button
    }
  
    const dialog = this.dialog.open(DialogEditUserComponent, {
      data: {
        user: { ...this.user }, // Kopiere die Benutzerdaten
        userId: this.userId, // Benutzer-ID
      },
    });
  
    dialog.afterClosed().subscribe((updated) => {
      if (updated) {
        // Daten neu laden, wenn Änderungen vorgenommen wurden
        this.getUser();
      }
    });
  }
  

  loadUserEvents(): void {
    const eventsCollection = collection(this.firestore, 'events');
    const now = new Date(); // Aktuelles Datum und Uhrzeit
  
    collectionData(eventsCollection, { idField: 'id' }).subscribe((events: any[]) => {
      // Filtere Events, bei denen der Benutzer ein Teilnehmer ist und die noch in der Zukunft liegen
      const filteredEvents = events.filter((event) => {
        const eventDateTime = this.parseAndCombineDateTime(event.date, event.time);
        return (
          event.users.some(
            (participant: string) =>
              participant === `${this.user.firstName} ${this.user.lastName}`
          ) && eventDateTime > now
        );
      });
  
      // Sortiere die Events nach Datum und Uhrzeit
      this.userEvents = filteredEvents.sort((a, b) => {
        const dateA = this.parseAndCombineDateTime(a.date, a.time).getTime();
        const dateB = this.parseAndCombineDateTime(b.date, b.time).getTime();
        return dateA - dateB; // Aufsteigende Reihenfolge (früheste Events zuerst)
      });
  
     
    });
  }
  


  addOrEditProfilePicture() {
    const buttonElement = document.activeElement as HTMLElement; // Get the currently focused element
    if (buttonElement) {
      buttonElement.blur(); // Remove focus from the button
    }
  
    const dialogRef = this.dialog.open(DialogAddPictureComponent, {
      data: { id: this.userId, type: 'user' } // Typ ist 'user'
    });
  
    dialogRef.afterClosed().subscribe((imageUrl: string) => {
      if (imageUrl) {
        this.user.profilePicture = imageUrl; // Aktualisiere das lokale Benutzerobjekt
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
  collectionData(customersCollection, { idField: 'id' }).subscribe((customers: any[]) => {
    const allPurchases: any[] = [];

   
    customers.forEach((customer) => {
      if (customer.purchases && customer.purchases.length > 0) {
        allPurchases.push(
          ...customer.purchases.filter(
            (purchase: any) =>
              purchase.createdBy === `${this.user.firstName} ${this.user.lastName}`
          )
        );
      }
    });

    if (allPurchases.length > 0) {
      this.formatChartData(allPurchases);
    } else {
           this.lineChartData = []; 
    }
  });
}

formatChartData(purchases: any[]): void {
  const productMap: { [key: string]: { [key: string]: number } } = {};

 
  purchases.forEach((purchase) => {
    const productName = purchase.productName;
    const date = new Date(purchase.purchaseDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }); 

    if (!productMap[productName]) {
      productMap[productName] = {};
    }

    if (!productMap[productName][date]) {
      productMap[productName][date] = 0;
    }

    productMap[productName][date] += purchase.quantity;
  });

  
  this.lineChartData = Object.keys(productMap).map((productName) => {
    let cumulativeTotal = 0;
    const series = Object.keys(productMap[productName])
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) 
      .map((date) => {
        cumulativeTotal += productMap[productName][date];
        return {
          name: date,
          value: cumulativeTotal,
        };
      });

    return {
      name: productName,
      series,
    };
  });
}





  


}




