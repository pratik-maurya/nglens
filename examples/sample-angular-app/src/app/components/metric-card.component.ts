import { Component, input } from '@angular/core';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  template: `
    <div class="metric-card">
      <h4>{{ title() }}</h4>
      <div class="val">{{ value() }}</div>
    </div>
  `
})
export class MetricCardComponent {
  title = input.required<string>();
  value = input<number>(0);
}
