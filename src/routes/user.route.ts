import express from "express";
import { auth, db } from "../firebase";
import {
  AuthRequest,
  verifyFirebaseToken,
} from "../middleware/auth.middleware";

const router = express.Router();

router.get(
  "/profile",
  verifyFirebaseToken,
  async (req: AuthRequest, res: express.Response) => {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({ message: "Unauthorized: No user ID found" });
      return;
    }

    try {
      const userSnapshot = await db.ref(`users/${uid}`).once("value");
      const userData = userSnapshot.val();

      if (!userData) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json({
        uid,
        name: userData.name,
        email: userData.email,
        createdAt: userData.createdAt,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
