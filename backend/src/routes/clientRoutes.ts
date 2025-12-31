import { Router } from 'express';
import { createClient, getClients, updateClientAllocations, getClientBonus, updateClientRevenue, processClientPayout, createClientOverride } from '../controllers/clientController';

const router = Router();

router.post('/', createClient);
router.get('/', getClients);
router.put('/:id/allocations', updateClientAllocations);
router.put('/:id/revenue', updateClientRevenue);
router.get('/:id/bonus', getClientBonus);
router.post('/:id/payout', processClientPayout);
router.post('/:id/overrides', createClientOverride);

export default router;
