import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';


@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './legal-notice.component.html',
  styleUrl: './legal-notice.component.scss'
})
export class LegalNoticeComponent {
  constructor( private location: Location,  private route: ActivatedRoute,) {}


  goBack() {
    this.location.back();
  }
}
