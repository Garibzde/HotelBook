import { Router } from "express";
import {
  createHotel,
  getHotel,
  listHotels,
  setHotelStatus,
  updateHotel,
} from "../controllers/hotel.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.get("/", listHotels);
router.get("/:id", getHotel);
router.post("/", authenticate, authorize("ADMIN"), createHotel);
router.put("/:id", authenticate, authorize("ADMIN", "MANAGER"), updateHotel);
router.patch("/:id/status", authenticate, authorize("ADMIN"), setHotelStatus);

export default router;