import { Component } from '@angular/core';

/**
 * Test case for NgLens Health Auditor:
 * Standalone component that is never imported or rendered anywhere in the application.
 */
@Component({
  selector: 'app-orphan-demo',
  standalone: true,
  template: `<div>Orphan component not connected to root</div>`
})
export class OrphanDemoComponent {
  unusedState = 'test';
}
