/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// matches.service.spec.ts — Tests para MatchesService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { MatchesService } from "./matches.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

describe("MatchesService", () => {
  let service: MatchesService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      $queryRawUnsafe: jest.fn(),
      matches: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      match_participants: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("debe buscar partidos sin deporte", async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValue([]);
      const res = await service.findAll();
      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("SELECT id, title, sport"),
      );
      expect(res).toEqual([]);
    });

    it("debe buscar partidos filtrando por deporte", async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValue([]);
      await service.findAll("futbol");
      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("WHERE sport = $1"),
        ["futbol"],
      );
    });

    it("debe lanzar el error si $queryRawUnsafe falla", async () => {
      prismaMock.$queryRawUnsafe.mockRejectedValue(new Error("fail"));
      await expect(service.findAll()).rejects.toThrow("fail");
    });
  });

  describe("findOne", () => {
    it("debe devolver el partido si existe", async () => {
      prismaMock.matches.findUnique.mockResolvedValue({ id: "m1" });
      const res = await service.findOne("m1");
      expect(res).toEqual({ id: "m1" });
    });

    it("debe lanzar NotFoundException si no existe", async () => {
      prismaMock.matches.findUnique.mockResolvedValue(null);
      await expect(service.findOne("m2")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("debe crear el partido con creator_id y status OPEN", async () => {
      const dto = { title: "Partido", sport: "tenis" } as any;
      prismaMock.matches.create.mockResolvedValue({ id: "m1", ...dto });

      const res = await service.create(dto, "u1");
      expect(prismaMock.matches.create).toHaveBeenCalledWith({
        data: {
          title: "Partido",
          sport: "tenis",
          creator_id: "u1",
          status: "OPEN",
        },
      });
      expect(res).toEqual({ id: "m1", ...dto });
    });

    it("debe lanzar error si prisma.create falla", async () => {
      prismaMock.matches.create.mockRejectedValue(new Error("create-fail"));
      await expect(service.create({} as any, "u1")).rejects.toThrow("create-fail");
    });
  });

  describe("update", () => {
    it("debe lanzar NotFoundException si no existe", async () => {
      prismaMock.matches.findUnique.mockResolvedValue(null);
      await expect(service.update("m1", {}, "u1")).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ForbiddenException si no es el creador", async () => {
      prismaMock.matches.findUnique.mockResolvedValue({ id: "m1", creator_id: "u2" });
      await expect(service.update("m1", {}, "u1")).rejects.toThrow(ForbiddenException);
    });

    it("debe actualizar si es el creador", async () => {
      prismaMock.matches.findUnique.mockResolvedValue({ id: "m1", creator_id: "u1" });
      prismaMock.matches.update.mockResolvedValue({ id: "m1", title: "Nuevo" });

      const res = await service.update("m1", { title: "Nuevo" }, "u1");
      expect(res.title).toBe("Nuevo");
    });
  });

  describe("delete", () => {
    it("debe lanzar NotFoundException si no existe", async () => {
      prismaMock.matches.findUnique.mockResolvedValue(null);
      await expect(service.delete("m1", "u1")).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ForbiddenException si no es el creador", async () => {
      prismaMock.matches.findUnique.mockResolvedValue({ id: "m1", creator_id: "u2" });
      await expect(service.delete("m1", "u1")).rejects.toThrow(ForbiddenException);
    });

    it("debe eliminar si es el creador", async () => {
      prismaMock.matches.findUnique.mockResolvedValue({ id: "m1", creator_id: "u1" });
      prismaMock.matches.delete.mockResolvedValue({ id: "m1" });

      const res = await service.delete("m1", "u1");
      expect(res).toEqual({ id: "m1" });
    });
  });

  describe("join", () => {
    it("debe lanzar NotFoundException si el partido no existe", async () => {
      prismaMock.matches.findUnique.mockResolvedValue(null);
      await expect(service.join("m1", "u1")).rejects.toThrow(NotFoundException);
    });

    it("debe agregar participante", async () => {
      prismaMock.matches.findUnique.mockResolvedValue({ id: "m1" });
      prismaMock.match_participants.create.mockResolvedValue({ match_id: "m1", user_id: "u1" });

      const res = await service.join("m1", "u1");
      expect(prismaMock.match_participants.create).toHaveBeenCalledWith({
        data: {
          match_id: "m1",
          user_id: "u1",
          status: "CONFIRMED",
        },
      });
      expect(res).toEqual({ match_id: "m1", user_id: "u1" });
    });
  });

  describe("leave", () => {
    it("debe lanzar NotFoundException si el partido no existe", async () => {
      prismaMock.matches.findUnique.mockResolvedValue(null);
      await expect(service.leave("m1", "u1")).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ForbiddenException si el que sale es el creador", async () => {
      prismaMock.matches.findUnique.mockResolvedValue({ id: "m1", creator_id: "u1" });
      await expect(service.leave("m1", "u1")).rejects.toThrow(ForbiddenException);
    });

    it("debe eliminar el participante si no es el creador", async () => {
      prismaMock.matches.findUnique.mockResolvedValue({ id: "m1", creator_id: "u2" });
      prismaMock.match_participants.deleteMany.mockResolvedValue({ count: 1 });

      const res = await service.leave("m1", "u1");
      expect(prismaMock.match_participants.deleteMany).toHaveBeenCalledWith({
        where: {
          match_id: "m1",
          user_id: "u1",
        },
      });
      expect(res).toEqual({ count: 1 });
    });
  });
});
