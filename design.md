# NoLimits — Design Handoff : Dashboard (direction 1C "Club Soir")

## Vue d'ensemble

Écran d'accueil post-connexion. Mobile-first, 390px de large.  
Fond dégradé orange/jaune lumineux avec symboles de cartes animés flottants.

---

## 1. Fond & structure de page

```css
/* Fond dégradé "été" */
background: linear-gradient(
    165deg,
    #fef08a 0%,
    #fbbf24 12%,
    #fb923c 38%,
    #f97316 65%,
    #ea580c 100%
);
min-height: 100vh;
position: relative;
overflow: hidden;
```

**Grain de texture** (optionnel, subtil) : superposer un filtre SVG `feTurbulence` en `opacity: 0.2` en position absolue couvrant tout le fond.

---

## 2. Symboles de cartes décoratifs (arrière-plan)

4 symboles Unicode (♠ ♥ ♦ ♣) en `position: absolute`, `pointer-events: none`, `user-select: none`, texte blanc semi-transparent.  
Chaque symbole a sa propre animation de flottement.

### Positions & tailles

| Symbole | Position                     | Font-size | Opacité | Animation                            |
| ------- | ---------------------------- | --------- | ------- | ------------------------------------ |
| ♠       | `left: 30px; top: 60px`      | `120px`   | `0.30`  | `suit2 11s ease-in-out infinite 3s`  |
| ♣       | `right: -40px; top: -20px`   | `320px`   | `0.32`  | `suit1 7s ease-in-out infinite`      |
| ♦       | `left: -60px; top: 260px`    | `240px`   | `0.24`  | `suit2 9s ease-in-out infinite 1.5s` |
| ♥       | `right: 40px; bottom: 120px` | `200px`   | `0.28`  | `suit3 6s ease-in-out infinite 0.8s` |

### Keyframes des animations de flottement

```css
@keyframes suit1 {
    0%,
    100% {
        transform: rotate(20deg) translateY(0) scale(1);
    }
    50% {
        transform: rotate(26deg) translateY(-32px) scale(1.07);
    }
}

@keyframes suit2 {
    0%,
    100% {
        transform: rotate(-15deg) translateY(0) scale(1);
    }
    60% {
        transform: rotate(-20deg) translateY(-38px) scale(1.05);
    }
}

@keyframes suit3 {
    0%,
    100% {
        transform: rotate(8deg) translateY(0) scale(1);
    }
    40% {
        transform: rotate(3deg) translateY(-26px) scale(1.08);
    }
}
```

---

## 3. Structure de la page (de haut en bas)

### 3.1 Barre de statut (placeholder)

```
height: 52px
Heure "9:41" à gauche : color: rgba(0,0,0,0.6); font-weight: 600; font-size: 13px
Avatar utilisateur à droite : cercle 36×36px, background: rgba(0,0,0,0.15),
  border: 1.5px solid rgba(0,0,0,0.2), initiale en font-weight: 700, color: #111
```

### 3.2 Header

```
padding: 4px 24px 0
display: flex; justify-content: space-between; align-items: center
```

- **Logo** : `NOLIMITS` en `font-weight: 900; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; color: rgba(0,0,0,0.5)`
- **Badge "Bonsoir, [prénom]"** :
    - `background: rgba(0,0,0,0.1)`, `border: 1px solid rgba(0,0,0,0.15)`, `border-radius: 100px`, `padding: 5px 10px`
    - Point de présence animé : `width: 6px; height: 6px; border-radius: 50%; background: #c2410c` — animation `pulse 2s ease-in-out infinite`
    - Texte : `color: rgba(0,0,0,0.7); font-weight: 600; font-size: 11px`

```css
@keyframes pulse {
    0%,
    100% {
        opacity: 0.45;
    }
    50% {
        opacity: 0.85;
    }
}
```

### 3.3 Bloc héro (nombre de jeux)

```
padding: 32px 24px 0
```

- **Grand chiffre** : `font-weight: 900; font-size: 96px; line-height: 1; letter-spacing: -4px; color: #111827`  
  → Afficher le nombre total de jeux disponibles
- **Sous-titre** : `font-weight: 800; font-size: 32px; line-height: 1.1; letter-spacing: -1px; margin-top: -4px; color: #111827`  
  → `"jeux ce soir"`
- **Description** : `font-size: 14px; margin-top: 8px; color: rgba(0,0,0,0.5)`  
  → `"Une seule catégorie · Jeux de cartes"` (ou adapter dynamiquement)

### 3.4 Grille de jeux (2×2)

```
padding: 24px 24px 0
display: grid; grid-template-columns: 1fr 1fr; gap: 10px
```

**Carte de jeu standard** (La Chocholle, PMU, Rouge ou Noir) :

