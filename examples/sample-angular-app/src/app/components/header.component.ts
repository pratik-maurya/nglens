import { Component, input, output, signal, computed, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <button (click)="toggleSidebar.emit()">☰</button>
      <span>{{ title() }}</span>
      <div class="user-badge">{{ auth.currentUser()?.name }} ({{ notificationsCount() }})</div>
    </header>
  `
})
export class HeaderComponent {
  auth = inject(AuthService);
  title = input<string>('Super Angular Dashboard');
  toggleSidebar = output<void>();

  notificationsCount = signal<number>(5);
  hasNotifications = computed(() => this.notificationsCount() > 0);
}
