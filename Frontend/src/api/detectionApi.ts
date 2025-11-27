import { apiGet, apiPost, apiDelete } from "./base";

export const DetectionApi = {
    getDetections: () => apiGet("/api/detections/?limit=100&offset=0&detection_type=all"),
    getMalicious: () => apiGet("/api/detections/malicious"),
    deleteDetection: (id: string) => apiDelete(`/api/detections/${id}`),

    // whitelist
    getWhitelist: () => apiGet("/api/detections/whitelist"),
    addWhitelist: (item: any) => apiPost("/api/detections/whitelist", item),
    deleteWhitelist: (id: string) => apiDelete(`/api/detections/whitelist/${id}`)
};
