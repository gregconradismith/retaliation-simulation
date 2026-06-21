'use strict';

const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

const elements = {
  timeLabel: document.getElementById('timeLabel'),
  inFlightLabel: document.getElementById('inFlightLabel'),
  impactLabel: document.getElementById('impactLabel'),
  eventText: document.getElementById('eventText'),
  eventList: document.getElementById('eventList'),
  playButton: document.getElementById('playButton'),
  resetButton: document.getElementById('resetButton'),
  leftRateValue: document.getElementById('leftRateValue'),
  leftMeanValue: document.getElementById('leftMeanValue'),
  leftVarianceValue: document.getElementById('leftVarianceValue'),
  leftLaunchesValue: document.getElementById('leftLaunchesValue'),
  leftImpactsValue: document.getElementById('leftImpactsValue'),
  leftLastSizeValue: document.getElementById('leftLastSizeValue'),
  leftMeanSizeValue: document.getElementById('leftMeanSizeValue'),
  rightRateValue: document.getElementById('rightRateValue'),
  rightMeanValue: document.getElementById('rightMeanValue'),
  rightVarianceValue: document.getElementById('rightVarianceValue'),
  rightLaunchesValue: document.getElementById('rightLaunchesValue'),
  rightImpactsValue: document.getElementById('rightImpactsValue'),
  rightLastSizeValue: document.getElementById('rightLastSizeValue'),
  rightMeanSizeValue: document.getElementById('rightMeanSizeValue'),
};

const parameterConfig = {
  rate: { min: 0, max: 30, step: 1, formatter: value => `${value} / min` },
  mean: { min: 10, max: 90, step: 5, formatter: value => `${value}` },
  variance: { min: 4, max: 400, step: 16, formatter: value => `${value}` },
};

const sideKeys = ['left', 'right'];
const sides = {
  left: {
    label: 'Left',
    color: '#2f6f9f',
    dark: '#174361',
    params: { rate: 10, mean: 42, variance: 64 },
    launches: 0,
    impacts: 0,
    totalSize: 0,
    lastSize: null,
    nextLaunchAt: Infinity,
  },
  right: {
    label: 'Right',
    color: '#c2412d',
    dark: '#7f2419',
    params: { rate: 8, mean: 50, variance: 100 },
    launches: 0,
    impacts: 0,
    totalSize: 0,
    lastSize: null,
    nextLaunchAt: Infinity,
  },
};

