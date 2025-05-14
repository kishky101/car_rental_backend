// routes/carRoutes.ts
import express from "express";
import { saveToDB } from "../utils/firebase.util";

const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    const {
      image,
      title,
      description,
      seats,
      fuelEconomy,
      price,
      transmission,
      features,
      viewUrl,
      category,
    } = req.body;

    // Validate payload
    if (
      !image ||
      !title ||
      !description ||
      typeof seats !== "number" ||
      !fuelEconomy ||
      typeof price !== "number" ||
      !transmission ||
      !Array.isArray(features) ||
      !viewUrl ||
      !category
    ) {
      res.status(400).json({ error: "Invalid car data" });
      return;
    }

    const carData = {
      image,
      title,
      description,
      seats,
      fuelEconomy,
      price,
      transmission,
      features,
      viewUrl,
      category,
    };

    const carId = await saveToDB("cars", carData);
    res.status(201).json({ id: carId });
  } catch (err) {
    console.error("Error saving car:", err);
    res.status(500).json({ error: "Failed to save car" });
  }
});

export default router;
