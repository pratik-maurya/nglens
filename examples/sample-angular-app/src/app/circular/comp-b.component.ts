import { Component } from '@angular/core';
import { CompAComponent } from './comp-a.component';

/**
 * Circular dependency test case: CompB -> CompA -> CompB
 */
@Component({
  selector: 'app-comp-b',
  standalone: true,
  imports: [CompAComponent],
  template: `<div>Comp B <app-comp-a></app-comp-a></div>`
})
export class CompBComponent {}
