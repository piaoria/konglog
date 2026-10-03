import { page } from './data';

export function Bean({ cat = false }: { cat?: boolean }) {
  const person = cat ? page.people.away : page.people.home;
  return <img className="character-art" src={`${import.meta.env.BASE_URL}assets/${cat ? 'kongsun' : 'kongdol'}.png`} alt={`${person.name} 캐릭터`} decoding="async" draggable={false}/>;
}
