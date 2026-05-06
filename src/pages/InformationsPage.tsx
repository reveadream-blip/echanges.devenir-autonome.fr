export function InformationsPage() {
  return (
    <div className="stack-lg legal">
      <header className="page-header">
        <h1>Cadre légal & confidentialité</h1>
        <p className="muted">
          Texte générique à faire valider par un juriste avant mise en production.
        </p>
      </header>

      <section className="card prose-block">
        <h2>Qualité sanitaire</h2>
        <p>
          Les échanges portent sur des denrées préparées ou stockées par des
          particuliers. Chaque personne demeure responsable de la conformité des
          produits offerts (DLC/DLUO, chaîne du froid, allergènes). La plateforme ne
          contrôle pas les lots et décline toute responsabilité quant aux effets d’un
          échange.
        </p>
      </section>

      <section className="card prose-block">
        <h2>Activité non commerciale</h2>
        <p>
          Le troc entre particuliers est permis en France lorsqu’il ne revêt pas un
          caractère professionnel récurrent. Les annonces ne doivent pas servir de
          façade à une vente habituelle : modération et signalement feront partie des
          garde-fous produit.
        </p>
      </section>

      <section className="card prose-block">
        <h2>Confidentialité</h2>
        <p>
          Pour limiter les risques en période tendue, évitez d’afficher des adresses
          précises. Privilégiez des zones agrégées et déplacez la fixation du
          rendez-vous dans une messagerie privée chiffrée (phase ultérieure). Traitez
          la liste des stocks comme une donnée sensible.
        </p>
      </section>
    </div>
  )
}
