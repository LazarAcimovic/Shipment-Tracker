import { ALLOWED_TRANSITIONS } from "../domain/stateMachine";
import { ListShipmentsQuery } from "../dtos/shipment.dto";
import { HttpError } from "../middleware/httpError";
import { findManyShipments, findShipmentById } from "../repositories/shipment.repository";
import { toShipmentDetailResponse, toShipmentResponse } from "../utils/shipmentMapper";
import { parsePagination } from "../utils/pagination";

export async function listShipments(query: ListShipmentsQuery) {
  const lateOnly = query.late === "true";
  const { skip, take, page, pageSize } = parsePagination(query.page, query.pageSize);
  //1, 10
 //skip 0, take 10, page 1, pageSize 10
 

  const { data, total } = await findManyShipments(
    {
      status: query.status,
      customerId: query.customerId,
      lateOnly,
      search: query.search,
    },
    skip,
    take,
    lateOnly,
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
