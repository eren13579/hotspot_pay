# HotspotPay Frontend — Directives de code

## Principes fondamentaux

1. **SIMPLIFIER** — Toujours privilégier la solution la plus simple. Pas de sur-ingénierie. Si une fonction < 10 lignes suffit, ne pas créer une classe abstraite.

2. **IMPECCABLE** — Code propre, cohérent, sans duplication. Chaque fichier a un nom clair. Chaque export a un but. Pas de code commenté qui traîne. Pas de `console.log` oublié.

3. **FRONTEND-DESIGN** — L'interface est TOUJOURS en dark mode (slate-950). Chaque interaction a un feedback visuel immédiat (spinner, toast, animation). Chaque état vide a un placeholder explicite avec action.

4. **UI-UX-PRO-MAX** — Transitions fluides (150-300ms). Hover states sur tout ce qui est cliquable. Focus visible au clavier. Responsive: mobile-first avec breakpoints md/lg. Desktop: sidebar collapseable.

5. **SHADCN** — Pattern shadcn/ui : composants réutilisables dans `components/ui/`, pas de dépendance externe, tout est du Tailwind + Radix/ui primitifs si nécessaire. Radix pour modals, dropdowns, tooltips, dialogs.

6. **MAKE-INTERFACES-FEEL-BETTER** — Chaque page doit "faire sens" :
   - Les formulaires ont des labels, helpers, erreurs inline
   - Les tableaux ont des empty states, loading skeletons, pagination
   - Les boutons sont disabled pendant le chargement avec spinner
   - Les confirmations destructives ont un dialogue modal

7. **TASTE** — Goût du détail :
   - Espacement cohérent (gap-4, p-6, space-y-4)
   - Couleurs sémantiques : brand-600 (bleu), emerald (succès), red (danger), jaune (attention), slate (gris)
   - Icônes Lucide cohérentes avec le contexte
   - Typographie : titres bold, corps normal, muted pour les descriptions

## Architecture obligatoire

```
src/
├── components/ui/        # Composants réutilisables (shadcn pattern)
├── components/layout/    # Layout, Sidebar, Topbar
├── hooks/                # Hooks personnalisés (React Query wrappers)
├── api/                  # Axios client + endpoints
├── store/                # Redux Toolkit (auth slice, ui slice)
├── types/                # Interfaces TypeScript
├── utils/                # Helpers (dates, monnaie, statuts)
└── pages/                # Une page = un fichier, un rôle
```

## Interdit

- Pas de `any` en TypeScript
- Pas de `useEffect` pour le fetching (React Query uniquement)
- Pas de styles inline (Tailwind uniquement)
- Pas de dépendance CSS supplémentaire (Tailwind couvre tout)
- Pas de composant > 200 lignes (décomposer)
