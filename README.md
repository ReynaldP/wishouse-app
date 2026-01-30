# Wishouse - Planificateur de Budget Maison

Application web mobile-first PWA pour planifier et gérer votre budget d'achat de matériel pour la maison.

## Technologies

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Shadcn/ui
- **State**: TanStack Query, Zustand
- **Backend**: Supabase (PostgreSQL, Auth, API)
- **Animations**: Framer Motion
- **Charts**: Recharts

## Installation

### 1. Cloner et installer les dépendances

```bash
cd wishouse-app
pnpm install
```

### 2. Configurer Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Allez dans l'éditeur SQL et exécutez le contenu de `supabase-schema.sql`
3. Copiez l'URL et la clé anon depuis les paramètres du projet

### 3. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Ajouter les icônes PWA

Ajoutez vos icônes dans le dossier `public/` :
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

Vous pouvez utiliser un générateur d'icônes comme [Favicon.io](https://favicon.io) ou [RealFaviconGenerator](https://realfavicongenerator.net).

### 5. Lancer le serveur de développement

```bash
pnpm dev
```

L'application sera accessible sur http://localhost:3000

## Scripts disponibles

- `pnpm dev` - Serveur de développement
- `pnpm build` - Build de production
- `pnpm preview` - Prévisualiser le build
- `pnpm lint` - Linter
- `pnpm type-check` - Vérification des types

## Structure du projet

```
src/
├── components/     # Composants React
│   ├── ui/        # Composants UI de base (Shadcn)
│   ├── layout/    # Layout et navigation
│   ├── products/  # Composants produits
│   ├── categories/# Composants catégories
│   ├── budget/    # Composants budget
│   ├── dashboard/ # Composants tableau de bord
│   └── shared/    # Composants partagés
├── hooks/         # Hooks personnalisés (React Query)
├── lib/           # Configuration (Supabase, QueryClient)
├── stores/        # Stores Zustand
├── types/         # Types TypeScript
├── pages/         # Pages de l'application
└── utils/         # Utilitaires
```

## Fonctionnalités

- Gestion des produits avec statut, priorité, prix
- Catégories et sous-catégories personnalisables
- Tags pour organiser les produits
- Suivi du budget global et par catégorie
- Favoris et produits à acheter
- Dates planifiées avec alertes de retard
- Mode sombre
- PWA installable

## Déploiement

### Vercel (recommandé)

1. Connectez votre repo à Vercel
2. Ajoutez les variables d'environnement
3. Déployez

### Netlify

1. Build command: `pnpm build`
2. Publish directory: `dist`
3. Ajoutez les variables d'environnement

## Licence

MIT
