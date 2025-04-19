const Room = require("../models/Room");
const Booking = require("../models/Booking");
const dayjs = require("dayjs");

exports.addRoom = async (req, res, next) => {
  try {
    const room = await Room.create({ ...req.body, hotel: req.params.hotelId });
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getRoomsByHotel = async (req, res, next) => {
  try {
    const rooms = await Room.find({ hotel: req.params.hotelId });
    res.status(200).json({ success: true, count: rooms.length, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: "Cannot retrieve rooms" });
  }
};

exports.getRoomsByHotelWithAvailability = async (req, res) => {
  const { hotelId } = req.params;
  const { checkInDate, checkOutDate } = req.query;

  if (!checkInDate || !checkOutDate) {
    return res
      .status(400)
      .json({ success: false, message: "Missing check-in or check-out date" });
  }

  try {
    const rooms = await Room.find({ hotel: hotelId });
    const availabilityPromises = rooms.map(async (room) => {
      const conflict = await Booking.findOne({
        room: room._id,
        checkOutDate: { $gt: dayjs(checkInDate).toDate() },
        checkInDate: { $lt: dayjs(checkOutDate).toDate() },
      });

      return {
        _id: room._id,
        roomNumber: room.roomNumber,
        type: room.type,
        price: room.price,
        description: room.description,
        available: !conflict,
      };
    });

    const results = await Promise.all(availabilityPromises);

    res
      .status(200)
      .json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.roomId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    res.status(200).json({ success: true, data: room });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.roomId);

    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete room" });
  }
};
