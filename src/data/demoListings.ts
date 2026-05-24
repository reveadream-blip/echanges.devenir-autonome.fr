export type FoodCategory =
  | 'Frais'
  | 'Sec'
  | 'Conserves'
  | 'Semences'
  | 'Boissons'
  | 'Épicerie'
  | 'Hygiène'
  | 'Viande'
  | 'Oeuf/Volaille'
  | 'Poisson'

export type FoodListing = {
  id: string
  title: string
  category: FoodCategory
  zoneLabel: string
  description: string
  exchange: string
  resiliencePoints?: number
}

export const foodListings: FoodListing[] = [
  {
    id: 'f1',
    title: 'Pommes de terre primeur',
    category: 'Frais',
    zoneLabel: 'Zone ~8 km · nord-est',
    description: 'Variété rustique, récolte maison. Sacs de 5 kg possibles.',
    exchange: 'Troc : 1 kg contre 2 petits pots de miel ou équivalent sec.',
    resiliencePoints: 6,
  },
  {
    id: 'f2',
    title: 'Haricots rouges secs',
    category: 'Sec',
    zoneLabel: 'Zone ~6 km · centre',
    description: 'Stockage doux et sec, millésime récent.',
    exchange: 'Troc direct : ouvert aux semences potagères ou conserves.',
  },
  {
    id: 'f3',
    title: 'Conserves de légumes',
    category: 'Conserves',
    zoneLabel: 'Zone ~10 km · périphérie',
    description: 'Bocaux stérilisés maison, étiquetage approximatif de date.',
    exchange: 'Préférence pour compétence courte (réparation textile/petit outil).',
    resiliencePoints: 4,
  },
  {
    id: 'f4',
    title: 'Mélange de semences paysannes',
    category: 'Semences',
    zoneLabel: 'Zone ~5 km',
    description: 'Tomates, courges, haricots — pas de semences F1.',
    exchange: 'Troc : contre plants ou tutorat pour semis au chaud.',
  },
  {
    id: 'f5',
    title: 'Tisanes et sirops maison',
    category: 'Boissons',
    zoneLabel: 'Zone ~7 km · sud',
    description: 'Plantes séchées et sirops artisanaux, sans additifs.',
    exchange: 'Troc contre conserves salées ou aide ponctuelle au jardin.',
  },
  {
    id: 'f6',
    title: 'Épicerie de base en vrac',
    category: 'Épicerie',
    zoneLabel: 'Zone ~6 km · ouest',
    description: 'Farine, légumineuses et sel en petits lots.',
    exchange: 'Échange contre oeufs fermiers ou petits services logistiques.',
  },
  {
    id: 'f7',
    title: 'Savon et produits d’hygiène',
    category: 'Hygiène',
    zoneLabel: 'Zone ~9 km · centre',
    description: 'Savons solides, lessive maison, format dépannage.',
    exchange: 'Troc contre semences ou matériel de conservation.',
  },
]

export type SkillListing = {
  id: string
  title: string
  zoneLabel: string
  offer: string
  hopingFor: string
}

export const skillListings: SkillListing[] = [
  {
    id: 's1',
    title: 'Réparation serrure simple',
    zoneLabel: 'Zone ~7 km',
    offer: 'Dépannage mécanique basique, matériel à prévoir si pièces manquantes.',
    hopingFor: 'Aide 2 h au potager (buttes / paillage).',
  },
  {
    id: 's2',
    title: 'Initiation geste de conservation',
    zoneLabel: 'Zone ~9 km',
    offer: '1 h pour revoir stérilisation bocaux et hygiène de base.',
    hopingFor: 'Transport vélo-cargo pour un aller simple de matériel léger.',
  },
  {
    id: 's3',
    title: 'Couture ripstop / réparation sac à dos',
    zoneLabel: 'Zone ~6 km',
    offer: 'Renfort coutures, pose patch ; machines domestiques.',
    hopingFor: 'Échange de savoir : désherbage mécanique ou greffe fruitière.',
  },
]
