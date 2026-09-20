import { findAllCustomers } from "../repositories/customer.repository";
import { ListCustomersQuery } from "../dtos/customer.dto";

export async function listCustomers(query: ListCustomersQuery) {
  return findAllCustomers(query.search, query.limit);
}
