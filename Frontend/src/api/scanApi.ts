import { apiGet, apiPost } from "./base";

export const ScanApi = {
    startScan: (folders: string[]) => apiPost("/api/scan/start", { folders }),
    getScanStatus: () => apiGet("/api/scan/status"),
    getScanStatusById: (scanId: string) => apiGet(`/api/scan/status/${scanId}`),
    getLatestScan: () => apiGet("/api/scan/latest")
};
