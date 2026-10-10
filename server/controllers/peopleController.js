import tmdbService from '../services/tmdbService.js';
import { parseSafePage } from './movieController.js';

// 1. Search People / Actors
export const searchPeople = async (req, res, next) => {
  try {
    const query = req.query.query || '';
    const page = parseSafePage(req.query.page);
    const data = await tmdbService.searchPeople(query, page);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Movies by Person / Actor ID
export const getPersonMovies = async (req, res, next) => {
  try {
    const personId = parseInt(req.params.id);
    if (!personId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid person/actor ID provided',
      });
    }
    const page = parseSafePage(req.query.page);
    const data = await tmdbService.getPersonMovies(personId, page);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  searchPeople,
  getPersonMovies,
};
