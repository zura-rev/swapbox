import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import i18n from '@/i18n/config';

export function categoryName(cat: { nameKa: string; nameEn: string; nameRu?: string }) {
  const lang = i18n.language;
  if (lang === 'en') return cat.nameEn;
  if (lang === 'ru') return cat.nameRu || cat.nameEn;
  return cat.nameKa;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ka });
}

export function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export const CONDITION_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'ახალი', color: '#1D9E75' },
  like_new: { label: 'თითქმის ახალი', color: '#378ADD' },
  good: { label: 'კარგი', color: '#EF9F27' },
  fair: { label: 'საშუალო', color: '#E8593C' },
};

export const TYPE_MAP: Record<string, string> = {
  swap: '⇄ გაცვლა',
  gift: '◈ საჩუქარი',
};
