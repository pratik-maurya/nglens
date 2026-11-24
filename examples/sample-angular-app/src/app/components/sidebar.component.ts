import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  template: `
    <aside class="sidebar">
      <nav>
        <ul>
          <li>Overview</li>
          <li>Signals Graph</li>
          <li>Components</li>
        </ul>
      </nav>
    </aside>
  `
})
export class SidebarComponent {
  collapsed = signal(false);
}
