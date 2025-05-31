import express from "express";
import { auth, db } from "../firebase";
import fetch from "node-fetch";

const router = express.Router();

// ✅ Register route
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const userRecord = await auth.createUser({
      email,
      password,
    });

    const uid = userRecord.uid;

    // Save user data in Realtime Database under users/[uid]
    await db.ref(`users/${uid}`).set({
      name,
      email,
      createdAt: new Date().toISOString(),
    });

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      res.status(400).json({ message: data.error.message });
      return;
    }

    res.status(201).json({
      message: "User registered successfully",
      uid: userRecord.uid,
      email: userRecord.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      localId: data.localId,
    });
  } catch (error: any) {
    console.error("Error registering user:", error);
    res.status(400).json({ message: error.message });
  }
});

// ✅ Login route
router.post("/login", async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  try {
    // 🚫 firebase-admin does NOT support password sign-in directly
    // You have to use Firebase Auth REST API to verify password
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      res.status(400).json({ message: data.error.message });
      return;
    }

    res.status(200).json({
      message: "User signed in successfully",
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      localId: data.localId,
    });
  } catch (error) {
    console.error("Error signing in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
