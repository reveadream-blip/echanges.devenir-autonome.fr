import { Link } from 'react-router-dom'
import { ExchangeChatButton } from './ExchangeChatButton'
import { useAuth } from '../context/useAuth'

type Props = {
  listingKind: 'food' | 'skill'
  listingId: string
  mine?: boolean
}

export function ListingMessagingBlock({ listingKind, listingId, mine }: Props) {
  const { user, ready } = useAuth()

  if (!ready) {
    return <p className="small muted">Vérification de la session…</p>
  }

  if (!user) {
    return (
      <>
        <p className="small muted">
          La messagerie du site permet d’échanger sans publier votre e-mail sur l’annonce.
          Connectez-vous pour ouvrir une conversation.
        </p>
        <div className="hero-actions messaging-actions">
          <Link className="btn btn-primary" to="/connexion">
            Connexion pour écrire à l’auteur
          </Link>
        </div>
      </>
    )
  }

  if (mine) {
    return (
      <>
        <p className="small muted">
          Les personnes intéressées peuvent vous écrire depuis cette page lorsqu’elles sont
          connectées. Retrouvez les réponses dans votre messagerie.
        </p>
        <div className="hero-actions messaging-actions">
          <Link className="btn btn-primary" to="/messages">
            Ouvrir la messagerie
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <p className="small muted">
        Proposez un rendez-vous ou des précisions : la conversation reste liée à cette annonce.
      </p>
      <div className="hero-actions messaging-actions">
        <ExchangeChatButton listingKind={listingKind} listingId={listingId} />
        <Link className="btn btn-ghost" to="/messages">
          Toutes mes conversations
        </Link>
      </div>
    </>
  )
}
