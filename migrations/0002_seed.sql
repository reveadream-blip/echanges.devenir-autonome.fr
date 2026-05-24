-- Annonces de démonstration (sans compte : user_id NULL), coordonnées réelles stockées mais exposées floutées par l’API.

INSERT INTO food_listings (
  id,
  user_id,
  category,
  title,
  description,
  exchange,
  resilience_points,
  lat,
  lng,
  created_at
)
VALUES
  (
    'demo-f1',
    NULL,
    'Frais',
    'Pommes de terre primeur',
    'Variété rustique, récolte maison. Sacs de 5 kg possibles.',
    'Troc : 1 kg contre 2 petits pots de miel ou équivalent sec.',
    6,
    48.904,
    2.344,
    strftime('%s', 'now')
  ),
  (
    'demo-f2',
    NULL,
    'Sec',
    'Haricots rouges secs',
    'Stockage doux et sec, millésime récent.',
    'Troc direct : ouvert aux semences potagères ou conserves.',
    NULL,
    48.872,
    2.302,
    strftime('%s', 'now')
  ),
  (
    'demo-f3',
    NULL,
    'Conserves',
    'Conserves de légumes',
    'Bocaux stérilisés maison, étiquetage approximatif de date.',
    'Préférence pour compétence courte (réparation textile/petit outil).',
    4,
    48.836,
    2.358,
    strftime('%s', 'now')
  ),
  (
    'demo-f4',
    NULL,
    'Semences',
    'Mélange de semences paysannes',
    'Tomates, courges, haricots — pas de semences F1.',
    'Troc : contre plants ou tutorat pour semis au chaud.',
    NULL,
    48.858,
    2.294,
    strftime('%s', 'now')
  );

INSERT INTO skill_listings (
  id,
  user_id,
  title,
  offer,
  hoping_for,
  lat,
  lng,
  created_at
)
VALUES
  (
    'demo-s1',
    NULL,
    'Réparation serrure simple',
    'Dépannage mécanique basique, matériel à prévoir si pièces manquantes.',
    'Aide 2 h au potager (buttes / paillage).',
    48.89,
    2.32,
    strftime('%s', 'now')
  ),
  (
    'demo-s2',
    NULL,
    'Initiation geste de conservation',
    '1 h pour revoir stérilisation bocaux et hygiène de base.',
    'Transport vélo-cargo pour un aller simple de matériel léger.',
    48.846,
    2.336,
    strftime('%s', 'now')
  ),
  (
    'demo-s3',
    NULL,
    'Couture ripstop / réparation sac à dos',
    'Renfort coutures, pose patch ; machines domestiques.',
    'Échange de savoir : désherbage mécanique ou greffe fruitière.',
    48.868,
    2.312,
    strftime('%s', 'now')
  );
