import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule , SharedModule],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.scss'
})
export class EventDetailsComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