const simulation = {
  running: false,
  time: 0,
  lastTimestamp: null,
  projectiles: [],
  explosions: [],
  events: [],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function sampleNormal() {
  const u1 = Math.max(Number.MIN_VALUE, Math.random());
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function sampleExplosionSize(side) {
  const mean = side.params.mean;
  const standardDeviation = Math.sqrt(side.params.variance);
  return clamp(mean + standardDeviation * sampleNormal(), 4, 120);
}

function sampleLaunchWait(ratePerMinute) {
  if (ratePerMinute <= 0) return Infinity;
  const ratePerSecond = ratePerMinute / 60;
  return -Math.log(Math.max(Number.MIN_VALUE, Math.random())) / ratePerSecond;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  const wholeSeconds = Math.floor(remainder);
  const tenths = Math.floor((remainder - wholeSeconds) * 10);
  return `${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}.${tenths}`;
}

function scheduleNextLaunch(sideKey, fromTime, initial = false) {
  const side = sides[sideKey];
  const wait = sampleLaunchWait(side.params.rate);
  const limitedInitialWait = initial && Number.isFinite(wait)
    ? Math.min(wait, randomRange(0.6, 1.9))
    : wait;
  side.nextLaunchAt = fromTime + limitedInitialWait;
}

function resetSideStats() {
  sideKeys.forEach(sideKey => {
    const side = sides[sideKey];
    side.launches = 0;
    side.impacts = 0;
    side.totalSize = 0;
    side.lastSize = null;
    scheduleNextLaunch(sideKey, 0, true);
  });
}

function resetSimulation() {
  simulation.running = false;
  simulation.time = 0;
  simulation.lastTimestamp = null;
  simulation.projectiles = [];
  simulation.explosions = [];
  simulation.events = [];
  resetSideStats();
  addEvent(0, 'Simulation reset');
  updateInterface();
  draw();
}

function addEvent(time, text) {
  const stampedText = `${formatTime(time)} ${text}`;
  simulation.events.unshift(stampedText);
  simulation.events = simulation.events.slice(0, 8);
  elements.eventText.textContent = stampedText;
}

function launchProjectile(sideKey, launchTime) {
  const side = sides[sideKey];
  const fromLeft = sideKey === 'left';
  const size = sampleExplosionSize(side);
  const duration = randomRange(1.15, 1.85) + clamp(size / 240, 0, 0.35);
  const startX = fromLeft ? randomRange(0.075, 0.14) : randomRange(0.86, 0.925);
  const targetX = fromLeft ? randomRange(0.66, 0.92) : randomRange(0.08, 0.34);
  const startY = randomRange(0.72, 0.80);
  const targetY = randomRange(0.73, 0.83);
  const apexY = randomRange(0.12, 0.25) - clamp(size / 700, 0, 0.08);

  simulation.projectiles.push({
    sideKey,
    size,
    launchTime,
    impactTime: launchTime + duration,
    startX,
    startY,
    targetX,
    targetY,
    apexY,
  });

  side.launches += 1;
  addEvent(launchTime, `${side.label} launch`);
}

function registerImpact(projectile) {
  const side = sides[projectile.sideKey];
  side.impacts += 1;
  side.lastSize = projectile.size;
  side.totalSize += projectile.size;

  simulation.explosions.push({
    sideKey: projectile.sideKey,
    x: projectile.targetX,
    y: projectile.targetY,
    size: projectile.size,
    startTime: projectile.impactTime,
    duration: 1.05 + clamp(projectile.size / 180, 0, 0.55),
  });

  addEvent(projectile.impactTime, `${side.label} impact, size ${Math.round(projectile.size)}`);
}

function advanceSimulation(deltaSeconds) {
  simulation.time += deltaSeconds;

  sideKeys.forEach(sideKey => {
    const side = sides[sideKey];
    let launchGuard = 0;
    while (simulation.time >= side.nextLaunchAt && launchGuard < 12) {
      const launchTime = side.nextLaunchAt;
      launchProjectile(sideKey, launchTime);
      scheduleNextLaunch(sideKey, launchTime);
      launchGuard += 1;
    }
  });

  const stillInFlight = [];
  simulation.projectiles.forEach(projectile => {
    if (simulation.time >= projectile.impactTime) {
      registerImpact(projectile);
    } else {
      stillInFlight.push(projectile);
    }
  });
  simulation.projectiles = stillInFlight;

  simulation.explosions = simulation.explosions.filter(explosion => (
    simulation.time <= explosion.startTime + explosion.duration
  ));

  updateInterface();
}

function adjustParameter(sideKey, field, direction) {
  const config = parameterConfig[field];
  const side = sides[sideKey];
  const nextValue = clamp(
    side.params[field] + direction * config.step,
    config.min,
    config.max
  );

  side.params[field] = nextValue;
  if (field === 'rate') {
    scheduleNextLaunch(sideKey, simulation.time, true);
  }

  updateInterface();
}

function updateInterface() {
  elements.timeLabel.textContent = formatTime(simulation.time);
  elements.inFlightLabel.textContent = `In flight ${simulation.projectiles.length}`;
  elements.impactLabel.textContent = `Impacts ${sides.left.impacts + sides.right.impacts}`;
  elements.playButton.textContent = simulation.running ? 'Pause' : 'Run';
  elements.playButton.classList.toggle('is-running', simulation.running);

  sideKeys.forEach(sideKey => {
    const side = sides[sideKey];
    const prefix = sideKey === 'left' ? 'left' : 'right';
    elements[`${prefix}RateValue`].textContent = parameterConfig.rate.formatter(side.params.rate);
    elements[`${prefix}MeanValue`].textContent = parameterConfig.mean.formatter(side.params.mean);
    elements[`${prefix}VarianceValue`].textContent = parameterConfig.variance.formatter(side.params.variance);
    elements[`${prefix}LaunchesValue`].textContent = String(side.launches);
    elements[`${prefix}ImpactsValue`].textContent = String(side.impacts);
    elements[`${prefix}LastSizeValue`].textContent = side.lastSize === null
      ? '-'
      : String(Math.round(side.lastSize));
    elements[`${prefix}MeanSizeValue`].textContent = side.impacts === 0
      ? '-'
      : String(Math.round(side.totalSize / side.impacts));
  });

  elements.eventList.replaceChildren(...simulation.events.map(eventText => {
    const item = document.createElement('li');
    item.textContent = eventText;
    return item;
  }));
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(620, Math.floor(rect.width * ratio));
  const height = Math.max(420, Math.floor(rect.height * ratio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width: width / ratio, height: height / ratio };
}

function toCanvas(point, width, height) {
  return {
    x: point.x * width,
    y: point.y * height,
  };
}

function projectilePoint(projectile, progress, width, height) {
  const start = toCanvas({ x: projectile.startX, y: projectile.startY }, width, height);
  const target = toCanvas({ x: projectile.targetX, y: projectile.targetY }, width, height);
  const control = toCanvas({
    x: (projectile.startX + projectile.targetX) / 2,
    y: projectile.apexY,
  }, width, height);
  const inverse = 1 - progress;

  return {
    x: inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * target.x,
    y: inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * target.y,
  };
}

function draw() {
  const { width, height } = resizeCanvas();
  ctx.clearRect(0, 0, width, height);
  drawBattlefield(width, height);
  drawProjectilePaths(width, height);
  drawExplosions(width, height);
  drawProjectiles(width, height);
  drawBatteries(width, height);
  drawTimeline(width, height);
}

function drawBattlefield(width, height) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#e8f3f9');
  sky.addColorStop(0.58, '#fbfcfb');
  sky.addColorStop(1, '#efe3cf');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(47, 111, 159, 0.08)';
  ctx.fillRect(0, 0, width * 0.5, height);
  ctx.fillStyle = 'rgba(194, 65, 45, 0.08)';
  ctx.fillRect(width * 0.5, 0, width * 0.5, height);

  ctx.strokeStyle = 'rgba(22, 32, 43, 0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(width / 2, 24);
  ctx.lineTo(width / 2, height - 72);
  ctx.stroke();
  ctx.setLineDash([]);

  const groundY = height * 0.82;
  ctx.fillStyle = '#d9cfb7';
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.strokeStyle = '#94856b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let x = 0; x <= width; x += 32) {
    const y = groundY + Math.sin(x / 47) * 3 + Math.cos(x / 79) * 2;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#51606b';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LEFT SIDE', 22, groundY - 16);
  ctx.textAlign = 'right';
  ctx.fillText('RIGHT SIDE', width - 22, groundY - 16);
}

function drawBatteries(width, height) {
  drawBattery(width * 0.105, height * 0.79, '#2f6f9f', 1);
  drawBattery(width * 0.895, height * 0.79, '#c2412d', -1);
}

function drawBattery(x, y, color, direction) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#16202b';
  ctx.lineWidth = 2;

  roundedRectPath(-28, 10, 56, 20, 6);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.rotate(direction * -0.46);
  ctx.fillRect(direction > 0 ? 0 : -46, -7, 46, 14);
  ctx.strokeRect(direction > 0 ? 0 : -46, -7, 46, 14);
  ctx.restore();

  ctx.fillStyle = '#263544';
  ctx.beginPath();
  ctx.arc(-16, 32, 8, 0, Math.PI * 2);
  ctx.arc(16, 32, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawProjectilePaths(width, height) {
  simulation.projectiles.forEach(projectile => {
    const side = sides[projectile.sideKey];
    ctx.save();
    ctx.strokeStyle = side.color;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 9]);
    ctx.beginPath();
    for (let index = 0; index <= 30; index += 1) {
      const point = projectilePoint(projectile, index / 30, width, height);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.restore();
  });
}

function drawProjectiles(width, height) {
  simulation.projectiles.forEach(projectile => {
    const progress = clamp(
      (simulation.time - projectile.launchTime) / (projectile.impactTime - projectile.launchTime),
      0,
      1
    );
    const point = projectilePoint(projectile, progress, width, height);
    const side = sides[projectile.sideKey];

    ctx.save();
    ctx.fillStyle = side.dark;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 0.32;
    ctx.fillStyle = side.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawExplosions(width, height) {
  simulation.explosions.forEach(explosion => {
    const side = sides[explosion.sideKey];
    const age = simulation.time - explosion.startTime;
    const progress = clamp(age / explosion.duration, 0, 1);
    const center = toCanvas({ x: explosion.x, y: explosion.y }, width, height);
    const radius = (12 + explosion.size * 0.58) * (0.38 + progress * 0.9);
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    const gradient = ctx.createRadialGradient(center.x, center.y, 1, center.x, center.y, radius);
    gradient.addColorStop(0, '#fff7d6');
    gradient.addColorStop(0.34, '#f2c14e');
    gradient.addColorStop(0.72, side.color);
    gradient.addColorStop(1, 'rgba(22, 32, 43, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = side.dark;
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha * 0.85;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawTimeline(width, height) {
  const left = 22;
  const right = width - 22;
  const top = height - 54;
  const bottom = height - 20;
  const span = right - left;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.76)';
  ctx.strokeStyle = 'rgba(22, 32, 43, 0.14)';
  ctx.lineWidth = 1;
  roundedRectPath(left, top, span, bottom - top, 8);
  ctx.fill();
  ctx.stroke();

  const windowSeconds = 20;
  sideKeys.forEach(sideKey => {
    const side = sides[sideKey];
    const y = sideKey === 'left' ? top + 10 : top + 24;
    ctx.strokeStyle = side.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(left + 12, y);
    ctx.lineTo(right - 12, y);
    ctx.stroke();

    simulation.events.forEach(eventText => {
      if (!eventText.includes(side.label)) return;
      const parsed = eventText.match(/^(\d\d):(\d\d)\.(\d)/);
      if (!parsed) return;
      const eventTime = Number(parsed[1]) * 60 + Number(parsed[2]) + Number(parsed[3]) / 10;
      const age = simulation.time - eventTime;
      if (age < 0 || age > windowSeconds) return;
      const x = right - 14 - (age / windowSeconds) * (span - 28);
      ctx.fillStyle = side.color;
      ctx.beginPath();
      ctx.arc(x, y, eventText.includes('impact') ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.restore();
}

function roundedRectPath(x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + corner, y);
  ctx.arcTo(x + width, y, x + width, y + height, corner);
  ctx.arcTo(x + width, y + height, x, y + height, corner);
  ctx.arcTo(x, y + height, x, y, corner);
  ctx.arcTo(x, y, x + width, y, corner);
  ctx.closePath();
}

function animate(timestamp) {
  if (simulation.lastTimestamp === null) {
    simulation.lastTimestamp = timestamp;
  }

  const deltaSeconds = Math.min((timestamp - simulation.lastTimestamp) / 1000, 0.12);
  simulation.lastTimestamp = timestamp;

  if (simulation.running) {
    advanceSimulation(deltaSeconds);
  }

  draw();
  requestAnimationFrame(animate);
}

function toggleRunning() {
  simulation.running = !simulation.running;
  simulation.lastTimestamp = null;
  updateInterface();
}

document.querySelectorAll('[data-side][data-field]').forEach(button => {
  button.addEventListener('click', () => {
    const sideKey = button.dataset.side;
    const field = button.dataset.field;
    const direction = Number(button.dataset.delta);
    adjustParameter(sideKey, field, direction);
  });
});

elements.playButton.addEventListener('click', toggleRunning);
elements.resetButton.addEventListener('click', resetSimulation);
window.addEventListener('resize', draw);

resetSimulation();
requestAnimationFrame(animate);

if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
