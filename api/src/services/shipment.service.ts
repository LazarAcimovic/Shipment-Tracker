import { ALLOWED_TRANSITIONS, canTransition } from "../domain/stateMachine";
import {
  CreateShipmentDto,
  ListShipmentsQuery,
  RecordEventDto,
} from "../dtos/shipment.dto";
import { HttpError } from "../middleware/httpError";
import {
  createShipment as repoCreateShipment,
  deleteShipment as repoDeleteShipment,
  findManyShipments,
  findShipmentById,
  recordShipmentEvent,
  updateShipment as repoUpdateShipment,
} from "../repositories/shipment.repository";
import {
  toShipmentDetailResponse,
  toShipmentResponse,
} from "../utils/shipmentMapper";
import { parsePagination } from "../utils/pagination";
import { findCustomerById } from "../repositories/customer.repository";

export async function listShipments(query: ListShipmentsQuery) {
  const lateOnly = query.late === "true";
  const { skip, take, page, pageSize } = parsePagination(
    query.page,
    query.pageSize,
  );

  const { data, total } = await findManyShipments(
    {
      status: query.status,
      customerId: query.customerId,
      lateOnly,
      search: query.search,
    },
    skip,
    take,
  );

  const mapped = data.map(toShipmentResponse);
  const filtered = lateOnly ? mapped.filter((s) => s.isLate) : mapped;

  return {
    data: filtered,
    page,
    pageSize,
    total,
  };
}

export async function getShipment(id: string) {
  const shipment = await findShipmentById(id);
  if (!shipment) throw new HttpError(404, "Shipment not found");

  const allowedNextStatuses = ALLOWED_TRANSITIONS[shipment.currentStatus];
  return toShipmentDetailResponse(shipment, allowedNextStatuses);
}

export async function createShipment(dto: CreateShipmentDto) {
  const customer = await findCustomerById(dto.customerId);
  if (!customer) throw new HttpError(404, "Customer not found");

  const shipment = await repoCreateShipment({
    customerId: dto.customerId,
    origin: dto.origin,
    destination: dto.destination,
    promisedDeliveryDate: new Date(dto.promisedDeliveryDate),
  });

  return getShipment(shipment.id);
}

export async function updateShipment(id: string, dto: CreateShipmentDto) {
  const shipment = await findShipmentById(id);
  if (!shipment) throw new HttpError(404, "Shipment not found");

  const customer = await findCustomerById(dto.customerId);
  if (!customer) throw new HttpError(404, "Customer not found");

  await repoUpdateShipment(id, {
    customerId: dto.customerId,
    origin: dto.origin,
    destination: dto.destination,
    promisedDeliveryDate: new Date(dto.promisedDeliveryDate),
  });

  return getShipment(id);
}

export async function deleteShipment(id: string) {
  const shipment = await findShipmentById(id);
  if (!shipment) throw new HttpError(404, "Shipment not found");
  await repoDeleteShipment(id);
}

export async function recordEvent(id: string, dto: RecordEventDto) {
  const shipment = await findShipmentById(id);
  if (!shipment) throw new HttpError(404, "Shipment not found");

  if (!canTransition(shipment.currentStatus, dto.status)) {
    throw new HttpError(
      422,
      `Cannot move from ${shipment.currentStatus} to ${dto.status}`,
    );
  }

  await recordShipmentEvent(id, dto.status, dto.location, dto.note);
  return getShipment(id);
}
