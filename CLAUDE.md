# Instructions Claude — Projet Petit Bac

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

`project-setup-template.md` — template one-shot pour initialiser ce système sur d'autres projets. Inutile dans ce projet, ne pas lire.

---

## Début de session : lire dans cet ordre
1. `INDEX.md` — carte du projet + pièges connus (toujours, ~1 min)
2. `CHANTIER.md` — **uniquement si** la tâche implique :
   - un changement d'architecture ou de stack
   - comprendre pourquoi une décision a été prise
   - un bug complexe sans réponse dans INDEX.md
   Pour les tâches simples (ajout feature, fix bug localisé), INDEX.md suffit.

## Règles obligatoires

**Après chaque décision ou événement notable** (nouvelle lib, piège découvert, choix architectural, bug non-trivial résolu) : laisser une trace dans le **"Journal des modifications récentes"** de `CHANTIER.md`. Pas de granularité fichier-par-fichier — ça va dans git.

**Si la structure du projet change** (fichier important ajouté, supprimé, renommé, ou changement architectural) : mettre à jour `INDEX.md`.
