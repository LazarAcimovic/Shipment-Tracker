import { findAllCustomers } from "../repositories/customer.repository";

export async function listCustomers() {
  return findAllCustomers();
}
