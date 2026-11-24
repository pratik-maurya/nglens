import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-user-row',
  standalone: true,
  template: `
    <tr>
      <td>{{ userId() }}</td>
      <td>{{ userName() }}</td>
      <td><button (click)="remove.emit(userId())">Delete</button></td>
    </tr>
  `
})
export class UserRowComponent {
  userId = input.required<string>();
  userName = input.required<string>();
  remove = output<string>();
}
