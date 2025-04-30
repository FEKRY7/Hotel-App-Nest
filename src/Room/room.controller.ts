import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RolesStaff } from 'src/Users/decorators/user-role.decorator';
import { CurrentUser } from 'src/Users/decorators/current-user.decorator';
import { JWTStaffType } from 'src/untils/types';
import { RoomService } from './room.service';
import { AuthStaffGuard } from 'src/guards/auth.staff.guard';
import { RoleTowType } from 'src/untils/enums';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { RoomToolsDto } from './dtos/room-tools.dto';

@Controller('/api/room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // [Owner Routers]

  // GET: /api/room/owner/all
  @Get('/owner/all')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async GetRooms(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.roomService.getrooms(page, limit, status);
  }

  // GET: /api/room/owner/:roomId
  @Get('/owner/:roomId')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public async GetRoomById(@Param('roomId') roomId: string) {
    return this.roomService.getRoomById(roomId);
  }

  // POST: /api/room/owner/create/:hotelId
  @Post('owner/create/:hotelId')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'roomImages', maxCount: 3 }]),
  )
  public async createRoom(
    @Param('hotelId') hotelId: string,
    @Body() createRoomDto: CreateRoomDto,
    @CurrentUser() staffPelod: JWTStaffType,
    @UploadedFiles()
    files: {
      roomImages?: Express.Multer.File[];
    },
  ) {
    return this.roomService.createRoom(
      hotelId,
      createRoomDto,
      staffPelod,
      files?.roomImages ?? [],
    );
  }
   
  // PUT: /api/room/owner/:id
  @Put('owner/:hotelId/:id')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'roomImages', maxCount: 3 }]),
  )
  public async UpdateRoom(
    @Param('id') id: string,
    @Param('hotelId') hotelId: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @CurrentUser() staffPelod: JWTStaffType,
    @UploadedFiles()
    files: {
      roomImages: Express.Multer.File[];
    },
  ) {
    return this.roomService.updateRoom(
      id,
      hotelId,
      updateRoomDto,
      staffPelod,
      files.roomImages || [],
    );
  }

  // DELETE: /api/room/owner/:id
  @Delete('owner/:id')
  @RolesStaff(RoleTowType.OWNER)
  @UseGuards(AuthStaffGuard)
  public DeleteRoom(@Param('id') id: string) {
    return this.roomService.deleteRoom(id);
  }

  // [Manager Routers]

  // GET: /api/room/manager/all
  @Get('manager/all')
  @RolesStaff(RoleTowType.MANAGER)
  @UseGuards(AuthStaffGuard)
  public async getRoomsByManagerId(
    @CurrentUser() staffPelod: JWTStaffType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.roomService.getRoomsByManagerId(staffPelod, page, limit);
  }

  // GET: /api/room/manager/status
  @Get('manager/status')
  @RolesStaff(RoleTowType.MANAGER)
  @UseGuards(AuthStaffGuard)
  public async GetRoomsByStatus(
    @CurrentUser() staffPelod: JWTStaffType,
    @Query('reservationStatus') reservationStatus: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.roomService.getRoomsByStatus(
      staffPelod,
      reservationStatus,
      page,
      limit,
    );
  }

  // GET: /api/room/manager/:id
  @Get('manager/:id') 
  @RolesStaff(RoleTowType.MANAGER)
  @UseGuards(AuthStaffGuard)
  public async GetRoomByManagerId(
    @Param('id') id: string,
    @CurrentUser() staffPelod: JWTStaffType,
  ) {
    return await this.roomService.getRoomByManagerId(staffPelod, id);
  }

  // POST: /api/room/manager/create
  @Post('manager/create')
  @RolesStaff(RoleTowType.MANAGER)
  @UseGuards(AuthStaffGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'roomImages', maxCount: 3 }]))
  public async createRoomByManagerId(
    @CurrentUser() staffPelod: JWTStaffType,
    @Body() createRoomDto: CreateRoomDto,
    @UploadedFiles()
    files: {
      roomImages?: Express.Multer.File[];
    },
  ) {
    return this.roomService.createRoomByManagerId(
      staffPelod,
      createRoomDto,
      files.roomImages || [],
    );
  }

  // PUT: /api/room/manager/:id
  @Put('manager/:id')
  @RolesStaff(RoleTowType.MANAGER)
  @UseGuards(AuthStaffGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'roomImages', maxCount: 3 }]),
  )
  public async UpdateRoomByManagerId(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @CurrentUser() staffPelod: JWTStaffType,
    @UploadedFiles()
    files: {
      roomImages: Express.Multer.File[];
    },
  ) {
    return this.roomService.updateRoomByManagerId(
      id,
      updateRoomDto,
      staffPelod,
      files.roomImages || [],
    );
  }

  // DELETE: /api/room/manager/:id
  @Delete('manager/:id')
  @RolesStaff(RoleTowType.MANAGER)
  @UseGuards(AuthStaffGuard)
  public DeleteRoomByManagerId(
    @Param('id') id: string,
    @CurrentUser() staffPelod: JWTStaffType,
  ) {
    return this.roomService.deleteRoomByManagerId(staffPelod, id);
  }

  // [Receptionist Routers]

  // PUT: /api/room/receptionist/:id
  @Put('receptionist/:id')
  @RolesStaff(RoleTowType.RECEPTIONIST)
  @UseGuards(AuthStaffGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'roomImages', maxCount: 3 }]),
  )
  public async UpdateRoomByReceptionistId(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @CurrentUser() staffPelod: JWTStaffType,
    @UploadedFiles()
    files: {
      roomImages: Express.Multer.File[];
    },
  ) {
    return this.roomService.updateRoomByReceptionistId(
      id,
      updateRoomDto,
      staffPelod,
      files.roomImages || [],
    );
  }

  // PUT: /api/room/receptionist/:id/status
  @Put('receptionist/:id/status')
  @RolesStaff(RoleTowType.RECEPTIONIST)
  @UseGuards(AuthStaffGuard)
  public ChangeRoomStatus(
    @Param('id') id: string,
    @Body() roomToolsDto: RoomToolsDto,
    @CurrentUser() staffPelod: JWTStaffType,
  ) {
    return this.roomService.changeRoomStatus(id, roomToolsDto, staffPelod);
  }

  // PUT: /api/room/receptionist/:id/description
  @Put('receptionist/:id/description')
  @RolesStaff(RoleTowType.RECEPTIONIST)
  @UseGuards(AuthStaffGuard)
  public UpdateRoomDescription(
    @Param('id') id: string,
    @Body() roomToolsDto: RoomToolsDto,
    @CurrentUser() staffPelod: JWTStaffType,
  ) {
    return this.roomService.updateRoomDescription(id, roomToolsDto, staffPelod);
  }

  // PUT: /api/room/receptionist/:id/discount
  @Put('receptionist/:id/discount')
  @RolesStaff(RoleTowType.RECEPTIONIST)
  @UseGuards(AuthStaffGuard)
  public UpdateRoomDiscount(
    @Param('id') id: string,
    @Body() roomToolsDto: RoomToolsDto,
    @CurrentUser() staffPelod: JWTStaffType,
  ) {
    return this.roomService.updateRoomDiscount(id, roomToolsDto, staffPelod);
  }

  // PUT: /api/room/receptionist/:id/amenities
  @Put('receptionist/:id/amenities')
  @RolesStaff(RoleTowType.RECEPTIONIST)
  @UseGuards(AuthStaffGuard)
  public UpdateRoomAmenities(
    @Param('id') id: string,
    @Body() roomToolsDto: RoomToolsDto,
    @CurrentUser() staffPelod: JWTStaffType,
  ) {
    return this.roomService.updateRoomAmenities(id, roomToolsDto, staffPelod);
  }

  // [Cleaner Routers]

  // PUT: /api/room/cleaner/:id/availability
  @Put('cleaner/:id/availability')
  @RolesStaff(RoleTowType.CLEANER)
  @UseGuards(AuthStaffGuard)
  public ChangeRoomAvailability(
    @Param('id') id: string,
    @CurrentUser() staffPelod: JWTStaffType,
  ) {
    return this.roomService.changeRoomAvailability(id, staffPelod);
  }

  // GET: /api/room/cleaner/without-availability
  @Get('cleaner/without-availability')
  @RolesStaff(RoleTowType.CLEANER)
  @UseGuards(AuthStaffGuard)
  public GetRoomsWithoutAvailability(@CurrentUser() staffPelod: JWTStaffType) {
    return this.roomService.getRoomsWithoutAvailability(staffPelod);
  }

  // [Customer Routers]

  // PUT: /api/room/customer/:id
  @Put('customer/:id')
  @RolesStaff(RoleTowType.CLEANER)
  @UseGuards(AuthStaffGuard)
  public CheckoutFromRoom(
    @Param('id') id: string,
    @Body() roomToolsDto: RoomToolsDto,
  ) {
    return this.roomService.checkoutFromRoom(id, roomToolsDto);
  }
}
