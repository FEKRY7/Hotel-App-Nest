import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JWTPayloadType, JWTStaffType } from '../untils/types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './booking.schema';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { Room, RoomDocument } from 'src/Room/room.schema';
import { MailService } from '../mail/mail.service';
import { RoleTowType, StatusType } from 'src/untils/enums';
import { Hotel, HotelDocument } from '../Hotel/hotel.schema';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>,
    private readonly mailService: MailService,
  ) {}

  public async addBooking(
    roomId: string,
    createBookingDto: CreateBookingDto,
    payload: JWTPayloadType,
  ) {
    const {
      checkInDate,
      checkOutDate,
      guests,
      status,
      numberOfDays,
      paymentStatus,
    } = createBookingDto;

    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.pricePerNight) {
      throw new NotFoundException('Room price is not available');
    }

    const user = payload._id;
    const hotel = room.hotelId;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    const calculatedDays =
      numberOfDays ||
      Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );

    const totalPrice = calculatedDays * room.pricePerNight;

    const newBooking = new this.bookingModel({
      user,
      room: room._id,
      hotel,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guests,
      numberOfDays: calculatedDays,
      totalPrice,
      status,
      paymentStatus,
    });

    await newBooking.save();

    let emailSentMessage = 'There was an issue sending the email';
    try {
      await this.mailService.sendBookingConfirmationMessage(
        payload.name,
        payload.email,
        calculatedDays,
        checkIn.toDateString(),
        checkOut.toDateString(),
        room.roomNumber,
        totalPrice,
      );
      emailSentMessage = 'Email sent successfully';
    } catch (error) {
      console.error('Error sending email:', error);
    }

    return {
      message: 'Booking created successfully',
      booking: newBooking,
      emailStatus: emailSentMessage,
    };
  }

  public async cancelBooking(id: string) {
    const booking = await this.bookingModel.findById(id);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === StatusType.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    booking.status = StatusType.CANCELLED;
    await booking.save();

    return {
      message: 'Booking cancelled successfully',
      bookingId: booking._id,
      status: booking.status,
    };
  }

  public async getBookings(staffPayload: JWTStaffType) {
    const { _id: staffId, role: staffRole } = staffPayload;

    let hotel;

    if (staffRole === RoleTowType.RECEPTIONIST) {
      hotel = await this.hotelModel.findOne({ staffsIds: { $in: [staffId] } });

      if (!hotel) {
        throw new NotFoundException(
          'Hotel not found for the logged-in receptionist',
        );
      }
    } else if (staffRole === RoleTowType.MANAGER) {
      hotel = await this.hotelModel.findOne({ managerId: staffId });

      if (!hotel) {
        throw new NotFoundException(
          'Hotel not found for the logged-in manager',
        );
      }
    } else {
      throw new UnauthorizedException('Unauthorized role');
    }

    const bookings = await this.bookingModel
      .find({ hotel: hotel._id, status: { $ne: StatusType.CANCELLED } })
      .select('-status -_id -createdAt -updatedAt -__v -checkOutDate')
      .populate('user', 'name email -_id')
      .populate('room', 'roomNumber roomType availability floor -_id')
      .populate({
        path: 'hotel',
        select: 'name managerId -_id',
        populate: {
          path: 'managerId',
          select: 'name -_id',
        },
      });

    return {
      message: 'Bookings retrieved successfully',
      bookings,
    };
  }

  public async getAllBookings(
    page = 1,
    limit = 10,
  ): Promise<{
    page: number;
    limit: number;
    totalPages: number;
    bookings: any[];
  }> {
    const startIndex = (page - 1) * limit;
    const total = await this.bookingModel.countDocuments();

    const bookings = await this.bookingModel
      .find()
      .select('-status -_id -createdAt -updatedAt -__v -checkOutDate')
      .populate('user', 'name email -_id')
      .populate('room', 'roomNumber roomType availability floor -_id')
      .populate({
        path: 'hotel',
        select: 'name managerId -_id',
        populate: {
          path: 'managerId',
          select: 'name -_id',
        },
      })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    return {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      bookings,
    };
  }

  public async getBookingById(id: string, staffPayload: JWTStaffType) {
    const { _id: staffId, role: staffRole } = staffPayload;

    const booking = await this.bookingModel
      .findById(id)
      .select('-status -_id -createdAt -updatedAt -__v -checkOutDate')
      .populate('user', 'name email -_id')
      .populate('room', 'roomNumber roomType availability floor -_id')
      .populate({
        path: 'hotel',
        select: 'name managerId -_id',
        populate: {
          path: 'managerId',
          select: 'name -_id',
        },
      })
      .lean();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (!booking.hotel) {
      throw new NotFoundException(
        'Hotel information is missing in this booking',
      );
    }

    const isOwner = staffRole === RoleTowType.OWNER;
    const managerId = (booking.hotel as any)?.managerId as any;

    const isManagerOrReceptionist =
      (staffRole === RoleTowType.MANAGER ||
        staffRole === RoleTowType.RECEPTIONIST) &&
      managerId?.toString() === staffId.toString();

    if (isOwner || isManagerOrReceptionist) {
      return { message: booking };
    }

    throw new NotFoundException('Unauthorized');
  }
}
