import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as reservationService from "../services/reservation.service"

export async function getReservations(req: AuthRequest, res: Response) {
  const date = req.query.date as string | undefined
  const reservations = await reservationService.getReservations(date)
  res.json(reservations)
}

export async function createReservation(req: AuthRequest, res: Response) {
  try {
    const reservation = await reservationService.createReservation({
      ...req.body,
      createdBy: req.user!.userId,
    })
    res.status(201).json(reservation)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function updateReservation(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const reservation = await reservationService.updateReservation(id, req.body)
    res.json(reservation)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function updateReservationStatus(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    const reservation = await reservationService.updateReservationStatus(id, req.body.status)
    res.json(reservation)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function deleteReservation(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string
    await reservationService.deleteReservation(id)
    res.json({ message: "Reservation deleted." })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function getTodayReservations(req: AuthRequest, res: Response) {
  const reservations = await reservationService.getTodayReservations()
  res.json(reservations)
}