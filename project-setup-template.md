# Bootstrap : Système de contexte Claude Code

> **Instruction one-shot.** Donne ce fichier à une instance Claude Code dans n'importe quel projet pour mettre en place le système de contexte optimisé (CLAUDE.md + INDEX.md + CHANTIER.md + hook PostToolUse).
>
> Usage : depuis la racine du projet, coller le contenu de ce fichier comme premier message à Claude Code.

---

## Ce que tu dois faire

Tu vas créer un système de contexte persistant pour ce projet. Il permettra à toutes les sessions Claude Code futures de démarrer rapidement avec le bon contexte, sans gaspillage de tokens.

**Étape 0 : Explorer le projet avant d'écrire quoi que ce soit**

- Structure des dossiers et fichiers principaux
- Fichiers de configuration (`package.json`, `Cargo.toml`, `requirements.txt`, `go.mod`, `pom.xml`, etc.)
- Stack technique, versions, dépendances importantes
- Points d'entrée et architecture générale
- Commandes de démarrage / build / test

---

## Étape 1 : Créer CLAUDE.md à la racine

Contenu **fixe** (identique pour tous les projets). Remplacer uniquement `[NOM DU PROJET]` :

````markdown
# Instructions Claude : [NOM DU PROJET]

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

## Début de session : lire dans cet ordre
1. `INDEX.md` : carte du projet + pièges connus (toujours, ~1 min)
2. `CHANTIER.md` : **uniquement si** la tâche implique :
   - un changement d'architecture ou de stack
   - comprendre pourquoi une décision a été prise
   - un bug complexe sans réponse dans INDEX.md
   Pour les tâches simples (ajout feature, fix bug localisé), INDEX.md suffit.

## Règles obligatoires

**Après chaque décision ou événement notable** (nouvelle lib, piège découvert, choix architectural, bug non-trivial résolu) : laisser une trace dans le **"Journal des modifications récentes"** de `CHANTIER.md`. Pas de granularité fichier-par-fichier, ça va dans git.

**Si la structure du projet change** (fichier important ajouté, supprimé, renommé, ou changement architectural) : mettre à jour `INDEX.md`.
````

---

## Étape 2 : Créer INDEX.md à la racine

Remplir à partir de l'exploration. Structure à respecter :

```markdown
# Index & référence rapide : [NOM DU PROJET]

> **Statut :** [état actuel en une ligne, ex: "En développement", "v1.0 stable", etc.]
> Lire ce fichier EN PREMIER. Si bug : section "Pièges" avant tout.

## Carte du projet

[Une table par couche logique (front, back, lib, etc.) listant les fichiers/modules clés et leur rôle]

| Quoi | Fichier |
|------|---------|
| ... | ... |

## Démarrage rapide

[Commandes minimales pour lancer le projet]

## Pièges connus

[Laisser vide si aucun piège identifié à ce stade, sera enrichi au fil des sessions]
```

---

## Étape 3 : Créer CHANTIER.md à la racine

Remplir à partir de l'exploration. Structure à respecter :

```markdown
# Chantier : [NOM DU PROJET]

## Statut

[Une ligne : état actuel + prochaine étape connue]

---

## Architecture

[Schéma en arbre ou description de la structure, avec le rôle de chaque dossier/module principal]

---

## Stack actuelle

| Couche | Techno | Version |
|--------|--------|---------|
[Toutes les dépendances importantes]

---

## Décisions actives

[Décisions techniques structurantes qui expliquent pourquoi le projet est construit ainsi. Vide si le projet démarre.]

---

## Historique des phases

[Vide si le projet démarre. Structure pour chaque phase quand elle sera remplie :

### Nom de la phase (date) ✅
**Pourquoi :** ...
**Ce qui a été fait :** ...
**Pièges rencontrés :** ...
]

---

## Journal des modifications récentes

> Les modifications détaillées fichier-par-fichier sont dans git. Ce journal ne conserve que les décisions et événements notables entre sessions.

### [DATE] : Mise en place du système de contexte Claude Code

Création de CLAUDE.md, INDEX.md et CHANTIER.md via le template bootstrap. Système de contexte opérationnel.
```

---

## Étape 4 : Créer/mettre à jour .claude/settings.local.json

**Si le fichier n'existe pas**, le créer :

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep"
    ]
  },
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
}
```

**Si le fichier existe déjà**, ajouter uniquement le bloc `"hooks"` sans écraser les permissions ou autres configs existantes.

---

## Vérification finale

Une fois les 4 éléments créés, confirmer :
1. `CLAUDE.md`, `INDEX.md`, `CHANTIER.md` sont à la racine du projet
2. `.claude/settings.local.json` contient le hook PostToolUse
3. Résumer l'état du projet tel qu'il a été compris lors de l'exploration
