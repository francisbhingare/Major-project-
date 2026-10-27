import { movies } from '@/data/movies';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Cache structure for fetching TMDB data
const cache = new Map();

async function fetchFromTMDB(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params
  }).toString();
  
  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams}`;
  
  if (cache.has(url)) {
    return cache.get(url);
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        // Rate limiting: wait 1 second and retry once
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryRes = await fetch(url);
        if (retryRes.ok) {
          const data = await retryRes.json();
          cache.set(url, data);
          return data;
        }
      }
      throw new Error(`TMDB error status: ${res.status}`);
    }
    const data = await res.json();
    cache.set(url, data);
    return data;
  } catch (error) {
    console.error(`TMDB fetch failed for ${endpoint}:`, error);
    throw error;
  }
}

// Convert dynamic TMDB movie model to our standard website structure
function transformTMDBMovie(m) {
  const queryTitle = encodeURIComponent(m.title);
  return {
    id: m.id,
    title: m.title,
    genre: getGenreName(m.genre_ids ? m.genre_ids[0] : null),
    director: 'Various', // fetched inside credits details
    keywords: [],
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
    backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : 'https://via.placeholder.com/1280x720?text=No+Backdrop',
    description: m.overview || 'No description available.',
    releaseYear: m.release_date ? new Date(m.release_date).getFullYear() : 'N/A',
    releaseDate: m.release_date || 'N/A',
    rating: m.vote_average ? parseFloat(m.vote_average.toFixed(1)) : 0,
    runtime: m.runtime || 120,
    trailerUrl: `https://www.youtube.com/embed?listType=search&list=${queryTitle}+official+trailer`,
    watchUrl: `https://play.google.com/store/search?q=${queryTitle}&c=movies`,
    watchLinks: [
      { platform: 'Netflix', url: `https://www.netflix.com/search?q=${queryTitle}` },
      { platform: 'Amazon Prime', url: `https://www.amazon.com/s?k=${queryTitle}+movie` },
      { platform: 'Google Play', url: `https://play.google.com/store/search?q=${queryTitle}&c=movies` }
    ],
    imdbId: m.imdb_id || '',
    tmdbUrl: `https://www.themoviedb.org/movie/${m.id}`
  };
}

// Map TMDB genre IDs to our standard genres list
function getGenreName(id) {
  const genreMapping = {
    28: 'Action', 12: 'Action', 16: 'Animation', 35: 'Comedy',
    80: 'Thriller', 99: 'Drama', 18: 'Drama', 10751: 'Animation',
    14: 'Sci-Fi', 36: 'Drama', 27: 'Horror', 10402: 'Drama',
    9648: 'Thriller', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'Drama', 53: 'Thriller', 10752: 'Drama', 37: 'Action'
  };
  return genreMapping[id] || 'Drama';
}

// High-Fidelity Local Mock Service Fallback Data
const mockCastList = [
  { name: 'Leonardo DiCaprio', character: 'Dom Cobb' },
  { name: 'Matthew McConaughey', character: 'Cooper' },
  { name: 'Keanu Reeves', character: 'Neo' },
  { name: 'Christian Bale', character: 'Bruce Wayne' },
  { name: 'Robert Downey Jr.', character: 'Tony Stark' },
  { name: 'Scarlett Johansson', character: 'Black Widow' },
  { name: 'Brad Pitt', character: 'Tyler Durden' },
  { name: 'Morgan Freeman', character: 'Ellis Boyd Redding' },
  { name: 'Al Pacino', character: 'Michael Corleone' },
  { name: 'Robin Williams', character: 'Sean Maguire' }
];

export async function getPopularMovies() {
  if (TMDB_API_KEY) {
    try {
      const data = await fetchFromTMDB('/movie/popular');
      return data.results.map(transformTMDBMovie);
    } catch (e) {
      console.warn("Falling back to local popular movies");
    }
  }
  return movies.slice(0, 15).map(m => ({
    ...m,
    releaseYear: 2010 + (m.id % 14),
    rating: (7.5 + (m.id % 2.5)).toFixed(1),
    runtime: 100 + (m.id * 3) % 60,
    backdrop: m.poster.replace('/w500', '/w1280') // mock backdrop url
  }));
}

export async function getTopRatedMovies() {
  if (TMDB_API_KEY) {
    try {
      const data = await fetchFromTMDB('/movie/top_rated');
      return data.results.map(transformTMDBMovie);
    } catch (e) {
      console.warn("Falling back to local top rated movies");
    }
  }
  return [...movies].sort((a, b) => b.id - a.id).slice(0, 15).map(m => ({
    ...m,
    releaseYear: 1999 + (m.id % 25),
    rating: (8.2 + (m.id % 1.5)).toFixed(1),
    runtime: 110 + (m.id * 2) % 60,
    backdrop: m.poster.replace('/w500', '/w1280')
  }));
}

