import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JWTPayloadType } from 'src/untils/types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hotel, HotelDocument } from './hotel.schema';
import { CloudinaryService } from 'src/Cloudinary/cloudinary.service';
import { HotelDto } from './dtos/create-hotel.dto';
import { UpdateHotelDto } from './dtos/update-hotel.dto';

@Injectable()
export class HotelService {
  constructor(
    @InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  public async addHotel(
    hotelDto: HotelDto,
    payload: JWTPayloadType,
    images: Express.Multer.File[],
  ) {
    let formattedImages = [];

    if (images?.length) {
      const imagesUploadResults =
        await this.cloudinaryService.uploadHotelImages(
          payload,
          images,
          'image',
        );

      formattedImages = imagesUploadResults.map((result) => ({
        secure_url: result.secure_url,
        public_id: result.public_id,
      }));
    }

    const hotelDoc = await this.hotelModel.create({
      ...hotelDto,
      images: formattedImages,
      createdBy: payload._id,
    });
    
    const hotel = hotelDoc.toObject();
    
    return {
      message: 'Hotel created successfully',
      hotel,
      createdBy: payload.name || 'Unknown User',
    };
  }
 
  public async updateHotel(
    id: string,
    updateHotelDto: UpdateHotelDto,
    payload: JWTPayloadType,
    images: Express.Multer.File[],
  ) {
    const isExistHotel = await this.hotelModel.findById(id);
    if (!isExistHotel) {
      throw new NotFoundException('This Hotel does not exist');
    }

    if (isExistHotel.createdBy.toString() !== payload._id.toString()) {
      throw new ForbiddenException(
        "You don't have permission to update this post",
      );
    }

    let formattedImages = isExistHotel.images || [];

    if (images?.length) {
      // Upload new images
      const imagesUploadResults =
        await this.cloudinaryService.uploadHotelImages(
          payload,
          images,
          'image',
        );

      formattedImages = imagesUploadResults.map((result) => ({
        secure_url: result.secure_url,
        public_id: result.public_id,
      }));

      // Delete old images from Cloudinary
      if (isExistHotel.images?.length) {
        await Promise.all(
          isExistHotel.images.map((image) =>
            this.cloudinaryService.destroyImage(image.public_id),
          ),
        );
      }
    }

    const updatedHotel = await this.hotelModel.findByIdAndUpdate(
      id,
      {
        ...updateHotelDto,
        images: formattedImages,
        updatedBy: payload._id,
      },
      { new: true },
    ).lean();

    return {
      message: 'Hotel updated successfully',
      hotel: updatedHotel,
    };
  }

  public async deletehotel(id: string) {
    const isExistHotel = await this.hotelModel.findById(id);
    if (!isExistHotel) {
      throw new NotFoundException('This Hotel does not exist');
    }

    if (!isExistHotel.createdBy) {
      throw new ForbiddenException("Hotel doesn't have a creator.");
    }

    if (isExistHotel.images?.length) {
      await Promise.all(
        isExistHotel.images.map(async (image: any) => {
          if (image.public_id) {
            await this.cloudinaryService.destroyImage(image.public_id);
          }
        }),
      );
    }

    await this.hotelModel.findByIdAndDelete(id);
    return { message: 'Hotel deleted successfully' };
  }

  public async gethotel(id: string) {
    const hotel = await this.hotelModel
      .findById(id)
      .populate('staffIds', 'name email role')
      .populate('managerId', 'name -_id')
      .lean()
    if (!hotel) {
      throw new NotFoundException(`Hotel not found for ID: ${id}`);
    }

    return hotel;
  }

  async getHotels(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const totalHotels = await this.hotelModel.countDocuments();

    const hotels = await this.hotelModel
      .find()
      .select('-createdAt -updatedAt -__v -_id')
      .populate('managerId', 'name email -_id')
      .skip(skip)
      .limit(limit);

    return {
      data: hotels,
      totalHotels,
      currentPage: page,
      pageSize: limit,
    };
  }
}
