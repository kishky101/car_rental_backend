// routes/carRoutes.ts
import express from "express";
import { saveToDB } from "../utils/firebase.util";
import { verifyFirebaseToken } from "../middleware/auth.middleware";
import { db } from "../firebase";

const router = express.Router();

// router.post("/add", async (req, res) => {
//   try {
//     const {
//       image,
//       title,
//       description,
//       seats,
//       fuelEconomy,
//       price,
//       transmission,
//       features,
//       category,
//     } = req.body;

//     // Validate payload
//     if (
//       !image ||
//       !title ||
//       !description ||
//       typeof seats !== "number" ||
//       !fuelEconomy ||
//       typeof price !== "number" ||
//       !transmission ||
//       !Array.isArray(features) ||
//       !category
//     ) {
//       res.status(400).json({ error: "Invalid car data" });
//       return;
//     }

//     const carData = {
//       image,
//       title,
//       description,
//       seats,
//       fuelEconomy,
//       price,
//       transmission,
//       features,
//       category,
//     };

//     const carId = await saveToDB("cars", carData);
//     res.status(201).json({ id: carId });
//   } catch (err) {
//     console.error("Error saving car:", err);
//     res.status(500).json({ error: "Failed to save car" });
//   }
// });

// GET /api/cars
router.get("/", async (req, res) => {
  try {
    const { available, category, page = 1, limit = 10 } = req.query;

    const snapshot = await db.ref("cars").once("value");
    const carsData = snapshot.val();

    if (!carsData) {
      res.status(200).json([]);
      return;
    }

    // Convert object to array
    let cars = Object.entries(carsData).map(([id, car]: [string, any]) => ({
      id,
      ...car,
    }));

    // Filter by availability
    if (available === "true") {
      cars = cars.filter((car: any) => car.isAvailable === true);
    }

    // Filter by category
    if (category) {
      cars = cars.filter(
        (car: any) =>
          car.category?.toLowerCase() === String(category).toLowerCase()
      );
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const start = (pageNum - 1) * limitNum;
    const paginatedCars = cars.slice(start, start + limitNum);

    res.status(200).json({
      total: cars.length,
      page: pageNum,
      limit: limitNum,
      cars: paginatedCars,
    });
    return;
  } catch (err) {
    console.error("Fetch cars error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

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
      category,
    } = req.body;

    // const uid = (req as any).user.uid;

    // Basic validation
    if (!title || !price || !category || !seats || !transmission) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const newCarRef = db.ref("cars").push();
    const newCar = {
      id: newCarRef.key,
      image: image || "",
      title,
      description: description || "",
      seats,
      fuelEconomy: fuelEconomy || "",
      price,
      transmission,
      features: Array.isArray(features) ? features : [],
      category,
      isAvailable: true,
      // addedBy: uid,
      addedAt: Date.now(),
    };

    await newCarRef.set(newCar);

    res.status(201).json({ message: "Car added successfully", car: newCar });
    return;
  } catch (err) {
    console.error("Add car error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/rent", verifyFirebaseToken, async (req, res) => {
  try {
    console.log("Rent request body:", req.body);
    
    const {
      carId,
      color,
      fuelType,
      modelYear,
      specialRequests,
      paymentMethod,
      startDate,
      endDate,
      cardName,
      cardNumber,
      expiry,
      cvv,
    } = req.body;

    const uid = (req as any).user.uid;

    if (!carId || !startDate || !endDate) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const carSnapshot = await db.ref(`cars/${carId}`).once("value");
    const car = carSnapshot.val();

    if (!car) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    if (car.isAvailable === false) {
      res.status(400).json({ message: "Car is already rented" });
      return;
    }

    const rentalData: Record<string, any> = {
      carId,
      color,
      fuelType,
      modelYear,
      specialRequests,
      paymentMethod,
      startDate,
      endDate,
      rentedAt: Date.now(),
    };

    if (paymentMethod === "card") {
      rentalData.card = {
        cardName,
        cardNumber,
        expiry,
        cvv,
      };
    }

    await db.ref(`rentals/${uid}`).push(rentalData);
    await db.ref(`cars/${carId}`).update({ isAvailable: false });

    res.json({ message: "Car rented successfully" });
  } catch (err) {
    console.error("Rent error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/return", verifyFirebaseToken, async (req, res) => {
  try {
    const { carId } = req.body;
    const uid = (req as any).user.uid;

    if (!carId) {
      res.status(400).json({ message: "carId is required" });
      return;
    }

    // Search user's rentals for an active rental of this car
    const userRentalsSnap = await db.ref(`rentals/${uid}`).once("value");
    const userRentals = userRentalsSnap.val() || {};

    const rentalEntry = Object.entries(userRentals).find(
      ([, rental]: any) => rental.carId === carId && rental.returnedAt == null
    );

    if (!rentalEntry) {
      res.status(403).json({ message: "No active rental found for this car" });
      return;
    }

    const [rentalId] = rentalEntry;

    // Mark rental as returned
    await db.ref(`rentals/${uid}/${rentalId}`).update({
      returnedAt: Date.now(),
    });

    // Mark car as available again
    await db.ref(`cars/${carId}`).update({ isAvailable: true });

    res.status(200).json({ message: "Car returned successfully" });
  } catch (err) {
    console.error("Return error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/remove", verifyFirebaseToken, async (req, res) => {
  try {
    const { carId } = req.body;
    if (!carId) {
      res.status(400).json({ message: "carId is required" });
      return;
    }

    const carRef = db.ref(`cars/${carId}`);
    const carSnap = await carRef.once("value");
    const car = carSnap.val();

    if (!car) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    if (!car.isAvailable) {
      res
        .status(400)
        .json({ message: "Car is currently rented and cannot be removed" });
      return;
    }

    await carRef.remove();
    res.status(200).json({ message: "Car removed successfully" });
  } catch (err) {
    console.error("Remove car error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
