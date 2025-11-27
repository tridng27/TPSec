import { apiGet } from "./base";

export const AlertsApi = {
    getRecentAlerts: () => apiGet("/api/alerts/recent")
};
