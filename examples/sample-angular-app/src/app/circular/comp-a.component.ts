import { Component } from '@angular/core';
import { CompBComponent } from './comp-b.component';

/**
 * Circular dependency test case: CompA -> CompB -> CompA
 */
@Component({
  selector: 'app-comp-a',
  standalone: true,
  imports: [CompBComponent],
  template: `<div>Comp A <app-comp-b></app-comp-b></div>`
})
export class CompAComponent {}
