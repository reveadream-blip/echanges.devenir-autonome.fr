import { foodListings, skillListings } from '../data/demoListings'
import type { FoodListingPublic, SkillListingPublic } from '../types/api'

export function fallbackFood(): FoodListingPublic[] {
  return foodListings.map((d, i) => ({
    id: `demo-${d.id}`,
    category: d.category,
    title: d.title,
    description: d.description,
    exchange: d.exchange,
    resilience_points: d.resiliencePoints ?? null,
    approx_lat: 48.85 + i * 0.008,
    approx_lng: 2.32 + i * 0.012,
    zone_label: d.zoneLabel,
    author_name: 'Démo hors-ligne',
    created_at: Math.floor(Date.now() / 1000) - i * 60,
  }))
}

export function fallbackSkills(): SkillListingPublic[] {
  return skillListings.map((d, i) => ({
    id: `demo-${d.id}`,
    title: d.title,
    offer: d.offer,
    hoping_for: d.hopingFor,
    approx_lat: 48.86 + i * 0.007,
    approx_lng: 2.31 + i * 0.011,
    zone_label: d.zoneLabel,
    author_name: 'Démo hors-ligne',
    created_at: Math.floor(Date.now() / 1000) - i * 60,
  }))
}
