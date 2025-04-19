const nodemailer = require("nodemailer");
const dayjs = require("dayjs");

const sendBookingEmailToUser = async (user, hotel, booking) => {
  let testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"Hotel Booking" <no-reply@hotel.com>',
    to: user.email,
    subject: "Your Booking is Confirmed",
    text: `Dear ${user.name}, your booking is confirmed.`,
    html: `
    <h3>Thank you for your booking!</h3>
    <p><strong>Hotel:</strong> ${hotel.name}</p>
    <p><strong>Room:</strong> ${booking.room.roomNumber} (${
      booking.room.type
    }) - ${booking.room.price} THB</p>
    <p><strong>Check-in:</strong> ${dayjs(booking.checkInDate).format(
      "YYYY-MM-DD"
    )}</p>
    <p><strong>Check-out:</strong> ${dayjs(booking.checkOutDate).format(
      "YYYY-MM-DD"
    )}</p>
  `,
  });
  console.log("[sendBookingEmailToUser]:", nodemailer.getTestMessageUrl(info));
};
async function sendBookingNotificationToHotel(user, hotel, booking) {
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"Hotel Booking" <no-reply@hotel.com>',
    to: hotel.email,
    subject: `New Booking Received for ${hotel.name}`,
    html: `
      <h3>New Booking Notification</h3>
      <p><strong>Guest:</strong> ${user.name} (${user.email})</p>
      <p><strong>Room:</strong> ${booking.room.roomNumber}</p>
      <p><strong>Check-in:</strong> ${dayjs(booking.checkInDate).format(
        "YYYY-MM-DD"
      )}</p>
      <p><strong>Check-out:</strong> ${dayjs(booking.checkOutDate).format(
        "YYYY-MM-DD"
      )}</p>
    `,
  });

  console.log(
    "[sendBookingNotificationToHotel] Hotel notification sent.:",
    nodemailer.getTestMessageUrl(info)
  );
}

module.exports = { sendBookingNotificationToHotel, sendBookingEmailToUser };
