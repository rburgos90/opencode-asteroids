# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `S`       | Cambiar skin de la nave |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |
| Estrella fugaz | 150 |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de **velocidad**: al destruir asteroides puede aparecer un rayo celeste; tómalo para duplicar el empuje, la velocidad tope y la rotación durante 5 segundos (el HUD muestra el tiempo restante)
- Power-up de **escudo**: al destruir asteroides puede aparecer un hexágono verde; tómalo para proteger la nave durante 6 segundos, destruyendo los asteroides que impacten en lugar de perder una vida
- Power-up de **triple disparo**: al destruir asteroides puede aparecer un icono naranja; tómalo para disparar 3 balas en abanico durante 5 segundos (el HUD muestra el tiempo restante)
- **Estrella fugaz**: asteroide dorado que aparece cada cierto tiempo, se mueve mucho más rápido que los normales y se desvanece con el tiempo. Al destruirla no se parte y otorga puntos extra
- **Skins de la nave**: presiona `S` para ciclar entre 5 apariencias (Clásica, Neón, Dorada, Roja y Matrix). El nombre se muestra brevemente en el HUD y la elección se guarda en el navegador
