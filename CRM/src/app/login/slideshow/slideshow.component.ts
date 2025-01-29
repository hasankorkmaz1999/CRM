import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-slideshow',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './slideshow.component.html',
  styleUrl: './slideshow.component.scss'
})
export class SlideshowComponent implements OnInit {
  featureCards!: NodeListOf<HTMLElement>;

  currentIndex = 0;
  intervalId: any;

  ngOnInit(): void {
    this.featureCards = document.querySelectorAll('.feature-card');
   

    this.showFeature(this.currentIndex);
    this.intervalId = setInterval(() => this.nextFeature(), 4000); // Auto-Slide alle 4 Sekunden
  }

  showFeature(index: number): void {
    this.featureCards.forEach((card) => card.classList.remove('active'));
   

    this.featureCards[index].classList.add('active');
   
  }

  nextFeature(): void {
    this.currentIndex = (this.currentIndex + 1) % this.featureCards.length;
    this.showFeature(this.currentIndex);
  }

  goToFeature(index: number) {
    if (index === this.currentIndex) return; // Keine Aktion, wenn gleich
  
    const previousIndex = this.currentIndex;
    this.currentIndex = index;
  
    const cards = document.querySelectorAll('.feature-card');
    cards[previousIndex].classList.remove('active');
    cards[previousIndex].classList.add('previous');
  
    setTimeout(() => {
      cards[previousIndex].classList.remove('previous');
      cards[index].classList.add('active');
    }, 600); // Warten, bis die Slide-Out-Animation abgeschlossen ist
  }
  
}