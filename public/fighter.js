const canvas = document.querySelector('#arena');
const ctx = canvas.getContext('2d');

const p1HealthEl = document.querySelector('#p1Health');
const p2HealthEl = document.querySelector('#p2Health');
const p1RoundsEl = document.querySelector('#p1Rounds');
const p2RoundsEl = document.querySelector('#p2Rounds');
const timerTextEl = document.querySelector('#timerText');
const roundTextEl = document.querySelector('#roundText');
const messageEl = document.querySelector('#message');
const restartBtn = document.querySelector('#restartBtn');

const GROUND_Y = canvas.height - 70;
const ROUND_TIME = 60;
const MAX_ROUNDS_TO_WIN = 2;

const keys = {};
let lastTick = performance.now();
let roundTimer = ROUND_TIME;
let roundSecondsAccumulator = 0;
let roundOver = false;
let gameOver = false;

function createFighter(config) {
  return {
    name: config.name,
    x: config.x,
    y: GROUND_Y,
    width: 46,
    height: 106,
    color: config.color,
    outline: config.outline,
    face: config.face,
    speed: 280,
    velocityX: 0,
    velocityY: 0,
    jumpPower: 630,
    gravity: 1650,
    health: 100,
    roundsWon: 0,
    blockReduction: 0.45,
    isBlocking: false,
    facing: config.facing,
    controls: config.controls,
    attackCooldown: 0,
    attackFlash: 0,
    hitStun: 0,
    wasAttackPressed: false,
    wasKickPressed: false,
    wasJumpPressed: false
  };
}

const p1 = createFighter({
  name: 'Player 1',
  x: 180,
  color: '#49f1a4',
  outline: '#0a6f4b',
  face: '#c0fff1',
  facing: 1,
  controls: {
    left: 'KeyA',
    right: 'KeyD',
    jump: 'KeyW',
    punch: 'KeyF',
    kick: 'KeyG',
    block: 'KeyH'
  }
});

