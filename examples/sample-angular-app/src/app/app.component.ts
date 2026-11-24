import { Component, signal, inject } from '@angular/core';
import { HeaderComponent } from './components/header.component';
import { SidebarComponent } from './components/sidebar.component';
import { DashboardComponent } from './components/dashboard.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, DashboardComponent],
  template: `
    <div class="app-layout" [class]="themeService.currentTheme()">
      <app-header [title]="title()" (toggleSidebar)="sidebarOpen.set(!sidebarOpen())"></app-header>
      <div class="main-content">
        @if (sidebarOpen()) {
          <app-sidebar></app-sidebar>
        }
        <app-dashboard></app-dashboard>
      </div>
    </div>
  `
})
export class AppComponent {
  themeService = inject(ThemeService);
  title = signal('NgLens Demo Application');
  sidebarOpen = signal(true);
}
