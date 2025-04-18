const dayjs = require("dayjs");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Public
exports.getBookings = async (req, res, next) => {
  let query;
  // General users can see only their bookings!
  if (req.user.role !== "admin") {
    query = Booking.find({ user: req.user.id })
      .populate({
        path: "hotel",
        select: "name province tel",
      })
      .populate("room", "roomNumber type price");
  } else {
    // If you are an admin, you can see all!
    if (req.params.hotelId) {
      query = Booking.find({ hotel: req.params.hotelId })
        .populate({
          path: "hotel",
          select: "name province tel",
        })
        .populate("room", "roomNumber type price");
    } else {
      query = Booking.find()
        .populate({
          path: "hotel",
          select: "name province tel",
        })
        .populate("room", "roomNumber type price");
    }
  }

  try {
    const bookings = await query;
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot find Booking",
    });
  }
};

//@desc Get single booking
//@route GET /api/v1/bookings/:id
//@access Public
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: "hotel",
        select: "name description tel",
      })
      .populate("room", "roomNumber type price");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot find Booking",
    });
  }
};

//@desc      Add booking
//@route     POST /api/v1/hotels/:hotelId/booking
//@access    Private
exports.addBooking = async (req, res, next) => {
  try {
    req.body.hotel = req.params.hotelId;
    req.body.user = req.user.id;

    const { checkInDate, checkOutDate, room: roomId } = req.body;
    const hotel = await Hotel.findById(req.params.hotelId);
    const room = await Room.findById(roomId);

    if (!hotel || !room || room.hotel.toString() !== hotel._id.toString()) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Hotel or Room not found or mismatch",
        });
    }

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: "Please specify both check-in and check-out dates",
      });
    }

    const nightsToBook = dayjs(checkOutDate).diff(dayjs(checkInDate), "day");
    if (nightsToBook <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range",
      });
    }

    // check booking conflict for a room for this time
    const conflict = await Booking.findOne({
      room: roomId,
      checkOutDate: { $gte: today },
      $or: [
        {
          checkInDate: { $lt: checkOutDate },
          checkOutDate: { $gt: checkInDate },
        },
      ],
    });

    if (conflict) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Room already booked during this period",
        });
    }

    // Find all existing bookings and calculate total nights
    const existingBookings = await Booking.find({ user: req.user.id });
    let totalNights = 0;
    for (const b of existingBookings) {
      totalNights += dayjs(b.checkOutDate).diff(dayjs(b.checkInDate), "day");
    }

    // If the user is not an admin, they can only create 3 bookings
    if (totalNights + nightsToBook > 3 && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `Booking exceeds 3 nights limit. You have already booked ${totalNights} nights.`,
      });
    }

    const booking = await Booking.create(req.body);

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Cannot create Booking",
    });
  }
};

//@desc      Update booking
//@route     PUT /api/v1/bookings/:id
//@access    Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    // Make sure the user is the booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this booking`,
      });
    }

    const { checkInDate, checkOutDate } = req.body;
    if (checkInDate && checkOutDate && req.user.role !== "admin") {
      const newNights = dayjs(checkOutDate).diff(dayjs(checkInDate), "day");
      if (newNights <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid date range",
        });
      }

      const existingBookings = await Booking.find({
        user: req.user.id,
        _id: { $ne: req.params.id },
      });

      let totalNights = 0;
      for (const b of existingBookings) {
        totalNights += dayjs(b.checkOutDate).diff(dayjs(b.checkInDate), "day");
      }

      if (totalNights + newNights > 3) {
        return res.status(400).json({
          success: false,
          message: `Updating this booking exceeds 3 nights limit. You have already booked ${totalNights} nights.`,
        });
      }
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot update Booking",
    });
  }
};

//@desc      Delete booking
//@route     DELETE /api/v1/bookings/:id
//@access    Private
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`,
      });
    }

    // Make sure the user is the booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this booking`,
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot delete Booking",
    });
  }
};