const p2 = createFighter({
  name: 'Player 2',
  x: canvas.width - 220,
  color: '#ff7da7',
  outline: '#8f2145',
  face: '#ffe4ef',
  facing: -1,
  controls: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp',
    punch: 'KeyK',
    kick: 'KeyL',
    block: 'Semicolon'
  }
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function onGround(fighter) {
  return fighter.y >= GROUND_Y;
}

function attack(attacker, defender, attackType) {
  if (attacker.attackCooldown > 0 || roundOver || gameOver || attacker.hitStun > 0) {
    return;
  }

  const isKick = attackType === 'kick';
  const range = isKick ? 80 : 62;
  const baseDamage = isKick ? 16 : 10;
  const cooldown = isKick ? 0.58 : 0.32;
  const verticalReach = isKick ? 70 : 58;

  attacker.attackCooldown = cooldown;
  attacker.attackFlash = isKick ? 0.18 : 0.12;

  const distanceX = Math.abs((attacker.x + attacker.width / 2) - (defender.x + defender.width / 2));
  const distanceY = Math.abs((attacker.y - attacker.height / 2) - (defender.y - defender.height / 2));
  const isInFront = attacker.facing === 1 ? defender.x > attacker.x : defender.x < attacker.x;

  if (distanceX <= range && distanceY <= verticalReach && isInFront) {
    const blockedDamage = Math.round(baseDamage * defender.blockReduction);
    const damage = defender.isBlocking ? blockedDamage : baseDamage;

    defender.health = clamp(defender.health - damage, 0, 100);
    defender.hitStun = defender.isBlocking ? 0.08 : 0.16;

    const push = defender.isBlocking ? 22 : 40;
    defender.x += attacker.facing * push;
    defender.x = clamp(defender.x, 0, canvas.width - defender.width);

    if (defender.health <= 0) {
      endRound(attacker, `${attacker.name} wins by knockout!`);
    }
  }
}

function handleInput(fighter, enemy) {
  fighter.isBlocking = Boolean(keys[fighter.controls.block]) && onGround(fighter) && fighter.hitStun <= 0;
  const left = Boolean(keys[fighter.controls.left]);
  const right = Boolean(keys[fighter.controls.right]);
  const jumpPressed = Boolean(keys[fighter.controls.jump]);
  const attackPressed = Boolean(keys[fighter.controls.punch]);
  const kickPressed = Boolean(keys[fighter.controls.kick]);

  if (fighter.hitStun <= 0) {
    if (left === right || fighter.isBlocking) {
      fighter.velocityX = 0;
    } else {
      fighter.velocityX = left ? -fighter.speed : fighter.speed;
    }

    if (jumpPressed && !fighter.wasJumpPressed && onGround(fighter) && !fighter.isBlocking) {
      fighter.velocityY = -fighter.jumpPower;
    }

    if (attackPressed && !fighter.wasAttackPressed) {
      attack(fighter, enemy, 'punch');
    }

    if (kickPressed && !fighter.wasKickPressed) {
      attack(fighter, enemy, 'kick');
    }
  }

  fighter.wasJumpPressed = jumpPressed;
  fighter.wasAttackPressed = attackPressed;
  fighter.wasKickPressed = kickPressed;
}

function updateFighter(fighter, dt) {
  fighter.attackCooldown = Math.max(0, fighter.attackCooldown - dt);
  fighter.attackFlash = Math.max(0, fighter.attackFlash - dt);
  fighter.hitStun = Math.max(0, fighter.hitStun - dt);

  fighter.velocityY += fighter.gravity * dt;
  fighter.x += fighter.velocityX * dt;
  fighter.y += fighter.velocityY * dt;

  fighter.x = clamp(fighter.x, 0, canvas.width - fighter.width);

  if (fighter.y > GROUND_Y) {
    fighter.y = GROUND_Y;
    fighter.velocityY = 0;
  }
}

function updateFacing() {
  const p1Center = p1.x + p1.width / 2;
  const p2Center = p2.x + p2.width / 2;
  if (p1Center < p2Center) {
    p1.facing = 1;
    p2.facing = -1;
  } else {
    p1.facing = -1;
    p2.facing = 1;
  }
}

function updateHud() {
  p1HealthEl.style.width = `${p1.health}%`;
  p2HealthEl.style.width = `${p2.health}%`;
  p1RoundsEl.textContent = `Rounds: ${p1.roundsWon}`;
  p2RoundsEl.textContent = `Rounds: ${p2.roundsWon}`;
  timerTextEl.textContent = String(Math.max(0, Math.ceil(roundTimer)));
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#36104e');
  gradient.addColorStop(0.55, '#201138');
  gradient.addColorStop(1, '#110b1f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(208, 162, 255, 0.08)';
  for (let i = 0; i < 14; i += 1) {
    ctx.fillRect(i * 84, 35 + (i % 2) * 12, 56, 150);
  }

  ctx.fillStyle = '#2e2540';
  ctx.fillRect(0, GROUND_Y + 106, canvas.width, canvas.height - (GROUND_Y + 106));

  ctx.fillStyle = '#564466';
  ctx.fillRect(0, GROUND_Y + 102, canvas.width, 6);
}

function drawFighter(fighter) {
  ctx.save();

  const drawX = fighter.x;
  const drawY = fighter.y - fighter.height;

  ctx.shadowBlur = fighter.attackFlash > 0 ? 18 : 0;
  ctx.shadowColor = fighter.attackFlash > 0 ? '#ffd369' : 'transparent';

  ctx.fillStyle = fighter.color;
  ctx.fillRect(drawX, drawY + 22, fighter.width, fighter.height - 22);

  ctx.fillStyle = fighter.face;
  ctx.fillRect(drawX + 8, drawY, fighter.width - 16, 24);

  ctx.strokeStyle = fighter.outline;
  ctx.lineWidth = 3;
  ctx.strokeRect(drawX, drawY + 22, fighter.width, fighter.height - 22);
  ctx.strokeRect(drawX + 8, drawY, fighter.width - 16, 24);

  if (fighter.isBlocking) {
    ctx.fillStyle = 'rgba(130, 205, 255, 0.45)';
    const shieldX = fighter.facing === 1 ? drawX + fighter.width - 4 : drawX - 14;
    ctx.fillRect(shieldX, drawY + 22, 14, 56);
  }

  if (fighter.hitStun > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(drawX - 2, drawY - 2, fighter.width + 4, fighter.height + 4);
  }

  ctx.restore();
}

function draw() {
  drawBackground();
  drawFighter(p1);
  drawFighter(p2);
}

function resetFighters() {
  p1.x = 180;
  p1.y = GROUND_Y;
  p1.velocityX = 0;
  p1.velocityY = 0;
  p1.health = 100;
  p1.attackCooldown = 0;
  p1.attackFlash = 0;
  p1.hitStun = 0;
  p1.wasAttackPressed = false;
  p1.wasKickPressed = false;
  p1.wasJumpPressed = false;

  p2.x = canvas.width - 220;
  p2.y = GROUND_Y;
  p2.velocityX = 0;
  p2.velocityY = 0;
  p2.health = 100;
  p2.attackCooldown = 0;
  p2.attackFlash = 0;
  p2.hitStun = 0;
  p2.wasAttackPressed = false;
  p2.wasKickPressed = false;
  p2.wasJumpPressed = false;

  roundTimer = ROUND_TIME;
  roundSecondsAccumulator = 0;
  roundOver = false;
  roundTextEl.textContent = `Round ${p1.roundsWon + p2.roundsWon + 1}`;
  messageEl.textContent = 'Fight!';
}

function endRound(winner, reason) {
  if (roundOver || gameOver) return;
  roundOver = true;

  if (winner) {
    winner.roundsWon += 1;
  }

  messageEl.textContent = reason;

  if (p1.roundsWon >= MAX_ROUNDS_TO_WIN || p2.roundsWon >= MAX_ROUNDS_TO_WIN) {
    gameOver = true;
    const champion = p1.roundsWon > p2.roundsWon ? p1 : p2;
    messageEl.textContent = `${champion.name} wins the match! Press Restart Match.`;
    roundTextEl.textContent = 'Match Over';
    return;
  }

  window.setTimeout(() => {
    if (!gameOver) {
      resetFighters();
    }
  }, 1300);
}

function handleTimer(dt) {
  if (roundOver || gameOver) return;

  roundSecondsAccumulator += dt;
  while (roundSecondsAccumulator >= 1) {
    roundSecondsAccumulator -= 1;
    roundTimer -= 1;

    if (roundTimer <= 0) {
      const winner = p1.health === p2.health ? null : (p1.health > p2.health ? p1 : p2);
      if (!winner) {
        messageEl.textContent = 'Time up! Draw round. Resetting...';
        roundOver = true;
        window.setTimeout(() => {
          if (!gameOver) {
            resetFighters();
          }
        }, 1200);
      } else {
        endRound(winner, `Time up! ${winner.name} takes the round.`);
      }
      break;
    }
  }
}

function gameLoop(now) {
  const dt = Math.min((now - lastTick) / 1000, 0.033);
  lastTick = now;

  handleInput(p1, p2);
  handleInput(p2, p1);

  if (!roundOver && !gameOver) {
    updateFighter(p1, dt);
    updateFighter(p2, dt);
    updateFacing();
  }

  handleTimer(dt);
  updateHud();
  draw();

  requestAnimationFrame(gameLoop);
}

function restartMatch() {
  p1.roundsWon = 0;
  p2.roundsWon = 0;
  gameOver = false;
  resetFighters();
  updateHud();
}

window.addEventListener('keydown', (event) => {
  keys[event.code] = true;
  if (['ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

restartBtn.addEventListener('click', restartMatch);

resetFighters();
updateHud();
requestAnimationFrame((t) => {
  lastTick = t;
  gameLoop(t);
});
