// ============================================================
// current-user.decorator.ts — Decorador de parámetro para obtener el usuario autenticado
// Uso: @CurrentUser() user o @CurrentUser("email") email
// ============================================================

import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
