import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createPerson = async (req: Request, res: Response) => {
  try {
    const { name, email, role, defaultBonusWeight } = req.body;

    if (!name || !email || !role) {
      res.status(400).json({ error: 'Name, email, and role are required' });
      return;
    }

    const person = await prisma.person.create({
      data: {
        name,
        email,
        role,
        defaultBonusWeight: defaultBonusWeight ? parseFloat(defaultBonusWeight) : null,
      },
    });

    res.status(201).json(person);
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ error: 'Failed to create person' });
  }
};

export const getPeople = async (req: Request, res: Response) => {
  try {
    const people = await prisma.person.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    res.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({ error: 'Failed to fetch people' });
  }
};
