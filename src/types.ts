export type FoodCategory = 'frais' | 'sec' | 'conserve' | 'semences'

export interface FoodListing {
  id: string
  title: string
  category: FoodCategory
  description: string
  zoneLabel: string
  exchangeHint: string
}

export interface SkillOffer {
  id: string
  title: string
  body: string
  zoneLabel: string
}