```css
border-radius: 18px;
background: rgba(255, 255, 255, 0.45);
border: 1px solid rgba(255, 255, 255, 0.6);
padding: 16px;
position: relative;
overflow: hidden;
cursor: pointer;
transition: all 0.12s ease;
```

- Symbole déco en fond (coin bas-droite) : `position: absolute; right: -8px; bottom: -12px; font-size: 64px; opacity: 0.15; color: #111; pointer-events: none`
- Icône principale (symbole de carte) : `font-size: 20px; font-weight: 700; margin-bottom: 8px`
- Nom du jeu : `font-weight: 700; font-size: 13px; line-height: 1.2; color: #111827; margin-bottom: 4px`
- Badge difficulté : `font-size: 9px; font-weight: 700; padding: 3px 7px; border-radius: 100px; display: inline-block`

**Couleurs par jeu :**

| Jeu           | Icône | Couleur icône | Badge bg              | Badge texte |
| ------------- | ----- | ------------- | --------------------- | ----------- |
| La Chocholle  | ♣     | `#166534`     | `rgba(22,101,52,.15)` | `#166534`   |
| PMU           | ♦     | `#92400e`     | `rgba(146,64,14,.15)` | `#92400e`   |
| Rouge ou Noir | ♥     | `#991b1b`     | `rgba(146,64,14,.15)` | `#92400e`   |
| Le 99         | ♠     | `#1e40af`     | `rgba(30,64,175,.15)` | `#1e40af`   |

**Carte Le 99** (jeu en ligne) — style différencié :

```css
background: rgba(219, 234, 254, 0.6);
border: 1px solid rgba(147, 197, 253, 0.6);
```

- Symbole déco : `color: #1e40af; opacity: 0.2`
- Badge : `"En ligne"` (pas de difficulté)

**États interactifs des cartes** :

```css
/* Hover */
filter: brightness(1.1);
/* Active / tap */
transform: scale(0.96);
opacity: 0.75;
```

### 3.5 Bouton principal (CTA)

```
position: absolute; bottom: 0; left: 0; right: 0;
padding: 20px 24px 44px  /* 44px = safe area iOS */
```

```css
/* Bouton */
width: 100%;
height: 56px;
border-radius: 100px;
background: #111827;
color: #fff;
font-size: 17px;
font-weight: 800;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
box-shadow: 0 6px 32px rgba(0, 0, 0, 0.4);
border: none;
cursor: pointer;
transition: all 0.15s ease;
```

Texte : `"Démarrer une soirée ✦"` → redirige vers `/cards`

```css
/* Hover */
transform: translateY(-2px);
box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
/* Active */
transform: scale(0.97);
```

---

## 4. Typographie

- **Police** : `system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
- Pas de Google Font externe
- Hiérarchie :
    - Grand chiffre héro : 96px / weight 900
    - Sous-titre héro : 32px / weight 800
    - Nom du jeu : 13px / weight 700
    - Labels : 11–12px / weight 600
    - Micro-labels / badges : 9–10px / weight 700

---

## 5. Données dynamiques à brancher

| Élément              | Source                                                           |
| -------------------- | ---------------------------------------------------------------- |
| Grand chiffre        | `games.filter(g => g.available).length`                          |
| Prénom dans le badge | `user.firstName`                                                 |
| Liste des jeux       | API ou store — afficher seulement les jeux avec une route active |
| Jeux sans route      | Griser (opacity 0.5, pointer-events: none) selon le brief        |

---

## 6. Responsive & safe areas

- `padding-bottom` du CTA : `44px` minimum (ou `max(44px, env(safe-area-inset-bottom))`)
- La page est `min-height: 100dvh` (dynamic viewport height)
- Pas de scroll prévu sur ce dashboard — tout doit tenir dans le viewport

---

## 7. Accessibilité

- Symboles décoratifs (♠ ♥ ♦ ♣ de fond) : `aria-hidden="true"`
- Cartes de jeu cliquables : balise `<button>` ou `role="button"` avec `aria-label="Jouer à [nom]"`
- Contraste texte : texte sombre `#111827` sur fond lumineux ✓

---

## 8. Intégration Tailwind v4

Les valeurs non standard doivent passer en `style=""` inline (ex: `style="font-size: 96px; letter-spacing: -4px"`).  
Les animations `suit1/suit2/suit3/pulse` sont à définir dans le `tailwind.config` ou en CSS global :

```css
/* globals.css ou équivalent */
@keyframes suit1 { … }
@keyframes suit2 { … }
@keyframes suit3 { … }
@keyframes pulse { … }
```

Puis utiliser `style={{ animation: 'suit1 7s ease-in-out infinite' }}` en JSX.
