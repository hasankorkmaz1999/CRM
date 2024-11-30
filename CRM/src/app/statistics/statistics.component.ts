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
}
