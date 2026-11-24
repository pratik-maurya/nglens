import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<'dark' | 'light'>('dark');

  toggleTheme(): void {
    this.currentTheme.update(t => t === 'dark' ? 'light' : 'dark');
  }
}
