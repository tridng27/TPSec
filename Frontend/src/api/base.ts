export const BASE_URL = "http://localhost:8000";

export async function apiGet(path: string) {
    const res = await fetch(`${BASE_URL}${path}`);
    return res.json();
}

export async function apiPost(path: string, body?: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
    });
    return res.json();
}

export async function apiDelete(path: string) {
    const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
    return res.json();
}
