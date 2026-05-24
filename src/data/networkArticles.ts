export type NetworkArticle = {
  id: string
  date: string
  tag: string
  category: string
  title: string
  excerpt: string
  contentHtml: string
  facebookUrl?: string
}

export const NETWORK_ARTICLES: NetworkArticle[] = [
  {
    id: 'penuries-on-fait-le-point-ensemble-sans-panique-mais-avec-lucidite',
    date: '2026-05-24',
    tag: 'Communauté',
    category: 'Pénuries',
    title: 'Pénuries : On fait le point ensemble (sans panique, mais avec lucidité)',
    excerpt: 'Salut à tous,\n\nVous avez sûrement suivi les dernières annonces de Macron et les infos qui tournent en boucle sur les risques...',
    contentHtml: 'Salut à tous,\n\nVous avez sûrement suivi les dernières annonces de Macron et les infos qui tournent en boucle sur les risques...',
    facebookUrl: 'https://www.facebook.com/share/p/1K4ADgcmFd/',
  },
]
