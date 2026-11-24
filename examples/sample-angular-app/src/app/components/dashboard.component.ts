import { Component, signal, computed } from '@angular/core';
import { MetricCardComponent } from './metric-card.component';
import { UserRowComponent } from './user-row.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MetricCardComponent, UserRowComponent],
  template: `
    <section class="dashboard">
      <div class="metrics">
        <app-metric-card [title]="'Total Signals'" [value]="signalsCount()"></app-metric-card>
        <app-metric-card [title]="'Active Users'" [value]="activeUsersCount()"></app-metric-card>
      </div>
      <table class="users-table">
        @for (user of users(); track user.id) {
          <app-user-row [userId]="user.id" [userName]="user.name" (remove)="onRemove($event)"></app-user-row>
        }
      </table>
    </section>
  `
})
export class DashboardComponent {
  users = signal([
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' }
  ]);

  signalsCount = signal(42);
  activeUsersCount = computed(() => this.users().length);

  onRemove(id: string): void {
    this.users.update(list => list.filter(u => u.id !== id));
  }
}
