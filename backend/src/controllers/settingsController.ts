import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.settings.findFirst({
      include: {
        bonusSlabs: true,
      },
    });

    if (!settings) {
      // Create default settings if not found
      settings = await prisma.settings.create({
        data: {
          companyExpensePercentage: 40,
          bonusPoolMinPercentage: 10,
          bonusPoolMaxPercentage: 20,
          payoutFrequency: "Quarterly",
          minEligibilityMonths: 3,
          bonusSlabs: {
            create: [
              { minRevenue: 0, maxRevenue: 5000, bonusPercentage: 20 },
              { minRevenue: 5001, maxRevenue: null, bonusPercentage: 10 },
            ],
          },
        },
        include: {
          bonusSlabs: true,
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const {
      companyExpensePercentage,
      bonusPoolMinPercentage,
      bonusPoolMaxPercentage,
      payoutFrequency,
      minEligibilityMonths,
      bonusSlabs,
    } = req.body;

    // Find the existing settings to get the ID
    const existingSettings = await prisma.settings.findFirst();

    if (!existingSettings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    // Update settings and replace slabs
    const updatedSettings = await prisma.$transaction(async (tx) => {
      // Delete existing slabs
      await tx.bonusSlab.deleteMany({
        where: { settingsId: existingSettings.id },
      });

      // Update settings and create new slabs
      return tx.settings.update({
        where: { id: existingSettings.id },
        data: {
          companyExpensePercentage,
          bonusPoolMinPercentage,
          bonusPoolMaxPercentage,
          payoutFrequency,
          minEligibilityMonths,
          bonusSlabs: {
            create: bonusSlabs.map((slab: any) => ({
              minRevenue: slab.minRevenue,
              maxRevenue: slab.maxRevenue,
              bonusPercentage: slab.bonusPercentage,
            })),
          },
        },
        include: {
          bonusSlabs: true,
        },
      });
    });

    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
