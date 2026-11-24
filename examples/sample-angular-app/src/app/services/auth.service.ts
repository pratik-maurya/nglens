import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<{ id: string; name: string } | null>({ id: 'u1', name: 'Pratik' });
  isLoggedIn = computed(() => this.currentUser() !== null);
}
