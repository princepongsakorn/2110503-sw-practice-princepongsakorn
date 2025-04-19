const nodemailer = require("nodemailer");
const dayjs = require("dayjs");
class EmailService {
  constructor() {
    this.transporter = null;
  }

  async init() {
    if (this.transporter) return;
    const testAccount = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  async sendMail(options) {
    await this.init();
    const info = await this.transporter.sendMail(options);
    console.log(`[emailService] ${options.subject} sent:`, nodemailer.getTestMessageUrl(info));
  }
}

const emailService = new EmailService();

const sendBookingEmailToUser = async (user, hotel, booking) => {
  await emailService.sendMail({
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
};

async function sendBookingNotificationToHotel(user, hotel, booking) {
  await emailService.sendMail({
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
}

async function sendBookingCancellationToHotel(user, hotel, booking) {
  await emailService.sendMail({
    from: '"Hotel Booking" <no-reply@hotel.com>',
    to: hotel.email,
    subject: `Booking Cancelled for ${hotel.name}`,
    html: `
      <h3>Booking Cancellation Notice</h3>
      <p><strong>Guest:</strong> ${user.name} (${user.email})</p>
      <p><strong>Room:</strong> ${booking.room.roomNumber} (${
      booking.room.type
    })</p>
      <p><strong>Check-in:</strong> ${dayjs(booking.checkInDate).format(
        "YYYY-MM-DD"
      )}</p>
      <p><strong>Check-out:</strong> ${dayjs(booking.checkOutDate).format(
        "YYYY-MM-DD"
      )}</p>
      <p>The guest has cancelled this booking.</p>
    `,
  });
}

async function sendBookingCancellationToUser(user, hotel, booking) {
  await emailService.sendMail({
    from: "booking-system@yourdomain.com",
    to: user.email,
    subject: "Your Booking Has Been Cancelled",
    html: `
      <h3>Your Booking is Cancelled</h3>
      <p><strong>Hotel:</strong> ${hotel.name}</p>
      <p><strong>Room:</strong> ${booking.room.roomNumber} (${
      booking.room.type
    })</p>
      <p><strong>Check-in:</strong> ${dayjs(booking.checkInDate).format(
        "YYYY-MM-DD"
      )}</p>
      <p><strong>Check-out:</strong> ${dayjs(booking.checkOutDate).format(
        "YYYY-MM-DD"
      )}</p>
      <p>You have successfully cancelled this booking.</p>
    `,
  });
}

module.exports = {
  sendBookingNotificationToHotel,
  sendBookingEmailToUser,
  sendBookingCancellationToHotel,
  sendBookingCancellationToUser,
};
