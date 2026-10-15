---
description: Crea un git worktree en .worktrees/<nombre> a partir del argumento dado.
agent: build
---

Crea un worktree de git. Sigue estas instrucciones exactamente:

1. Analiza este argumento: $ARGUMENTS
2. Deriva de él un nombre de worktree válido: kebab-case (minúsculas,
   números y guiones, sin espacios ni caracteres inválidos).
   Ejemplo: "Fix Nave Chocaba" → `fix-nave-chocaba`
3. Ejecuta SOLO este comando (desde la raíz del repo):
   git worktree add .worktrees/<nombre>
4. No cambies de directorio, no hagas ningún otro cambio ni comando.
5. Si el argumento es muy largo, simplifícalo a un nombre significativo.
