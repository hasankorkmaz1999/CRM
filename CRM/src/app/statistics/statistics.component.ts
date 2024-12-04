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
    name: 'cool',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'] 
  };

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadCustomerGrowthData();
    this.loadEventData();
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







  showLabels: boolean = true;
  animations: boolean = false;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Month';
  yAxisLabel: string = 'Customer Count';
  timeline: boolean = true;


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
  



  
 

  

  chartData: { name: string; value: number }[] = [];
  colorSchemeEvents = {
    name: 'fire',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#FF6384', '#36A2EB', '#FFCE56', '#8E44AD'] // Farbschema für das Event Bar Chart
  };


  loadEventData(): void {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Montag
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sonntag

    const eventCollection = collection(this.firestore, 'events');
    collectionData(eventCollection, { idField: 'id' }).subscribe((events: any[]) => {
      const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
      });

      const eventTypes = ['Meeting', 'Webinar', 'Workshop', 'Other'];
      const eventCounts = eventTypes.map(type => ({
        name: type,
        value: filteredEvents.filter(event => event.type === type).length,
      }));

      this.chartData = eventCounts;
      console.log('Chart Data:', this.chartData);
    });
  }


  formatYAxisTicks(value: number): string {
    return Number.isInteger(value) ? value.toString() : ''; // Zeigt nur ganze Zahlen an
  }
  




 
}
  
  
  

