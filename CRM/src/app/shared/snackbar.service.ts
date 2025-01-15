import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  showSnackbar(message: string): void {
    const snackbar = document.getElementById('snackbar');
    if (snackbar) {
      snackbar.textContent = message; // Setze die Nachricht
      snackbar.classList.add('show');
      setTimeout(() => {
        snackbar.classList.remove('show');
      }, 2000); // Snackbar nach 2 Sekunden ausblenden
    }
  }

  showActionSnackbar(entityType: 'user' | 'customer' | 'event', action: 'add' | 'delete' | 'update'): void {
    let actionText = '';
    switch (action) {
      case 'add':
        actionText = 'added';
        break;
      case 'delete':
        actionText = 'deleted';
        break;
      case 'update':
        actionText = 'updated';
        break;
    }

    const entityText = entityType.charAt(0).toUpperCase() + entityType.slice(1); // Erster Buchstabe groß
    const message = `${entityText} successfully ${actionText}!`;
    this.showSnackbar(message);
  }
}
