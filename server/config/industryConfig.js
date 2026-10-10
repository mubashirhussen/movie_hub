/**
 * CineVerse Cinema Industry Configurations
 * Maps regional cinema display names to verified TMDB discovery filters,
 * original languages, and regional settings.
 */

export const INDUSTRY_CONFIG = {
  tollywood: {
    id: 'tollywood',
    name: 'Tollywood',
    languageName: 'Telugu',
    languageCode: 'te',
    region: 'IN',
    tagline: 'High-octane mass action, mythological epics, and timeless musical classics',
    icon: '🔥',
    accentColor: '#f97316',
    tmdbFilters: {
      with_original_language: 'te',
      region: 'IN',
    },
  },
  bollywood: {
    id: 'bollywood',
    name: 'Bollywood',
    languageName: 'Hindi',
    languageCode: 'hi',
    region: 'IN',
    tagline: 'Grand romantic sagas, high-stakes thrillers, and iconic Indian blockbusters',
    icon: '🌟',
    accentColor: '#ec4899',
    tmdbFilters: {
      with_original_language: 'hi',
      region: 'IN',
    },
  },
  hollywood: {
    id: 'hollywood',
    name: 'Hollywood',
    languageName: 'English',
    languageCode: 'en',
    region: 'US',
    tagline: 'Sci-fi masterworks, cinematic universes, and academy-award winning epics',
    icon: '🎬',
    accentColor: '#3b82f6',
    tmdbFilters: {
      with_original_language: 'en',
      with_origin_country: 'US',
    },
  },
  kollywood: {
    id: 'kollywood',
    name: 'Kollywood',
    languageName: 'Tamil',
    languageCode: 'ta',
    region: 'IN',
    tagline: 'Gritty action dramas, visionary auteur cinema, and superstar spectacles',
    icon: '⚡',
    accentColor: '#eab308',
    tmdbFilters: {
      with_original_language: 'ta',
      region: 'IN',
    },
  },
  sandalwood: {
    id: 'sandalwood',
    name: 'Sandalwood',
    languageName: 'Kannada',
    languageCode: 'kn',
    region: 'IN',
    tagline: 'Record-shattering pan-Indian phenomena, native folklore, and intense sagas',
    icon: '🏔️',
    accentColor: '#10b981',
    tmdbFilters: {
      with_original_language: 'kn',
      region: 'IN',
    },
  },
  mollywood: {
    id: 'mollywood',
    name: 'Mollywood',
    languageName: 'Malayalam',
    languageCode: 'ml',
    region: 'IN',
    tagline: 'Realistic storytelling, survival thrillers, and award-winning masterpieces',
    icon: '🌿',
    accentColor: '#06b6d4',
    tmdbFilters: {
      with_original_language: 'ml',
      region: 'IN',
    },
  },
};

export const getIndustryConfig = (key) => {
  if (!key) return null;
  const normalized = String(key).toLowerCase().trim();
  if (normalized === 'sandywood') return INDUSTRY_CONFIG.sandalwood;
  return INDUSTRY_CONFIG[normalized] || null;
};

export const getAllIndustries = () => Object.values(INDUSTRY_CONFIG);

export default INDUSTRY_CONFIG;
