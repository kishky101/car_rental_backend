import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { bucket } from "../firebase"; // your firebase bucket setup

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

interface UploadRequest extends express.Request {
  file?: Express.Multer.File;
}

router.post(
  "/upload",
  upload.single("image"),
  async (req: UploadRequest, res: express.Response) => {
    try {
      if (!req.file) {
        res.status(400).send({ error: "No file uploaded" });
        return;
      }

      const blob = bucket.file(`cars/${uuidv4()}-${req.file.originalname}`);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      blobStream.on("error", (err: Error) => {
        console.error(err);
        res.status(500).send({ error: "Upload error" });
      });

      blobStream.on("finish", async () => {
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        res.status(200).json({ url: publicUrl });
      });

      blobStream.end(req.file.buffer);
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Something went wrong" });
    }
  }
);

export default router;
