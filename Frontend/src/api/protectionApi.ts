import { apiGet, apiPost } from "./base";

export const ProtectionApi = {
    startProtection: (folders: string[]) => apiPost("/api/protection/start", { folders }),
    stopProtection: () => apiPost("/api/protection/stop"),
    statusProtection: () => apiGet("/api/protection/status"),
    recenteventProtection: () => apiGet("/api/protection/events/recent?limit=20"),
    statisticsProtection: () => apiGet("/api/protection/events/statistics"),
};
