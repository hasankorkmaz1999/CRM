import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlightEntity',
  standalone: true
})
export class HighlightEntityPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    const highlighted = value.replace(/\((.*?)\)/g, '<span class="highlight">($1)</span>');
    console.log('Original:', value);
    console.log('Highlighted:', highlighted);
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
