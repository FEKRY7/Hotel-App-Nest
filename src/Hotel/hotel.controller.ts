import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RolesStaff } from 'src/Users/decorators/user-role.decorator';
import { CurrentUser } from 'src/Users/decorators/current-user.decorator';
import { JWTPayloadType } from 'src/untils/types';
import { HotelService } from './hotel.service';
import { HotelDto } from './dtos/create-hotel.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RoleTowType } from 'src/untils/enums';
import { AuthStaffGuard } from 'src/guards/auth.staff.guard';
import { UpdateHotelDto } from './dtos/update-hotel.dto';

@Controller('/api/hotel')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  // POST: /api/hotel/owner/create
  @Post('owner/create')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 4 }]))
  public async AddHotel(
    @Body() hotelDto: HotelDto,
    @CurrentUser() payload: JWTPayloadType,
    @UploadedFiles()
    files: {
      images: Express.Multer.File[];
    },
  ) {
    return this.hotelService.addHotel(
      hotelDto, 
     payload, 
      files.images || []
    );
  }

  // PUT: /api/hotel/owner/:id
  @Put('owner/:id')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 4 }]))
  public async UpdateHotel(
    @Param('id') id: string,
    @Body() updateHotelDto: UpdateHotelDto,
    @CurrentUser() payload: JWTPayloadType,
    @UploadedFiles()
    files: {
      images: Express.Multer.File[];
    },
  ) {
    return this.hotelService.updateHotel(
      id,
      updateHotelDto,
      payload,
      files.images || [],
    );
  }
 
  // DELETE: /api/hotel/owner/:id
  @Delete('owner/:id')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public DeleteHotel(
    @Param('id') id: string,
   ) {
    return this.hotelService.deletehotel(id);
  }

  // GET: /api/hotel/owner/:id
  @Get('owner/:id')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public GetHotel(@Param('id') id: string) {
    return this.hotelService.gethotel(id);
  }

  // GET: /api/hotel/owner
  @Get('/owner')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async GetHotels(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;

    return await this.hotelService.getHotels(pageNumber, limitNumber);
  }
}
