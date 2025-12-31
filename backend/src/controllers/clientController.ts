import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { calculateBonusForClient } from '../services/bonusCalculator';

export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, onboardingDate } = req.body;

    if (!name || !onboardingDate) {
      res.status(400).json({ error: 'Name and onboarding date are required' });
      return;
    }

    const client = await prisma.client.create({
      data: {
        name,
        onboardingDate: new Date(onboardingDate),
        status: 'Active', // Default to Active
      },
      include: {
        monthlyRevenue: true,
      },
    });

    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        monthlyRevenue: true,
        teamAllocations: true,
        overrides: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

export const createClientOverride = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { personId, originalAmount, overrideAmount, reason, approvedBy } = req.body;

    const override = await prisma.override.create({
      data: {
        clientId: id,
        personId,
        originalAmount: Number(originalAmount),
        overrideAmount: Number(overrideAmount),
        reason,
        approvedBy,
        approvalDate: new Date(),
      }
    });

    res.status(201).json(override);
  } catch (error) {
    console.error('Error creating override:', error);
    res.status(500).json({ error: 'Failed to create override' });
  }
};

export const updateClientAllocations = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { allocations } = req.body; // Expecting [{ personId, weight }, ...]

    if (!Array.isArray(allocations)) {
      res.status(400).json({ error: 'Allocations must be an array' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing allocations for this client
      await tx.teamAllocation.deleteMany({
        where: { clientId: id }
      });

      // 2. Create new allocations
      if (allocations.length > 0) {
        await tx.teamAllocation.createMany({
          data: allocations.map((alloc: { personId: string; weight: number | string }) => ({
            clientId: id,
            personId: alloc.personId,
            weight: Number(alloc.weight)
          }))
        });
      }
      
      // 3. Return updated client with allocations
      return tx.client.findUnique({
        where: { id },
        include: {
          monthlyRevenue: true,
          teamAllocations: true
        }
      });
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating allocations:', error);
    res.status(500).json({ error: 'Failed to update allocations' });
  }
};

export const updateClientRevenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { revenue } = req.body; // Expecting [{ month: string, collected: number, isEligible: boolean }, ...]

    if (!Array.isArray(revenue)) {
      res.status(400).json({ error: 'Revenue must be an array' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing revenue for this client
      await tx.monthlyRevenue.deleteMany({
        where: { clientId: id }
      });

      // 2. Create new revenue records
      if (revenue.length > 0) {
        await tx.monthlyRevenue.createMany({
          data: revenue.map((rev: { month: string; collected: number | string; isEligible?: boolean }) => ({
            clientId: id,
            month: rev.month,
            collected: Number(rev.collected),
            isEligible: rev.isEligible ?? true
          }))
        });
      }
      
      // 3. Return updated client
      return tx.client.findUnique({
        where: { id },
        include: {
          monthlyRevenue: true,
          teamAllocations: true
        }
      });
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating revenue:', error);
    res.status(500).json({ error: 'Failed to update revenue' });
  }
};

export const getClientBonus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await calculateBonusForClient(id);
    res.json(result);
  } catch (error) {
    console.error('Error calculating bonus:', error);
    res.status(500).json({ error: 'Failed to calculate bonus' });
  }
};

export const processClientPayout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period } = req.body; // Expecting 'YYYY-MM'

    if (!period) {
      res.status(400).json({ error: 'Payout period (YYYY-MM) is required' });
      return;
    }

    // 1. Calculate current bonus state
    const calculation = await calculateBonusForClient(id);
    
    if (!calculation.isEligible) {
      res.status(400).json({ error: 'Client is not eligible for bonus' });
      return;
    }

    // 2. Create History Records
    // Calculate total payout from allocations (including overrides)
    const totalPayout = calculation.allocations.reduce((sum, a) => sum + a.bonusAmount, 0);

    await prisma.$transaction(async (tx) => {
      const records = calculation.allocations.map(alloc => ({
        period,
        clientId: id,
        personId: alloc.personId,
        weight: alloc.weight,
        bonusAmount: alloc.bonusAmount,
        totalClientBonus: totalPayout, // Use the actual sum of bonuses paid
        averageMonthlyRevenue: calculation.averageMonthlyRevenue,
        appliedBonusPercentage: calculation.bonusPercentage,
        calculatedAt: new Date()
      }));

      if (records.length > 0) {
        await tx.bonusHistoryRecord.createMany({
          data: records
        });
      }
    });

    res.json({ message: 'Payout processed successfully', period, totalAmount: totalPayout });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({ error: 'Failed to process payout' });
  }
};
