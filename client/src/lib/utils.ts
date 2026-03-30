import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';
import { ka, enUS, ru } from 'date-fns/locale';
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
  const lang = i18n.language;
  const locale = lang === 'en' ? enUS : lang === 'ru' ? ru : ka;
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale });
}

export function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export const CONDITION_MAP: Record<string, { label: string; color: string; tKey: string }> = {
  new:      { label: 'ახალი',          color: '#1D9E75', tKey: 'condNew'     },
  like_new: { label: 'თითქმის ახალი', color: '#378ADD', tKey: 'condLikeNew' },
  good:     { label: 'კარგი',          color: '#EF9F27', tKey: 'condGood'    },
  fair:     { label: 'საშუალო',        color: '#E8593C', tKey: 'condFair'    },
};

// Returns localised type label using current i18n language
export function typeLabel(type: string): string {
  const icon = type === 'swap' ? '⇄' : '◈';
  const text = i18n.t(type === 'swap' ? 'swap' : 'gift');
  return `${icon} ${text}`;
}

export const TYPE_MAP: Record<string, string> = {
  swap: '⇄ გაცვლა',
  gift: '◈ საჩუქარი',
};
