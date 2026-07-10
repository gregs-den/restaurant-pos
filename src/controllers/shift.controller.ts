import { Response } from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import * as shiftService from "../services/shift.service"

export async function getCurrentShift(req: AuthRequest, res: Response) {
  const shift = await shiftService.getCurrentShift()
  res.json(shift)
}

export async function openShift(req: AuthRequest, res: Response) {
  try {
    const { startingCash, notes } = req.body
    if (startingCash === undefined || startingCash < 0) {
      return res.status(400).json({ error: "Enter a valid starting cash amount." })
    }
    const shift = await shiftService.openShift({
      startingCash, notes, openedBy: req.user!.userId,
    })
    res.status(201).json(shift)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function closeShift(req: AuthRequest, res: Response) {
  try {
    const shiftId = req.params.id as string
    const { endingCashCounted, notes } = req.body
    if (endingCashCounted === undefined || endingCashCounted < 0) {
      return res.status(400).json({ error: "Enter a valid cash count." })
    }
    const shift = await shiftService.closeShift(shiftId, {
      endingCashCounted, notes, closedBy: req.user!.userId,
    })
    res.json(shift)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function getShiftSummary(req: AuthRequest, res: Response) {
  try {
    const shiftId = req.params.id as string
    const summary = await shiftService.getShiftSummary(shiftId)
    res.json(summary)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function getShiftHistory(req: AuthRequest, res: Response) {
  const { from, to } = req.query
  const shifts = await shiftService.getShiftHistory({ from: from as string, to: to as string })
  res.json(shifts)
}