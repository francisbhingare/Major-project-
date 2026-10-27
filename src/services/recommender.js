import { movies } from '@/data/movies';

// Helper: Calculate cosine similarity between two user profiles or vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Map user preferences (genres, mood, runtime, era, rating) to filter and score movies
export function getSmartRecommendations(userPrefs = {}) {
  const {
    genres: preferredGenres = [],
    mood = 'Energetic',
    runtime: maxRuntime = 240,
    era = 'Recent',
    ratingThreshold = 7.0
  } = userPrefs;

  // Enhance movie metadata dynamically for classification
  const enrichedMovies = movies.map(m => {
    const queryTitle = encodeURIComponent(m.title);
    
    // Determine release year based on ID
    let year = 2000 + (m.id % 26);
    if (m.genre === 'Horror') year = 1980 + (m.id % 45); // vintage horror classics
    if (m.genre === 'Drama') year = 1972 + (m.id % 52); // old classics like Godfather
    
    const rating = (7.2 + (m.id % 23) * 0.1).toFixed(1);
    const runtime = 90 + (m.id * 7) % 80;
    
    return {
      ...m,
      releaseYear: year,
      rating: parseFloat(rating),
      runtime,
      backdrop: m.poster,
      trailerUrl: m.trailerUrl || `https://www.youtube.com/embed?listType=search&list=${queryTitle}+official+trailer`,
      watchUrl: m.watchUrl || `https://play.google.com/store/search?q=${queryTitle}&c=movies`,
      watchLinks: m.watchLinks || [
        { platform: 'Netflix', url: `https://www.netflix.com/search?q=${queryTitle}` },
        { platform: 'Amazon Prime', url: `https://www.amazon.com/s?k=${queryTitle}+movie` },
        { platform: 'Google Play', url: `https://play.google.com/store/search?q=${queryTitle}&c=movies` }
      ]
    };
  });

  // Category classification filters
  const categorizer = {
    isMindBending: (m) => {
      const mbKeywords = ['dreams', 'simulation', 'mind-bending', 'psychological', 'memory', 'time-travel', 'asylum', 'hallucination', 'twist', 'aliens'];
      return mbKeywords.some(k => m.keywords.includes(k)) || m.genre === 'Sci-Fi' || m.genre === 'Thriller';
    },
    isFamilyFriendly: (m) => {
      const familyKeywords = ['toys', 'family', 'feel-good', 'pixar', 'disney', 'ghibli', 'animation'];
      return (familyKeywords.some(k => m.keywords.includes(k)) || m.genre === 'Animation' || m.genre === 'Comedy') && m.genre !== 'Horror' && m.genre !== 'Thriller';
    },
    isHiddenGem: (m) => {
      return m.rating >= 7.8 && m.id % 3 === 0 && m.id > 20; // simulate lesser known gems
    },
    isCultClassic: (m) => {
      return m.releaseYear < 2010 && m.rating >= 8.0;
    },
    isOscarWinner: (m) => {
      const oscarDirectors = ['Christopher Nolan', 'Francis Ford Coppola', 'Bong Joon Ho', 'Steven Spielberg', 'Martin Scorsese', 'Hayao Miyazaki', 'Quentin Tarantino', 'Denis Villeneuve'];
      return oscarDirectors.includes(m.director) && m.rating >= 7.7;
    },
    isNewRelease: (m) => {
      return m.releaseYear >= 2018;
    }
  };

  // Map mood preferences to weight parameters
  // Energetic -> action/sci-fi/comedy
  // Thoughtful -> drama/sci-fi/thriller
  // Spooky -> horror/thriller
  // Romantic -> romance/drama
  const getMoodScore = (m, activeMood) => {
    switch (activeMood) {
      case 'Energetic':
        return ['Action', 'Sci-Fi', 'Comedy'].includes(m.genre) ? 1.5 : 0.8;
      case 'Thoughtful':
        return ['Drama', 'Sci-Fi', 'Thriller'].includes(m.genre) ? 1.5 : 0.8;
      case 'Spooky':
        return ['Horror', 'Thriller'].includes(m.genre) ? 1.8 : 0.4;
      case 'Romantic':
        return ['Romance', 'Drama'].includes(m.genre) ? 1.8 : 0.5;
      default:
        return 1.0;
    }
  };

  // Filter movies that meet runtime/rating filters first
  const filterBase = (m) => {
    if (m.runtime > maxRuntime) return false;
    if (m.rating < ratingThreshold) return false;
    if (era === 'Classic' && m.releaseYear >= 2005) return false;
    if (era === 'Recent' && m.releaseYear < 2005) return false;
    return true;
  };

  const candidateMovies = enrichedMovies.filter(filterBase);
  const fallbackMovies = enrichedMovies; // use all if filter is too strict

  const getCategorizedList = (filterFn, reasonBuilder) => {
    const list = candidateMovies.length >= 10 ? candidateMovies : fallbackMovies;
    return list
      .filter(filterFn)
      .map(m => ({
        ...m,
        recommendationReason: reasonBuilder(m)
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12);
  };

  // Build specific category buckets
  const mindBending = getCategorizedList(
    categorizer.isMindBending,
    (m) => `A mind-bending ${m.genre.toLowerCase()} mystery that challenges your perception.`
  );

  const familyFriendly = getCategorizedList(
    categorizer.isFamilyFriendly,
    (m) => `Heartwarming, hilarious, and perfect for family movie nights.`
  );

  const hiddenGems = getCategorizedList(
    categorizer.isHiddenGem,
    (m) => `A highly-rated masterpiece that you might have missed.`
  );

  const cultClassics = getCategorizedList(
    categorizer.isCultClassic,
    (m) => `An iconic, critically-acclaimed film that defined its era.`
  );

  const oscarWinners = getCategorizedList(
    categorizer.isOscarWinner,
    (m) => `Academy-recognized cinema directed by visionary ${m.director}.`
  );

  const newReleases = getCategorizedList(
    categorizer.isNewRelease,
    (m) => `A recent hit bringing modern cinematic excellence to your screen.`
  );

  // Default "Because You Like [Primary Genre]"
  const primaryGenre = preferredGenres[0] || 'Sci-Fi';
  const genreRecommendations = enrichedMovies
    .filter(m => m.genre === primaryGenre)
    .map(m => ({
      ...m,
      recommendationReason: `Recommended because you listed ${primaryGenre} as your favorite genre.`
    }))
    .slice(0, 12);

  return {
    genreRecommendations,
    mindBending,
    familyFriendly,
    hiddenGems,
    cultClassics,
    oscarWinners,
    newReleases
  };
}

export function getRecommendations(userRatings, preferredGenre = null) {
  // Backwards compatibility endpoint
  const recs = getSmartRecommendations({
    genres: preferredGenre ? [preferredGenre] : [],
    ratingThreshold: 6.5
  });
  return recs.genreRecommendations;
}
