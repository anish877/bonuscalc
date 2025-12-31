import { Router } from 'express';
import { createPerson, getPeople } from '../controllers/personController';

const router = Router();

router.post('/', createPerson);
router.get('/', getPeople);

export default router;
