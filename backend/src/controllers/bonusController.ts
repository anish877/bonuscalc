import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { calculateBonusForClient } from '../services/bonusCalculator';

export const getAllBonusCalculations = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      select: { id: true } // Only need IDs to iterate
    });

    const calculations = await Promise.all(
      clients.map(client => calculateBonusForClient(client.id))
    );

    // Filter out errors or handle them? calculateBonusForClient throws if not found/settings missing.
    // Ideally we catch inside map or ensure it works. 
    // calculateBonusForClient handles logic, but throws if settings missing.
    // If settings missing, it will fail for all.
    
    res.json(calculations);
  } catch (error) {
    console.error('Error calculating bonuses:', error);
    res.status(500).json({ error: 'Failed to calculate bonuses' });
  }
};

export const getBonusHistory = async (req: Request, res: Response) => {
  try {
    const history = await prisma.bonusHistoryRecord.findMany({
      include: {
        client: true,
        person: true
      },
      orderBy: {
        period: 'desc'
      }
    });

    const formattedHistory = history.map(h => ({
      ...h,
      clientName: h.client.name,
      personName: h.person.name
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching bonus history:', error);
    res.status(500).json({ error: 'Failed to fetch bonus history' });
  }
};
