'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Skins de la nave ──────────────────────────────────────────────────────────
const SKIN_STORAGE_KEY = 'asteroids.skin';
const SKINS = [
  { name: 'CLASICA', color: '#ffffff', flame: 'rgba(255,130,0,0.85)',  verts: [[20,0],[-12,-9],[-7,0],[-12,9]] },
  { name: 'NEON',    color: '#38e0ff', flame: 'rgba(56,224,255,0.85)', verts: [[20,0],[-12,-9],[-7,0],[-12,9]] },
  { name: 'DORADA',  color: '#ffd23f', flame: 'rgba(255,210,63,0.85)', verts: [[20,0],[-12,-9],[-7,0],[-12,9]] },
  { name: 'ROJA',    color: '#ff4d4d', flame: 'rgba(255,90,60,0.85)',  verts: [[20,0],[-12,-9],[-7,0],[-12,9]] },
  { name: 'MATRIX',  color: '#4dff88', flame: 'rgba(77,255,136,0.85)', verts: [[20,0],[-12,-9],[-7,0],[-12,9]] },
];

let skinIndex = loadSkin();
let skinMessage = 0; // segundos restantes mostrando el nombre de la skin

function loadSkin() {
  try {
    const v = parseInt(localStorage.getItem(SKIN_STORAGE_KEY), 10);
    if (Number.isInteger(v) && v >= 0 && v < SKINS.length) return v;
  } catch (e) {}
  return 0;
}

function saveSkin(i) {
  try { localStorage.setItem(SKIN_STORAGE_KEY, String(i)); } catch (e) {}
}

