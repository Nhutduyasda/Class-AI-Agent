import {
  Draft,
  Product,
  ReviewAction,
  type DashboardAdapter,
  type DraftInput,
  type Job,
  type Overview,
} from "./contracts";
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const r = await fetch("/api" + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  const value = await r.json();
  if (!r.ok) throw Error(value.error || "API_UNAVAILABLE");
  return value as T;
}
export const localApi: DashboardAdapter = {
  overview: () => request<Overview>("/overview"),
  create: (x: DraftInput) =>
    request<Job>("/jobs/draft", "POST", Draft.parse(x)),
  validateProduct: (x) =>
    request("/products/validate-input", "POST", Product.parse(x)),
  review: (id, x) =>
    request<Job>(
      "/jobs/" + encodeURIComponent(id) + "/review",
      "POST",
      ReviewAction.parse(x),
    ),
};
