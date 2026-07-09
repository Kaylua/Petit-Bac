# Instructions Claude : Projet Petit Bac

## Bootstrap (vérifier au démarrage de chaque session)

Vérifier que `.claude/settings.local.json` contient bien le hook PostToolUse ci-dessous. S'il est absent, l'ajouter avant toute autre action.

```json
"hooks": {
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "node -e \"let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const o=JSON.parse(d);const fp=o?.tool_input?.file_path||'';if(!fp.includes('CHANTIER'))console.log(JSON.stringify({hookSpecificOutput:{hookEventName:'PostToolUse',additionalContext:'RAPPEL : si cette modification implique une decision notable ou un piege decouvert -> Journal dans CHANTIER.md. Si la structure du projet a change (fichier ajoute/supprime/renomme) -> mettre a jour INDEX.md.'}}));});\"",
          "shell": "bash"
        }
      ]
    }
  ]
}
```

---

## Fichiers à ignorer

`project-setup-template.md` : template one-shot pour initialiser ce système sur d'autres projets. Inutile dans ce projet, ne pas lire.

---

## Début de session : lire dans cet ordre
1. `INDEX.md` : carte du projet + pièges connus (toujours, ~1 min)
2. `CHANTIER.md` : **uniquement si** la tâche implique :
   - un changement d'architecture ou de stack
   - comprendre pourquoi une décision a été prise
   - un bug complexe sans réponse dans INDEX.md
   Pour les tâches simples (ajout feature, fix bug localisé), INDEX.md suffit.

## Portée des tâches : ne pas overkill

**Fais exactement ce qui est demandé, pas plus.** Pas de vérification lourde (lancer le serveur dev, scripts Playwright, screenshots, simulation multi-joueurs) pour des changements simples et à faible risque (suppression/modif de texte, traduction, style mineur). Une relecture du diff suffit dans ces cas-là.

Réserver la vérification live (serveur + navigateur/Playwright) aux cas qui la justifient réellement : logique d'état, positionnement CSS/layout, bug de comportement cross-composant, ou quand l'utilisateur la demande explicitement.

**Si tu remarques un bug ou un problème annexe pendant une tâche**, ne le corrige pas de ta propre initiative : signale-le à l'utilisateur et laisse-le décider si ça vaut le coup. Sauf s'il est trivial et strictement nécessaire pour finir proprement ce qui est demandé.

Objectif : bien faire la tâche demandée, sans dépenser du temps et des tokens sur des à-côtés non sollicités.

## Convention des commits git

Quand l'utilisateur demande un commit (souvent suivi d'un push), suivre ce format sans avoir besoin de relire `git log` :

- Préfixe conventionnel en minuscules suivi de `:` — `feat:`, `fix:`, `docs:` ou `chore:` selon la nature du changement.
- Description en français, concise (une ligne le plus souvent), qui résume le "quoi" livré pendant la session (pas un résumé fichier-par-fichier, ça duplique le diff).
- Plusieurs changements dans la même session peuvent être listés dans un seul message, séparés par `+` ou `,` (ex: `fix: temps par catégorie, steppers mobile-friendly, français par défaut + sélecteur de langue cassé`).
- Pas de tirets cadratins (voir plus haut) et pas d'emoji.
- Toujours terminer par la ligne `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` (cf. instructions générales de commit).
- Push seulement si l'utilisateur l'a demandé explicitement dans le même message (ex: "commit et push") — sinon commit seul.

## Règles obligatoires

**Après chaque décision ou événement notable** (nouvelle lib, piège découvert, choix architectural, bug non-trivial résolu) : laisser une trace dans le **"Journal des modifications récentes"** de `CHANTIER.md`. Pas de granularité fichier-par-fichier, ça va dans git.

**Si la structure du projet change** (fichier important ajouté, supprimé, renommé, ou changement architectural) : mettre à jour `INDEX.md`.
