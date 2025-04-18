const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel',
    required: true
  },
  roomNumber: {
    type: String,
    required: [true, 'Please provide room number'],
    unique: true,
  },
  type: {
    type: String,
    enum: ['single', 'double', 'suite'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: String
});

module.exports = mongoose.model('Room', RoomSchema);
