import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Get all users (for matchmaking)" })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get("leaderboard")
  @ApiOperation({ summary: "Get leaderboard" })
  async getLeaderboard() {
    return this.usersService.getLeaderboard();
  }
}
