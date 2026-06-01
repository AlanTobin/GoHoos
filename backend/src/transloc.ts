export async function getVehicles() {
    const response = await fetch("https://uva.transloc.com/Services/JSONPRelay.svc/GetMapVehiclePoints?apiKey=8882812681&isPublicMap=true", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    return response.json();
}