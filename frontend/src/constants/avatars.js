export const ANIMALS = [
  { id: 1, emoji: '🦊', name: 'Лиса' },
  { id: 2, emoji: '🐼', name: 'Панда' },
  { id: 3, emoji: '🦁', name: 'Лев' },
  { id: 4, emoji: '🐯', name: 'Тигр' },
  { id: 5, emoji: '🐨', name: 'Коала' },
  { id: 6, emoji: '🐸', name: 'Лягушка' },
  { id: 7, emoji: '🐵', name: 'Обезьяна' },
  { id: 8, emoji: '🦄', name: 'Единорог' },
  { id: 9, emoji: '🐲', name: 'Дракон' },
  { id: 10, emoji: '🐙', name: 'Осьминог' },
  { id: 11, emoji: '🦋', name: 'Бабочка' },
  { id: 12, emoji: '🐢', name: 'Черепаха' },
  { id: 13, emoji: '🦩', name: 'Фламинго' },
  { id: 14, emoji: '🐳', name: 'Кит' },
  { id: 15, emoji: '🦉', name: 'Сова' },
  { id: 16, emoji: '🦅', name: 'Орел' },
]

export function getAvatarEmoji(avatarId) {
  if (!avatarId) return null
  return ANIMALS.find(a => a.id === avatarId)?.emoji || null
}