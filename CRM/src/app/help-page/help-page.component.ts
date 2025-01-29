import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.scss'
})
export class HelpPageComponent {

  constructor( private location: Location,  private route: ActivatedRoute,) {}
  
  
  goBack() {
    this.location.back();
  }

}
