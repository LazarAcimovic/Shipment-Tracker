import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Customer } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/customers`;

  getAll() {
    return this.http.get<Customer[]>(this.base);
  }

  search(term: string, limit = 20) {
    return this.http.get<Customer[]>(this.base, { params: { search: term, limit } });
  }
}
