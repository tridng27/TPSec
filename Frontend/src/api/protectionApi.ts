import { apiPost } from "./base";

export const ProtectionApi = {
    startProtection: (folders: string[]) => apiPost("/api/protection/start", { folders }),
    stopProtection: () => apiPost("/api/protection/stop")
};
