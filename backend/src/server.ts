import express from "express";
import { getVehicles } from "./transloc";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/api/v1/vehicles", async (req, res) => {

    try {
        const vehicles = await getVehicles();
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: "Failed to get vehicles" });
    }
});

app.listen(3001, () => {
    console.log("Server running on port 3001");
});