import express from "express";
import cors from "cors";
import example from "./example.json";
import capacityExample from "./capacity-example.json";

const app = express();
app.use(cors());

app.get("/api/v1/vehicles", async (req, res) => {
    try {
        res.json(example);
    } catch (error) {
        res.status(500).json({ error: "Failed to get vehicles" });
    }
});

app.get("/api/v1/capacity", async (req, res) => {
    try {
        res.json(capacityExample);
    } catch (error) {
        res.status(500).json({ error: "Failed to get capacity" });
    }
});

app.listen(3001, () => {
    console.log("Server running on port 3001");
});