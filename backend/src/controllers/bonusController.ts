import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { calculateBonusForClientData, finalizeBonusForPeriod, HalfYear } from '../services/bonusCalculator';
import { getYear, getMonth } from 'date-fns';

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

    // Parse Query Params or Default to Current
    const now = new Date();
    const queryYear = req.query.year ? parseInt(req.query.year as string) : getYear(now);
    const queryHalfYear = (req.query.halfYear as HalfYear) || (getMonth(now) < 6 ? 'H1' : 'H2');

    const calculations = clients.map(client => 
      calculateBonusForClientData(client, settings, queryYear, queryHalfYear)
    );
    
    res.json(calculations);
  } catch (error) {
    console.error('Error calculating bonuses:', error);
    res.status(500).json({ error: 'Failed to calculate bonuses' });
  }
};

export const finalizeBonus = async (req: Request, res: Response) => {
  const { clientId, year, halfYear } = req.body;
  try {
    const result = await finalizeBonusForPeriod(clientId, year, halfYear);
    res.json(result);
  } catch (error) {
    console.error('Error finalizing bonus:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
};

export const getHalfYearBonusHistory = async (req: Request, res: Response) => {
  try {
    const history = await prisma.halfYearBonus.findMany({
      include: {
        client: true,
        payouts: {
            orderBy: { payoutPeriod: 'asc' }
        }
      },
      orderBy: {
        period: 'desc'
      }
    });
    res.json(history);
  } catch (error) {
    console.error('Error fetching bonus history:', error);
    res.status(500).json({ error: 'Failed to fetch bonus history' });
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
