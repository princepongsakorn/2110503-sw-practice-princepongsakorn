const express = require("express");

const {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
} = require("../controllers/hotels");
const roomRouter = require("./rooms");

//Include other resource routers
const bookingRouter = require("./bookings");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

//Re-route into other resource routers
router.use("/:hotelId/bookings/", bookingRouter);
router.route("/").get(getHotels).post(protect, authorize("admin"), createHotel);
router
  .route("/:id")
  .get(getHotel)
  .put(protect, authorize("admin"), updateHotel)
  .delete(protect, authorize("admin"), deleteHotel);

router.use("/:hotelId/rooms", roomRouter);

module.exports = router;