function traceShipPath(scale = 1) {
  const v = SKINS[skinIndex].verts;
  ctx.beginPath();
  ctx.moveTo(v[0][0] * scale, v[0][1] * scale);
  for (let i = 1; i < v.length; i++)
    ctx.lineTo(v[i][0] * scale, v[i][1] * scale);
  ctx.closePath();
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// ── Power-ups ─────────────────────────────────────────────────────────────────
const SPEED_BOOST_FACTOR    = 2;    // multiplicador de empuje, tope y rotación
const SPEED_BOOST_DURATION  = 5;    // segundos de duración
const TRIPLE_SHOT_DURATION  = 5;    // segundos de disparo triple
const TRIPLE_SHOT_SPREAD    = 0.2;  // radianes de apertura a cada lado
const SHIELD_DURATION       = 6;    // segundos de escudo activo
const POWERUP_DROP_CHANCE   = 0.15; // probabilidad al destruir un asteroide
const POWERUP_TTL           = 12;   // segundos antes de desvanecerse
const POWERUP_TYPES         = ['speed', 'shield', 'triple']; // a tercios iguales

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const SHOOTING_STAR_MIN_INTERVAL = 12;   // segundos mínimos entre apariciones
const SHOOTING_STAR_MAX_INTERVAL = 20;   // segundos máximos entre apariciones
const SHOOTING_STAR_SPEED        = 240;  // px/s (mucho más rápida que un asteroide)
const SHOOTING_STAR_TTL          = 6;    // segundos antes de desvanecerse
const SHOOTING_STAR_POINTS       = 150;  // puntos al destruirla

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.points = POINTS[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
class ShootingStar extends Asteroid {
  constructor(x, y, angle) {
    super(x, y, 2);
    this.vx = Math.cos(angle) * SHOOTING_STAR_SPEED;
    this.vy = Math.sin(angle) * SHOOTING_STAR_SPEED;
    this.rotSpeed = rand(-2.5, 2.5);
    this.points = SHOOTING_STAR_POINTS;
    this.life = SHOOTING_STAR_TTL;
    this.ttl  = SHOOTING_STAR_TTL;
    this.expired = false;
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) { this.dead = true; this.expired = true; }
  }

  split() {
    return [];
  }

  draw() {
    const alpha = Math.min(1, this.ttl / 1.5);

    // Estela
    ctx.save();
    ctx.strokeStyle = `rgba(255,210,63,${(alpha * 0.45).toFixed(2)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.12, this.y - this.vy * 0.12);
    ctx.stroke();
    ctx.restore();

    // Cuerpo
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = `rgba(255,210,63,${alpha.toFixed(2)})`;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.shield        = 0;
    this.tripleShot    = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.shield        > 0) this.shield        -= dt;
    if (this.tripleShot    > 0) this.tripleShot    -= dt;

    const boost  = this.speedBoost > 0 ? SPEED_BOOST_FACTOR : 1;
    const ROT    = 3.5  * boost;  // rad/s
    const THRUST = 260  * boost;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SHOT_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SHOT_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const skin = SKINS[skinIndex];
    ctx.strokeStyle = skin.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Glow al potenciarse (conserva el color de la skin)
    if (this.speedBoost > 0) {
      ctx.shadowColor = '#38e0ff';
      ctx.shadowBlur  = 14;
    }

    // Silueta según la skin activa
    traceShipPath(1);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawShield() {
    if (this.dead || this.shield <= 0) return;
    const pulse = 0.55 + 0.45 * Math.abs(Math.sin(this.shield * 6));
    const alpha = this.shield < 1 ? pulse * this.shield : pulse;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = `rgba(92,255,143,${alpha.toFixed(2)})`;
    ctx.lineWidth   = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x = x;
    this.y = y;
    this.type = type;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(15, 45);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 12;
    this.ttl  = POWERUP_TTL;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadea cuando está por expirar
    const alpha = this.ttl < 3 ? 0.4 + 0.6 * Math.abs(Math.sin(this.ttl * 6)) : 1;
    const color = this.type === 'shield' ? '92,255,143'
                : this.type === 'triple' ? '255,170,56'
                : '56,224,255';
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = `rgba(${color},${alpha.toFixed(2)})`;
    ctx.fillStyle   = `rgba(${color},${(alpha * 0.18).toFixed(2)})`;
    ctx.lineWidth   = 1.6;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(${color},${alpha.toFixed(2)})`;
    if (this.type === 'shield') {
      // Escudo: hexágono
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(7, -4);
      ctx.lineTo(7,  4);
      ctx.lineTo(0,  8);
      ctx.lineTo(-7, 4);
      ctx.lineTo(-7, -4);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'triple') {
      // Tres balas en abanico
      ctx.strokeStyle = `rgba(${color},${alpha.toFixed(2)})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (const a of [-0.5, 0, 0.5]) {
        ctx.moveTo(0, 2);
        ctx.lineTo(Math.sin(a) * 8, 2 - Math.cos(a) * 8);
      }
      ctx.stroke();
    } else {
      // Rayo
      ctx.beginPath();
      ctx.moveTo( 3, -8);
      ctx.lineTo(-4,  1);
      ctx.lineTo( 0,  1);
      ctx.lineTo(-3,  8);
      ctx.lineTo( 4, -1);
      ctx.lineTo( 0, -1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let shootingStarTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShootingStar() {
  const edge = randInt(0, 3);
  let x, y, angle;
  if (edge === 0)      { x = 0;             y = rand(0, H); angle = rand(-0.6, 0.6); }        // izquierda
  else if (edge === 1) { x = W;             y = rand(0, H); angle = Math.PI + rand(-0.6, 0.6); } // derecha
  else if (edge === 2) { x = rand(0, W);    y = 0;          angle = Math.PI / 2 + rand(-0.6, 0.6); } // arriba
  else                 { x = rand(0, W);    y = H;          angle = -Math.PI / 2 + rand(-0.6, 0.6); } // abajo
  asteroids.push(new ShootingStar(x, y, angle));
}

function resetShootingStarTimer() {
  shootingStarTimer = rand(SHOOTING_STAR_MIN_INTERVAL, SHOOTING_STAR_MAX_INTERVAL);
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  resetShootingStarTimer();
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  resetShootingStarTimer();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (skinMessage > 0) skinMessage -= dt;
  if (pressed('KeyS')) {
    skinIndex = (skinIndex + 1) % SKINS.length;
    saveSkin(skinIndex);
    skinMessage = 1.5;
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  // Despedida de estrellas fugaces que se desvanecen
  for (const a of asteroids)
    if (a.expired && !a.exploded) { a.exploded = true; explode(a.x, a.y, 6); }

  // Aparición periódica de estrellas fugaces
  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) {
    spawnShootingStar();
    resetShootingStarTimer();
  }

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (Math.random() < POWERUP_DROP_CHANCE)
          powerups.push(new PowerUp(a.x, a.y, POWERUP_TYPES[randInt(0, POWERUP_TYPES.length - 1)]));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === 'shield')      ship.shield     = SHIELD_DURATION;
      else if (p.type === 'triple') ship.tripleShot = TRIPLE_SHOT_DURATION;
      else                          ship.speedBoost = SPEED_BOOST_DURATION;
      explode(p.x, p.y, 6);
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    const splitByShield = [];
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shield > 0) {
          a.dead = true;
          explode(a.x, a.y, a.size * 5);
          splitByShield.push(...a.split());
        } else {
          killShip();
          break;
        }
      }
    }
    asteroids = asteroids.filter(a => !a.dead).concat(splitByShield);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = SKINS[skinIndex].color;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  traceShipPath(0.45);
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  let hudY = 48;
  if (ship.speedBoost > 0) {
    ctx.fillStyle = '#38e0ff';
    ctx.fillText(`VELOCIDAD  ${ship.speedBoost.toFixed(1)}s`, 14, hudY);
    hudY += 22;
  }
  if (ship.shield > 0) {
    ctx.fillStyle = '#5cff8f';
    ctx.fillText(`ESCUDO  ${ship.shield.toFixed(1)}s`, 14, hudY);
    hudY += 22;
  }
  if (ship.tripleShot > 0) {
    ctx.fillStyle = '#ffaa38';
    ctx.fillText(`TRIPLE  ${ship.tripleShot.toFixed(1)}s`, 14, hudY);
    hudY += 22;
  }
  if (skinMessage > 0) {
    ctx.fillStyle = SKINS[skinIndex].color;
    ctx.fillText(`SKIN  ${SKINS[skinIndex].name}`, 14, hudY);
  }
  ctx.fillStyle = '#fff';

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  ship.draw();
  ship.drawShield();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
