import { useMovieContext } from '../context/MovieContext';

export const useMovies = () => {
  return useMovieContext();
};

export default useMovies;