export async function getUpcomingMovies() {
  if (TMDB_API_KEY) {
    try {
      const data = await fetchFromTMDB('/movie/upcoming');
      return data.results.map(transformTMDBMovie);
    } catch (e) {
      console.warn("Falling back to local upcoming movies");
    }
  }
  return movies.filter(m => m.id % 3 === 0).slice(0, 10).map(m => ({
    ...m,
    releaseYear: 2026,
    rating: 'TBD',
    runtime: 95 + (m.id * 4) % 60,
    backdrop: m.poster.replace('/w500', '/w1280')
  }));
}

export async function getMovieDetails(id) {
  if (TMDB_API_KEY && id > 100) { // Local mocks use ids <= 80, TMDB uses larger numbers
    try {
      const data = await fetchFromTMDB(`/movie/${id}`);
      const credits = await fetchFromTMDB(`/movie/${id}/credits`);
      const director = credits.crew.find(c => c.job === 'Director')?.name || 'Unknown';
      const cast = credits.cast.slice(0, 6).map(c => ({ name: c.name, character: c.character }));
      
      const transformed = transformTMDBMovie(data);
      return {
        ...transformed,
        director,
        cast
      };
    } catch (e) {
      console.warn("Failed to fetch TMDB movie details, falling back");
    }
  }

  // Find inside mock local list
  const localMovie = movies.find(m => m.id === Number(id));
  if (localMovie) {
    const queryTitle = encodeURIComponent(localMovie.title);
    return {
      ...localMovie,
      releaseYear: 1995 + (localMovie.id % 30),
      releaseDate: `${1995 + (localMovie.id % 30)}-10-12`,
      rating: (7.4 + (localMovie.id % 2.4)).toFixed(1),
      runtime: 105 + (localMovie.id * 3) % 60,
      backdrop: localMovie.poster,
      cast: mockCastList.slice(localMovie.id % 5, (localMovie.id % 5) + 5),
      imdbId: `tt${1000000 + localMovie.id}`,
      tmdbUrl: `https://www.themoviedb.org/movie/${localMovie.id}`,
      trailerUrl: `https://www.youtube.com/embed?listType=search&list=${queryTitle}+official+trailer`,
      watchUrl: `https://play.google.com/store/search?q=${queryTitle}&c=movies`,
      watchLinks: [
        { platform: 'Netflix', url: `https://www.netflix.com/search?q=${queryTitle}` },
        { platform: 'Amazon Prime', url: `https://www.amazon.com/s?k=${queryTitle}+movie` },
        { platform: 'Google Play', url: `https://play.google.com/store/search?q=${queryTitle}&c=movies` }
      ]
    };
  }
  return null;
}

export async function getMovieVideos(id) {
  if (TMDB_API_KEY && id > 100) {
    try {
      const data = await fetchFromTMDB(`/movie/${id}/videos`);
      const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailer) {
        return `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
      }
    } catch (e) {}
  }
  const localMovie = movies.find(m => m.id === Number(id));
  const query = localMovie ? localMovie.title : 'Movie';
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}+official+trailer&autoplay=1`;
}

export async function getSimilarMovies(id) {
  if (TMDB_API_KEY && id > 100) {
    try {
      const data = await fetchFromTMDB(`/movie/${id}/similar`);
      return data.results.slice(0, 6).map(transformTMDBMovie);
    } catch (e) {}
  }
  const localMovie = movies.find(m => m.id === Number(id));
  if (localMovie) {
    return movies
      .filter(m => m.genre === localMovie.genre && m.id !== localMovie.id)
      .slice(0, 6)
      .map(m => ({
        ...m,
        releaseYear: 2005 + (m.id % 20),
        rating: (7.2 + (m.id % 2)).toFixed(1)
      }));
  }
  return [];
}

export async function searchMovies(query) {
  if (!query) return [];
  if (TMDB_API_KEY) {
    try {
      const data = await fetchFromTMDB('/search/movie', { query });
      return data.results.map(transformTMDBMovie);
    } catch (e) {
      console.warn("Falling back to local search");
    }
  }
  const normalizedQuery = query.toLowerCase();
  return movies
    .filter(m => 
      m.title.toLowerCase().includes(normalizedQuery) ||
      m.director.toLowerCase().includes(normalizedQuery) ||
      m.genre.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 10)
    .map(m => ({
      ...m,
      releaseYear: 2000 + (m.id % 25),
      rating: (7.1 + (m.id % 2)).toFixed(1),
      runtime: 90 + (m.id * 3) % 60
    }));
}
