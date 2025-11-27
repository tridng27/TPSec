import { apiGet } from "./base";

export const StatsApi = {
    getOverview: () => apiGet("/api/stats/overview"),
    getTimeline: () => apiGet("/api/stats/timeline")
};
