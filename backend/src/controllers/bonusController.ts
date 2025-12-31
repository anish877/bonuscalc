import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { calculateBonusForClientData } from '../services/bonusCalculator';

export const getAllBonusCalculations = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.settings.findFirst({
      include: {
        bonusSlabs: true
      }
    });

    if (!settings) {
      res.status(500).json({ error: 'Settings not configured' });
      return;
    }

    const clients = await prisma.client.findMany({
      include: {
        monthlyRevenue: true,
        teamAllocations: {
          include: {
            person: true
          }
        },
        overrides: true
      }
    });

    const calculations = clients.map(client => calculateBonusForClientData(client, settings));
    
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
