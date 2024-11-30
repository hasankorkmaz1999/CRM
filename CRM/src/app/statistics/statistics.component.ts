import { Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [NgxChartsModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements OnInit {
  userChartData: any[] = []; // Daten für das Pie Chart
  view: [number, number] = [700, 400]; // Chart-Größe (Breite x Höhe)

  customerGrowthData: any[] = []; // Daten für das Line Chart

  // Korrektes Farbschema mit ScaleType
  colorScheme = {
    name: 'vivid',
    selectable: true,
    group: ScaleType.Ordinal, // Korrektur hier
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadCustomerGrowthData();
  }

  loadUserData() {
    const userCollection = collection(this.firestore, 'users');
    collectionData(userCollection, { idField: 'id' }).subscribe((data: any[]) => {
      const groupedData = this.groupUsersByProperty(data, 'role'); // Gruppiere nach 'role'

      this.userChartData = Object.entries(groupedData).map(([key, value]) => ({
        name: key,
        value: value.length,
      }));
    });
  }

  groupUsersByProperty(users: any[], property: string): { [key: string]: any[] } {
    return users.reduce((acc, user) => {
      const key = user[property] || 'Unknown'; // Gruppiere nach Eigenschaft oder 'Unknown'
      acc[key] = acc[key] || [];
      acc[key].push(user);
      return acc;
    }, {});
  }


  loadCustomerGrowthData() {
    const customerCollection = collection(this.firestore, 'customers');
    collectionData(customerCollection, { idField: 'id' }).subscribe((data: any[]) => {
      // Gruppiere die Daten
      const groupedData = this.groupByMonthAndYear(data, 'createdAt');
      
      // Initialisiere die kumulative Summe
      let cumulativeCount = 0;
  
      // Konvertiere die Daten für das Chart
      this.customerGrowthData = [
        {
          name: 'Customer Growth',
          series: Object.keys(groupedData)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) // Sortiere nach Datum
            .map((key) => {
              cumulativeCount += groupedData[key].length;
              return {
                name: key, // X-Achse (Jahr-Monat)
                value: cumulativeCount, // Kumulative Summe
              };
            }),
        },
      ];
  
      // Debugging
      console.log('Customer Growth Data:', this.customerGrowthData);
    });
  }
  
  

  

  groupByMonthAndYear(data: any[], dateField: string): { [key: string]: any[] } {
    return data.reduce((acc, customer) => {
      const date = new Date(customer[dateField]);
      if (!isNaN(date.getTime())) { // Überprüfen, ob das Datum gültig ist
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // Format: 'YYYY-MM'
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(customer);
      }
      return acc;
    }, {});
  }
  



  
  showLabels: boolean = true;
  animations: boolean = false;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Month';
  yAxisLabel: string = 'Customer Count';
  timeline: boolean = true;

  

 
}
  
  
  

