import api from "./api";

export async function createLease(data) {
  const response = await api.post("/api/leases", data);
  return response.data;
}

export async function getLeases(params = {}) {
  const response = await api.get("/api/leases", { params });
  return response.data;
}

export async function terminateLease(leaseId) {
  const response = await api.patch(`/api/leases/${leaseId}/terminate`);
  return response.data;
}
