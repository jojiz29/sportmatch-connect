import { Controller, Get, Post, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { BookingsService } from "./bookings.service";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";

@ApiTags("Bookings")
@Controller("bookings")
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: "Get bookings by court and date" })
  async getByCourtAndDate(@Query("courtId") courtId: string, @Query("date") date: string) {
    return this.bookingsService.getByCourtAndDate(courtId, date);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create booking" })
  async create(
    @Body()
    data: {
      court_id: string;
      date: string;
      time: string;
      user_id: string;
      precio_cancha?: number;
      porcentaje_comision?: number;
      monto_comision?: number;
      total_cobrado?: number;
    },
  ) {
    return this.bookingsService.create(data);
  }
}
