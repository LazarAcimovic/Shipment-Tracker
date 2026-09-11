import { ZodIssue } from "zod";

const FIELD_LABELS: Record<string, string> = {
  customerId: "Customer",
  origin: "Origin",
  destination: "Destination",
  promisedDeliveryDate: "Promised delivery date",
  status: "Status",
  location: "Location",
  note: "Note",
  late: "Late filter",
  search: "Search",
  page: "Page",
  pageSize: "Page size",
};

export function toHumanMessage(issue: ZodIssue): string {
  const field = issue.path[issue.path.length - 1];
  const label = FIELD_LABELS[String(field)] ?? String(field);

  if (issue.code === "too_small") return `${label} is required`;
  if (issue.code === "invalid_type" && issue.received === "undefined") return `${label} is required`;
  if (issue.code === "invalid_string" && issue.validation === "uuid") return `${label} is not a valid selection`;
  if (issue.code === "invalid_string" && issue.validation === "datetime") return `${label} must be a valid date`;
  if (issue.code === "invalid_enum_value") return `${label} has an unrecognised value`;
  return `${label} is not valid`;
}
