import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JWTStaffType } from 'src/untils/types';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './room.schema';
import { Hotel, HotelDocument } from '../Hotel/hotel.schema';
import { CloudinaryService } from 'src/Cloudinary/cloudinary.service';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { ReservationStatusType } from 'src/untils/enums';
import { RoomToolsDto } from './dtos/room-tools.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  public async getrooms(page: number, limit: number, StatusRoom?: string) {
    const startIndex = (page - 1) * limit;
    const filter = StatusRoom ? { reservationStatus: StatusRoom } : {};
    const totalRooms = await this.roomModel.countDocuments(filter);

    const Rooms = await this.roomModel
      .find(filter)
      .select('-createdAt -updatedAt -__v -_id')
      .populate({
        path: 'HotelId',
        select: 'name managerId -_id',
        populate: {
          path: 'managerId',
          select: 'name email -_id',
        },
      })
      .skip(startIndex)
      .limit(limit);

    return {
      totalRooms,
      message: 'Rooms fetched successfully',
      DetailsOfRooms: Rooms,
      currentPage: page,
      pageSize: limit,
    };
  }

  public async createRoom(
    hotelId: string,
    createRoomDto: CreateRoomDto,
    staffPelod: JWTStaffType,
    roomImages: Express.Multer.File[],
  ) {
    if (!roomImages || !roomImages.length) {
      throw new NotFoundException('roomImages are required');
    }

    const hotel = await this.hotelModel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const imagesUploadResults = await this.cloudinaryService.uploadRoomImages(
      staffPelod,
      roomImages,
      'image',
    );

    const formattedImages = imagesUploadResults.map((result) => ({
      secure_url: result.secure_url,
      public_id: result.public_id,
    }));

    const newRoom = new this.roomModel({
      ...createRoomDto,
      hotelId: hotel._id,
      roomImages: formattedImages,
    });

    await newRoom.save();

    return {
      message: 'Room created successfully',
      newRoom,
    };
  }

  public async getRoomById(roomId: string) {
    const room = await this.roomModel
      .findById(roomId)
      .select('-createdAt -updatedAt -__v -_id')
      .populate({
        path: 'hotelId',
        select: 'name managerId -_id',
        populate: {
          path: 'managerId',
          select: 'name email -_id',
        },
      });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  public async updateRoom(
    id: string,
    hotelId: string,
    updateRoomDto: UpdateRoomDto,
    staffPelod: JWTStaffType,
    roomImages: Express.Multer.File[],
  ) {
    const hotel = await this.hotelModel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const isExistRoom = await this.roomModel.findById(id);
    if (!isExistRoom) {
      throw new NotFoundException('Room not found');
    }

    let formattedImages = isExistRoom.roomImages || [];

    if (roomImages?.length) {
      // Upload new images
      const imagesUploadResults = await this.cloudinaryService.uploadRoomImages(
        staffPelod,
        roomImages,
        'image',
      );

      formattedImages = imagesUploadResults.map((result) => ({
        secure_url: result.secure_url,
        public_id: result.public_id,
      }));

      // Delete old images from Cloudinary
      if (isExistRoom.roomImages?.length) {
        await Promise.all(
          isExistRoom.roomImages.map((image) =>
            this.cloudinaryService.destroyImage(image.public_id),
          ),
        );
      }
    }
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          ...updateRoomDto,
          roomImages: formattedImages,
        },
        { new: true },
      )
      .lean();

    return {
      message: 'Hotel updated successfully',
      updatedRoom,
    };
  }

  public async deleteRoom(id: string) {
    const isExistRoom = await this.roomModel.findById(id);
    if (!isExistRoom) {
      throw new NotFoundException('This Room does not exist');
    }

    if (isExistRoom.reservationStatus === ReservationStatusType.CONFIRMED) {
      throw new NotFoundException('Cannot delete a confirmed reservation');
    }

    if (isExistRoom.roomImages?.length) {
      await Promise.all(
        isExistRoom.roomImages.map(async (image: any) => {
          if (image.public_id) {
            await this.cloudinaryService.destroyImage(image.public_id);
          }
        }),
      );
    }

    await this.roomModel.findByIdAndDelete(id);
    return { message: 'Room deleted successfully' };
  }

  // [Manager Sevice]

  public async getRoomsByManagerId(
    staffPelod: JWTStaffType,
    page: number,
    limit: number,
  ) {
    const managerId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [managerId] },
    }); 
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const currentPage = parseInt(page as any) || 1;
    const pageSize = parseInt(limit as any) || 10;
    const startIndex = (currentPage - 1) * pageSize;

    const totalRooms = await this.roomModel.countDocuments({
      hotelId: hotel._id,
    });

    const rooms = await this.roomModel
      .find({ hotelId: hotel._id })
      .select('-createdAt -updatedAt -__v -_id')
      .populate({
        path: 'hotelId',
        select: 'name -_id',
        populate: {
          path: 'managerId',
          select: 'name email -_id',
        },
      })
      .skip(startIndex)
      .limit(pageSize);

    return {
      totalRooms,
      message: 'Rooms fetched successfully',
      DetailsOfRooms: rooms,
      currentPage,
      pageSize,
    };
  }

  public async getRoomsByStatus(
    staffPelod: JWTStaffType,
    reservationStatus: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const managerId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [managerId] },
    }); 
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const startIndex = (page - 1) * limit;

    const totalRooms = await this.roomModel.countDocuments({
      hotelId: hotel._id,
      reservationStatus,
    });

    const rooms = await this.roomModel
      .find({
        hotelId: hotel._id,
        reservationStatus,
      })
      .select('-createdAt -updatedAt -__v -_id')
      .populate({
        path: 'hotelId',
        select: 'name -_id',
        populate: {
          path: 'managerId',
          select: 'name email -_id',
        },
      })
      .skip(startIndex)
      .limit(limit);

    return {
      totalRooms,
      message: 'Rooms fetched successfully',
      DetailsOfRooms: rooms,
      currentPage: page,
      pageSize: limit,
    };
  }

  public async createRoomByManagerId(
    staffPelod: JWTStaffType,
    createRoomDto: CreateRoomDto,
    roomImages: Express.Multer.File[],
  ) {
    if (!roomImages || !roomImages.length) {
      console.log(roomImages);
      throw new NotFoundException('roomImages are required');
    }
    const managerId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [managerId] },
    }); 
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const imagesUploadResults = await this.cloudinaryService.uploadRoomImages(
      staffPelod,
      roomImages,
      'image',
    );

    const formattedImages = imagesUploadResults.map((result) => ({
      secure_url: result.secure_url,
      public_id: result.public_id,
    }));

    const newRoom = new this.roomModel({
      ...createRoomDto,
      hotelId: hotel._id,
      roomImages: formattedImages,
    });

    await newRoom.save();

    return {
      message: 'Room created successfully',
      newRoom,
    };
  }

  public async deleteRoomByManagerId(staffPelod: JWTStaffType, id: string) {
    const managerId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [managerId] },
    }); 
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const isExistRoom = await this.roomModel.findById(id);
    if (!isExistRoom) {
      throw new NotFoundException(`Room not found in hotel ${hotel.name}`);
    }

    if (isExistRoom.reservationStatus === ReservationStatusType.CONFIRMED) {
      throw new NotFoundException('Cannot delete a confirmed reservation');
    }

    if (isExistRoom.roomImages?.length) {
      await Promise.all(
        isExistRoom.roomImages.map(async (image: any) => {
          if (image.public_id) {
            await this.cloudinaryService.destroyImage(image.public_id);
          }
        }),
      );
    }

    await this.roomModel.findByIdAndDelete(id);
    return { message: 'Room deleted successfully' };
  }

  public async updateRoomByManagerId(
    id: string,
    updateRoomDto: UpdateRoomDto,
    staffPelod: JWTStaffType,
    roomImages: Express.Multer.File[],
  ) {
    const managerId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [managerId] },
    }); 
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const isExistRoom = await this.roomModel.findById(id);
    if (!isExistRoom) {
      throw new NotFoundException(`Room not found in hotel ${hotel.name}`);
    }

    let formattedImages = isExistRoom.roomImages || [];

    if (roomImages?.length) {
      // Upload new images
      const imagesUploadResults = await this.cloudinaryService.uploadRoomImages(
        staffPelod,
        roomImages,
        'image',
      );

      formattedImages = imagesUploadResults.map((result) => ({
        secure_url: result.secure_url,
        public_id: result.public_id,
      }));

      // Delete old images from Cloudinary
      if (isExistRoom.roomImages?.length) {
        await Promise.all(
          isExistRoom.roomImages.map((image) =>
            this.cloudinaryService.destroyImage(image.public_id),
          ),
        );
      }
    }
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          ...updateRoomDto,
          roomImages: formattedImages,
        },
        { new: true },
      )
      .lean();

    return {
      message: 'Room updated successfully',
      updatedRoom,
    };
  }

  public async getRoomByManagerId(staffPelod: JWTStaffType, id: string) {
    const managerId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [managerId] },
    }); 
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid room ID');
    }

    const room = await this.roomModel
      .findOne({ _id: id, hotelId: hotel._id })
      .select('-createdAt -updatedAt -__v -_id')
      .populate({
        path: 'hotelId',
        select: 'name -_id',
        populate: {
          path: 'managerId',
          select: 'name email -_id',
        },
      });

    if (!room) {
      throw new NotFoundException(
        `Room not found or does not belong to your hotel (${hotel.name})`,
      );
    }

    return {
      message: 'Room fetched successfully',
      room,
    };
  }

  // [Receptionist Sevice]

  public async updateRoomByReceptionistId(
    id: string,
    updateRoomDto: UpdateRoomDto,
    staffPelod: JWTStaffType,
    roomImages: Express.Multer.File[],
  ) {
    const receptionistId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [receptionistId] },
    });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const isExistRoom = await this.roomModel.findById(id);
    if (!isExistRoom) {
      throw new NotFoundException(`Room not found in hotel ${hotel.name}`);
    }

    let formattedImages = isExistRoom.roomImages || [];

    if (roomImages?.length) {
      // Upload new images
      const imagesUploadResults = await this.cloudinaryService.uploadRoomImages(
        staffPelod,
        roomImages,
        'image',
      );

      formattedImages = imagesUploadResults.map((result) => ({
        secure_url: result.secure_url,
        public_id: result.public_id,
      }));

      // Delete old images from Cloudinary
      if (isExistRoom.roomImages?.length) {
        await Promise.all(
          isExistRoom.roomImages.map((image) =>
            this.cloudinaryService.destroyImage(image.public_id),
          ),
        );
      }
    }
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          ...updateRoomDto,
          roomImages: formattedImages,
        },
        { new: true },
      )
      .lean();

    return {
      message: 'Room updated successfully',
      updatedRoom,
    };
  }

  public async changeRoomStatus(
    id: string,
    roomToolsDto: RoomToolsDto,
    staffPelod: JWTStaffType,
  ) {
    const { status } = roomToolsDto;
    const receptionistId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [receptionistId] },
    });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const isExistRoom = await this.roomModel.findById(id);
    if (!isExistRoom) {
      throw new NotFoundException(`Room not found in hotel ${hotel.name}`);
    }

    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          reservationStatus: status,
        },
        { new: true },
      )
      .lean();

    return {
      message: 'Room status updated successfully',
      data: updatedRoom.reservationStatus,
    };
  }

  public async updateRoomDescription(
    id: string,
    roomToolsDto: RoomToolsDto,
    staffPelod: JWTStaffType,
  ) {
    const { description } = roomToolsDto;
    const receptionistId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [receptionistId] },
    });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const isExistRoom = await this.roomModel.findById(id);
    if (!isExistRoom) {
      throw new NotFoundException(`Room not found in hotel ${hotel.name}`);
    }

    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          description: description,
        },
        { new: true },
      )
      .lean();

    return {
      message: 'Room description updated successfully',
      data: updatedRoom.description,
    };
  }

  public async updateRoomDiscount(
    id: string,
    roomToolsDto: RoomToolsDto,
    staffPelod: JWTStaffType,
  ) {
    const { discounts } = roomToolsDto;
    const receptionistId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [receptionistId] },
    });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const isExistRoom = await this.roomModel.findById(id);
    if (!isExistRoom) {
      throw new NotFoundException(`Room not found in hotel ${hotel.name}`);
    }

    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          discounts: discounts,
        },
        { new: true },
      )
      .lean();

    return {
      message: 'Room discount updated successfully',
      data: updatedRoom.discounts,
    };
  }

  public async updateRoomAmenities(
    id: string,
    roomToolsDto: RoomToolsDto,
    staffPelod: JWTStaffType,
  ) {
    const { amenities } = roomToolsDto;
    const receptionistId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [receptionistId] },
    });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const isExistRoom = await this.roomModel.findById(id);
    if (!isExistRoom) {
      throw new NotFoundException(`Room not found in hotel ${hotel.name}`);
    }

    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          roomAmenities: amenities,
        },
        { new: true },
      )
      .lean();

    return {
      message: 'Room amenities updated successfully',
      data: updatedRoom.roomAmenities,
    };
  }

  // [Cleaner Service]

  public async changeRoomAvailability(id: string, staffPelod: JWTStaffType) {
    const cleanerId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [cleanerId] },
    });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const isExistRoom = await this.roomModel.findById(id);
    if (!isExistRoom) {
      throw new NotFoundException(`Room not found in hotel ${hotel.name}`);
    }

    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          availability: true,
        },
        { new: true },
      )
      .lean();

    return {
      message: 'Room availability updated successfully',
      data: updatedRoom.availability,
    };
  }

  public async getRoomsWithoutAvailability(staffPelod: JWTStaffType) {
    const cleanerId = staffPelod._id;

    const hotel = await this.hotelModel.findOne({
      staffIds: { $in: [cleanerId] },
    });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const rooms = await this.roomModel
      .find({ hotelId: hotel._id, availability: false })
      .select('roomNumber floor -_id');
    if (!rooms) {
      throw new NotFoundException('No rooms found without availability');
    }
    return {
      message: rooms,
    };
  }

  // [Customer Service]

  public async checkoutFromRoom(id: string, roomToolsDto: RoomToolsDto) {
    const { status } = roomToolsDto;
    const room = await this.roomModel.findById(id);
    if (!room) {
      throw new NotFoundException(`Room not found with id ${room}`);
    }

    if (room.availability === false) {
      throw new NotFoundException('Room is not available');
    }

    await this.roomModel
      .findByIdAndUpdate(
        id,
        {
          availability: false,
          reservationStatus: status,
          checkOutDate: new Date(),
        },
        { new: true },
      )
      .lean();

    return {
      message: 'Room checkout successful',
    };
  }
}