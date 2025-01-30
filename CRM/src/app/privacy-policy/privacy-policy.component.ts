import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent {
  showBackButton = false;

  constructor(private location: Location, private route: ActivatedRoute) {
    this.route.queryParams.subscribe((params) => {
      this.showBackButton = !!params['from'];
    });
  }

  goBack() {
    this.location.back();
  }
}
