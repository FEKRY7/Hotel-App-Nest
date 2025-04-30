import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, RequestTimeoutException } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public async SendReminderEmail(email: string) {
    try {
      await this.mailerService.sendMail({
        from: `"No Reply" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'NoReply (Email Confirmation Reminder)',
        text: 'This mail was sent automatically as a reminder to confirm your email. Please do not reply.',
      });
      console.log(`Email sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error);
    }
  }

  public async sendOtpEmailTemplate(email: string, name: string) {
    try {
      console.log('Sending email to:', email);

      await this.mailerService.sendMail({
        to: email,
        from: `your-email@example.com`,
        subject: 'Welcome to Hotel',
        text: `Hello ${name}, Welcome to Hotel. We are glad to have you with us.`,
        template: 'verify-email',
        context: { email, name },
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new RequestTimeoutException('Failed to send email verification');
    }
  }

  public async sendVerificationMessage(
    email: string,
    name: string,
    generatedCode: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `your-email@example.com`,
        subject: 'Hotel Verification Code',
        template: 'create-verificationmessage',
        context: { email, name, generatedCode }, // Ensure correct context
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new RequestTimeoutException('Failed to send email verification');
    }
  }

  public async sendForgetPasswordEmail(
    email: string,
    name: string,
    generatedCode: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `your-email@example.com`,
        subject: 'Password Code From BAZARYO',
        template: 'create-forgetmessage',
        context: { email, name, generatedCode }, // Ensure correct context
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new RequestTimeoutException('Failed to send email verification');
    }
  }

  public async sendChanagePasswordEmail(email: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `your-email@example.com`,
        subject: 'Password changed successfully',
        template: 'ChanagePass',
        context: { email }, // Ensure correct context
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new RequestTimeoutException('Failed to send email verification');
    }
  }

  public async sendLoginStaffEmail(email: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `your-email@example.com`,
        subject: 'Logged in successfully',
        template: 'LoginStaff',
        context: { email }, // Ensure correct context
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new RequestTimeoutException('Failed to send email verification');
    }
  }

  public async sendBookingConfirmationMessage(
    name: string,
    email: string,
    numberOfDays: number,
    checkInDate: string, // passed as formatted string
    checkOutDate: string, // passed as formatted string
    roomNumber: string,
    totalPrice: number,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: process.env.MAIL_FROM || 'your-email@example.com',
        subject: 'Booking Confirmation',
        template: 'create-bookingconfirmation', // Must exist in views folder
        context: {
          name,
          email,
          numberOfDays,
          checkInDate,
          checkOutDate,
          roomNumber,
          totalPrice,
        },
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new RequestTimeoutException('Failed to send booking confirmation email');
    }
  }

  public async sendPaymentConfirmationMessage(
    name: string,
    email: string,
    _id: string,
    checkInDate: string, // passed as formatted string
    checkOutDate: string, // passed as formatted string
    room: string,
    totalPrice: number,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: process.env.MAIL_FROM || 'your-email@example.com',
        subject: 'Payment Confirmation',
        template: 'create-paymentconfirmation', // Must exist in views folder
        context: {
          name,
          email,
          _id,
          checkInDate,
          checkOutDate,
          room,
          totalPrice,
        },
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new RequestTimeoutException('Failed to send payment confirmation email');
    }
  }
  
}
