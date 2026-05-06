import type { FoodCategory, FoodListing, SkillOffer } from '../types'

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  frais: 'Frais',
  sec: 'Sec',
  conserve: 'Conserves',
  semences: 'Semences',
}

export const mockListings: FoodListing[] = [
  {
    id: '1',
    title: 'Courges butternut',
    category: 'frais',
    description:
      'Récolte familiale, à échanger avant gelée. Prévoir rendez-vous sous abri.',
    zoneLabel: 'Rayon ~6 km · secteur est',
    exchangeHint: 'Ouverts au troc (miel, conserves légumes) ou points de résilience.',
  },
  {
    id: '2',
    title: 'Farine de blé meule',
    category: 'sec',
    description: 'Sacs refermables, stock au sec. DLC voir étiquette moulin.',
    zoneLabel: 'Rayon ~8 km · centre-bourg',
    exchangeHint: 'Échange contre huile végétale ou semences potagères.',
  },
  {
    id: '3',
    title: 'Haricots blancs stérilisés',
    category: 'conserve',
    description: 'Bocaux Le Parfait, stérilisation domicile suivie.',
    zoneLabel: 'Rayon ~5 km · zone nord',
    exchangeHint: 'Troc direct : 2 bocaux contre pots de confiture maison.',
  },
  {
    id: '4',
    title: 'Semences de tomates anciennes',
    category: 'semences',
    description: 'Quelques variétés stabilisées localement ; étiquetées année N−1.',
    zoneLabel: 'Rayon ~10 km · limite ouest',
    exchangeHint: 'Contre plants ou conseil taille fruitiers.',
  },
]

export const mockSkills: SkillOffer[] = [
  {
    id: 's1',
    title: 'Réparation serrure simple',
    body:
      'Je peux diagnostiquer une serrure à cylindre standard et proposer un montage ' +
      'réversible. Contre aide plantation ou désherbage.',
    zoneLabel: 'Déplacements ~7 km',
  },
  {
    id: 's2',
    title: 'Mise en route petit potager',
    body:
      'Plan de culture léger, rotation, paillage. Pas de chimie de synthèse.',
    zoneLabel: 'Atelier jardin · rayon ~9 km',
  },
]
