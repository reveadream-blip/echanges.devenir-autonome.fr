# Troc et Survie

Plateforme d’entraide locale : **troc alimentaire**, **banque de compétences**, **carte de proximité** (zones floutées) et **PWA**.  
Stack : **React (Vite)**, **Cloudflare Worker**, base **D1** (SQLite), auth par **sessions** (cookie HTTP-only, mots de passe **PBKDF2**).

Site public du troc : **[echanges.devenirautonome.fr](https://echanges.devenirautonome.fr/)** (sans tiret dans le domaine).  
Code source GitHub : [reveadream-blip/echanges.devenir-autonome.fr](https://github.com/reveadream-blip/echanges.devenir-autonome.fr) — le nom du dépôt peut différer de l’URL de production.

---

## Développement local

Deux processus : l’API Worker (port **8787**) et Vite (port **5173** avec proxy `/api`).

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Initialiser la D1 locale et appliquer les migrations (une fois, puis après tout nouveau fichier SQL dans `migrations/`) :
   ```bash
   npx wrangler d1 migrations apply echanges_db --local --config wrangler.dev.toml
   ```
3. Terminal A — Worker :
   ```bash
   npm run dev:worker
   ```
4. Terminal B — interface React :
   ```bash
   npm run dev
   ```
5. Ouvrir `http://localhost:5173` · santé API : `http://localhost:8787/api/health`  
   Compte test : inscription sur `/inscription`, puis publication depuis `/troc/nouveau` ou `/competences/nouveau`.

Les données de secours du dossier `src/data/demoListings.ts` ne s’affichent que si l’API est injoignable.

---

## Déploiement production (Cloudflare)

### 1. Créer la base D1

```bash
npx wrangler d1 create echanges_db
```

Copier l’**uuid** affiché et le mettre dans `wrangler.toml` à la place de `REPLACE_WITH_WRANGLER_D1_UUID` :

```toml
[[d1_databases]]
binding = "DB"
database_name = "echanges_db"
database_id = "<uuid_cloudflare>"
migrations_dir = "migrations"
```

### 2. Appliquer les migrations sur la base **remote**

```bash
npx wrangler d1 migrations apply echanges_db --remote
```

(Les fichiers `migrations/0001_init.sql` et `0002_seed.sql` créent tables + annonces de démo.)

### 3. Build frontend et déployer le Worker + `dist/`

```bash
npm run build
npm run deploy
```

(`deploy` exécute `wrangler deploy` avec les assets statiques servis par le même Worker.)

### 4. Domaine personnalisé

Dans le tableau de bord Cloudflare : rattacher le Worker au sous-domaine souhaité (ex. `echanges.devenirautonome.fr`) via **Workers Routes** ou l’UI **Triggers / Custom domains** selon votre compte.

### 5. CORS / cookies

Les origines autorisées pour les cookies et le CORS sont listées dans `worker/app.ts` (localhost + `https://echanges.devenirautonome.fr`). Ajoutez toute autre origine HTTPS de production dans ce tableau si besoin.

### 6. Variables & secrets

Aucun secret obligatoire pour l’instant (sessions opaques en base). Pour une évolution (JWT, email magique, etc.), utilisez `wrangler secret put …`.

---

## Évolutions possibles

- Messagerie privée : tables `message_threads` / `messages` déjà créées ; à exposer via routes dédiées + UI.
- Vérification de profils (`users.verified`) : flux admin ou communautaire.
- Chiffrement au repos des coordonnées fines : extension schéma + enveloppe de clés (hors périmètre MVP).

---

## Licence & responsabilité

Projet à usage associatif / civique. Contenu juridique de référence sur la page **Infos & cadre** de l’application.
