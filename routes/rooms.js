const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  addRoom,
  getRoomsByHotel,
  updateRoom,
  deleteRoom,
} = require("../controllers/room");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .post(protect, authorize("admin"), addRoom)
  .get(protect, getRoomsByHotel);

router
  .route("/:roomId")
  .put(protect, authorize("admin"), updateRoom)
  .delete(protect, authorize("admin"), deleteRoom);

module.exports = router;
