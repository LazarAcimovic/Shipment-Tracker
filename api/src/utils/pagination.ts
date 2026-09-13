const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function parsePagination(page: unknown, pageSize: unknown) {
  const p = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
  const ps = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(String(pageSize ?? DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
  );
  return { skip: (p - 1) * ps, take: ps, page: p, pageSize: ps }; 
}