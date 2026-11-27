import type { Request, Response } from "express";
import { sendSuccess } from "../utils/response.js";
import { validate } from "../utils/validate.js";
import { idParamSchema } from "../schemas/common.schema.js";
import {
  createHotelSchema,
  hotelStatusSchema,
  listHotelsQuerySchema,
  updateHotelSchema,
} from "../schemas/hotel.schema.js";
import * as hotelService from "../services/hotel.service.js";

export async function listHotels(req: Request, res: Response) {
  const query = validate(listHotelsQuerySchema, req.query);
  const { items, meta } = await hotelService.listHotels(query);
  sendSuccess(res, items, "OK", 200, meta);
}

export async function getHotel(req: Request, res: Response) {
  const { id } = validate(idParamSchema, req.params);
  const hotel = await hotelService.getHotel(id);
  sendSuccess(res, hotel);
}

export async function createHotel(req: Request, res: Response) {
  const input = validate(createHotelSchema, req.body);
  const hotel = await hotelService.createHotel(input);
  sendSuccess(res, hotel, "Hotel created", 201);
}

export async function updateHotel(req: Request, res: Response) {
  const { id } = validate(idParamSchema, req.params);
  const input = validate(updateHotelSchema, req.body);
  const hotel = await hotelService.updateHotel(req.user!, id, input);
  sendSuccess(res, hotel, "Hotel updated");
}

export async function setHotelStatus(req: Request, res: Response) {
  const { id } = validate(idParamSchema, req.params);
  const { isActive } = validate(hotelStatusSchema, req.body);
  const hotel = await hotelService.setHotelStatus(id, isActive);
  sendSuccess(res, hotel, isActive ? "Hotel activated" : "Hotel deactivated");
}
