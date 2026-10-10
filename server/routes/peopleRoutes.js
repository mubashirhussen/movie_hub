import express from 'express';
import { searchPeople, getPersonMovies } from '../controllers/peopleController.js';

const router = express.Router();

router.get('/search', searchPeople);
router.get('/:id/movies', getPersonMovies);

export default router;
