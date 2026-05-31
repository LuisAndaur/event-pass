// Maps backend event categories to the prototype's visual styling
// (background color class for imagery, emoji icon, and badge color).
const CATEGORY_MAP = {
  conciertos:   { img: 'img-concert', tile: 'cat-icon-music', icon: '🎵', badge: 'badge-accent' },
  musica:       { img: 'img-music',   tile: 'cat-icon-music', icon: '🎵', badge: 'badge-accent' },
  'música':     { img: 'img-music',   tile: 'cat-icon-music', icon: '🎵', badge: 'badge-accent' },
  deportes:     { img: 'img-sport',   tile: 'cat-icon-sport', icon: '⚽', badge: 'badge-success' },
  tecnologia:   { img: 'img-tech',    tile: 'cat-icon-tech',  icon: '💻', badge: 'badge-info' },
  'tecnología': { img: 'img-tech',    tile: 'cat-icon-tech',  icon: '💻', badge: 'badge-info' },
  arte:         { img: 'img-art',     tile: 'cat-icon-art',   icon: '🎨', badge: 'badge-neutral' },
  cine:         { img: 'img-art',     tile: 'cat-icon-art',   icon: '🎬', badge: 'badge-neutral' },
  teatro:       { img: 'img-edu',     tile: 'cat-icon-edu',   icon: '🎭', badge: 'badge-warning' },
  formacion:    { img: 'img-edu',     tile: 'cat-icon-edu',   icon: '🎓', badge: 'badge-warning' },
  gastronomia:  { img: 'img-family',  tile: 'cat-icon-family',icon: '🍴', badge: 'badge-danger' },
  'gastronomía':{ img: 'img-family',  tile: 'cat-icon-family',icon: '🍴', badge: 'badge-danger' },
  familia:      { img: 'img-family',  tile: 'cat-icon-family',icon: '👨‍👩‍👧', badge: 'badge-danger' },
};

const DEFAULT = { img: 'img-tech', tile: 'cat-icon-tech', icon: '🎟️', badge: 'badge-neutral' };

export const categoryStyle = (category) => {
  if (!category) return DEFAULT;
  return CATEGORY_MAP[category.toLowerCase().trim()] || DEFAULT;
};

// Solid hex per imagery class — used as the wallet-ticket background.
const IMG_HEX = {
  'img-music': '#6366F1',
  'img-sport': '#10B981',
  'img-edu': '#F59E0B',
  'img-family': '#EC4899',
  'img-tech': '#3B82F6',
  'img-art': '#06B6D4',
  'img-concert': '#8B5CF6',
};

export const categoryHex = (category) => IMG_HEX[categoryStyle(category).img] || '#1C1F26';

export const formatPrice = (price) => {
  if (price == null) return '';
  const n = Number(price);
  if (n === 0) return 'Gratis';
  return `$${n.toLocaleString('es-AR')}`;
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const formatDateShort = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};
