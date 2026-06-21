'use strict';

const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

const elements = {
  stepLabel: document.getElementById('stepLabel'),
  statusLabel: document.getElementById('statusLabel'),
  scoreLabel: document.getElementById('scoreLabel'),
  meanLabel: document.getElementById('meanLabel'),
  activeLabel: document.getElementById('activeLabel'),
  peakLabel: document.getElementById('peakLabel'),
  cascadeLabel: document.getElementById('cascadeLabel'),
  bestLabel: document.getElementById('bestLabel'),
  eventText: document.getElementById('eventText'),
  eventList: document.getElementById('eventList'),
  playButton: document.getElementById('playButton'),
  stepButton: document.getElementById('stepButton'),
  resetButton: document.getElementById('resetButton'),
  populationSlider: document.getElementById('populationSlider'),
  retaliationSlider: document.getElementById('retaliationSlider'),
  repairSlider: document.getElementById('repairSlider'),
  provocationSlider: document.getElementById('provocationSlider'),
  populationValue: document.getElementById('populationValue'),
  retaliationValue: document.getElementById('retaliationValue'),
  repairValue: document.getElementById('repairValue'),
  provocationValue: document.getElementById('provocationValue'),
};

const threshold = 0.34;
const maxHistory = 160;
let agents = [];
let pulses = [];
let history = [];
let events = [];
let running = false;
let lastAdvance = 0;

const state = {
  step: 0,
  cascades: 0,
  containmentFloor: 100,
  previousCascade: false,
  metrics: {
    mean: 0,
    active: 0,
    peak: 0,
    containment: 100,
    status: 'Stable',
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readParameters() {
  return {
    population: Number(elements.populationSlider.value),
    retaliation: Number(elements.retaliationSlider.value) / 100,
    repair: Number(elements.repairSlider.value) / 100,
    provocation: Number(elements.provocationSlider.value) / 100,
  };
}

function updateSliderLabels() {
  elements.populationValue.value = elements.populationSlider.value;
  elements.retaliationValue.value = elements.retaliationSlider.value;
  elements.repairValue.value = elements.repairSlider.value;
  elements.provocationValue.value = elements.provocationSlider.value;
}

function resetSimulation() {
  const { population } = readParameters();
  agents = Array.from({ length: population }, () => ({
    grievance: 0.02 + Math.random() * 0.06,
  }));
  pulses = [];
  history = [];
  events = [];
  running = false;
  state.step = 0;
  state.cascades = 0;
  state.containmentFloor = 100;
  state.previousCascade = false;
  addEvent('System reset');
  injectProvocation(0.32, Math.floor(population / 4), 'Initial provocation');
  updateMetrics();
  updateInterface();
  draw();
}

function addEvent(text) {
  events.unshift({ step: state.step, text });
  events = events.slice(0, 5);
  elements.eventText.textContent = text;
}

function injectProvocation(amount, index, label) {
  const target = index ?? Math.floor(Math.random() * agents.length);
  agents[target].grievance = clamp(agents[target].grievance + amount, 0, 1);
  pulses.push({
    from: target,
    to: target,
    intensity: amount,
    life: 1,
    kind: 'shock',
  });
  addEvent(label ?? `Provocation at agent ${target + 1}`);
}

function chooseTarget(index, population) {
  const direction = Math.random() < 0.5 ? -1 : 1;
  const hop = Math.random() < 0.18 ? 2 : 1;
  return (index + direction * hop + population) % population;
}

function simulateStep() {
  const { retaliation, repair, provocation } = readParameters();
  const population = agents.length;
  const additions = Array(population).fill(0);
  const decay = 0.018 + repair * 0.078;
  let responses = 0;
  let strongestPulse = 0;

  agents.forEach((agent, index) => {
    const pressure = Math.max(0, agent.grievance - threshold);
    if (pressure <= 0) return;

    const target = chooseTarget(index, population);
    const amount = pressure * (0.05 + retaliation * 0.24);
    additions[target] += amount;
    agent.grievance = clamp(agent.grievance - pressure * (0.012 + repair * 0.036), 0, 1);
    strongestPulse = Math.max(strongestPulse, amount);
    responses += 1;
    pulses.push({
      from: index,
      to: target,
      intensity: amount,
      life: 1,
      kind: 'retaliation',
    });
  });

  agents = agents.map((agent, index) => {
    const left = agents[(index - 1 + population) % population].grievance;
    const right = agents[(index + 1) % population].grievance;
    const ambient = 0.018 * retaliation * Math.max(0, (left + right) / 2 - threshold);
    const next = agent.grievance * (1 - decay) + additions[index] + ambient;
    return { grievance: clamp(next, 0, 1) };
  });

  if (Math.random() < 0.018 + provocation * 0.155) {
    const amount = 0.15 + Math.random() * (0.16 + provocation * 0.22);
    injectProvocation(amount, undefined, 'New provocation');
  } else if (responses > 0 && state.step % 4 === 0) {
    addEvent(`${responses} retaliatory response${responses === 1 ? '' : 's'}`);
  } else if (state.step % 16 === 0) {
    addEvent('Repair dynamics dominate');
  }

  state.step += 1;
  pulses = pulses.slice(-80);
  updateMetrics(strongestPulse);
  updateInterface();
}

function updateMetrics() {
  const total = agents.reduce((sum, agent) => sum + agent.grievance, 0);
  const mean = agents.length ? total / agents.length : 0;
  const activeCount = agents.filter(agent => agent.grievance > threshold).length;
  const active = agents.length ? activeCount / agents.length : 0;
  const peak = agents.reduce((max, agent) => Math.max(max, agent.grievance), 0);
  const containment = Math.round(clamp(100 - mean * 78 - active * 32 - peak * 10, 0, 100));
  const cascade = active > 0.36 || mean > 0.5;

  if (cascade && !state.previousCascade) {
    state.cascades += 1;
    addEvent('Cascade detected');
  }

  state.previousCascade = cascade;
  state.containmentFloor = Math.min(state.containmentFloor, containment);

  let status = 'Stable';
  if (mean > 0.68 || active > 0.58) {
    status = 'Crisis';
  } else if (mean > 0.43 || active > 0.34) {
    status = 'Escalating';
  } else if (mean > 0.22 || active > 0.16) {
    status = 'Tense';
  }

  state.metrics = { mean, active, peak, containment, status };
  history.push({ mean, active, containment });
  history = history.slice(-maxHistory);
}

function updateInterface() {
  const { mean, active, peak, containment, status } = state.metrics;
  elements.stepLabel.textContent = `Step ${state.step}`;
  elements.statusLabel.textContent = status;
  elements.scoreLabel.textContent = `Containment ${containment}`;
  elements.meanLabel.textContent = mean.toFixed(2);
  elements.activeLabel.textContent = `${Math.round(active * 100)}%`;
  elements.peakLabel.textContent = peak.toFixed(2);
  elements.cascadeLabel.textContent = String(state.cascades);
  elements.bestLabel.textContent = String(state.containmentFloor);
  elements.playButton.textContent = running ? 'Pause' : 'Run';
  elements.playButton.classList.toggle('is-running', running);

  elements.eventList.innerHTML = events.map(event => (
    `<li><strong>${event.step}</strong> ${event.text}</li>`
  )).join('');
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(640, Math.floor(rect.width * ratio));
  const height = Math.max(420, Math.floor(rect.height * ratio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width: width / ratio, height: height / ratio };
}

function agentPositions(width, height) {
  const chartHeight = 118;
  const centerX = width / 2;
  const centerY = (height - chartHeight) / 2 + 4;
  const radius = Math.max(110, Math.min(width, height - chartHeight) * 0.34);

  return agents.map((agent, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / agents.length);
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      grievance: agent.grievance,
    };
  });
}

function colorForGrievance(value) {
  if (value < threshold) {
    const mix = value / threshold;
    return blend('#d8eadf', '#f2c14e', mix);
  }

  const mix = clamp((value - threshold) / (1 - threshold), 0, 1);
  return blend('#f2c14e', '#c2412d', mix);
}

function blend(a, b, t) {
  const first = hexToRgb(a);
  const second = hexToRgb(b);
  const mixed = first.map((channel, index) => (
    Math.round(channel + (second[index] - channel) * t)
  ));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ];
}

function draw() {
  const { width, height } = resizeCanvas();
  ctx.clearRect(0, 0, width, height);
  drawBackground(width, height);

  const positions = agentPositions(width, height);
  drawLinks(positions);
  drawPulses(positions);
  drawAgents(positions);
  drawCenterGauge(width, height);
  drawHistory(width, height);
}

function drawBackground(width, height) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#edf2ee';
  ctx.lineWidth = 1;
  for (let x = 24; x < width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 24; y < height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawLinks(positions) {
  ctx.strokeStyle = '#c8d4cd';
  ctx.lineWidth = 1.4;
  positions.forEach((position, index) => {
    const next = positions[(index + 1) % positions.length];
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
  });
}

function drawPulses(positions) {
  pulses.forEach(pulse => {
    const from = positions[pulse.from];
    const to = positions[pulse.to];
    const alpha = clamp(pulse.life, 0, 1);
    const color = pulse.kind === 'shock' ? '194, 65, 45' : '201, 134, 20';

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgba(${color}, ${0.28 + alpha * 0.55})`;
    ctx.lineWidth = 3 + pulse.intensity * 16;
    ctx.lineCap = 'round';
    ctx.beginPath();

    if (pulse.from === pulse.to) {
      ctx.arc(from.x, from.y, 20 + pulse.intensity * 45 * (1 - alpha), 0, Math.PI * 2);
    } else {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const bendX = midX + (midX - canvas.width / ((window.devicePixelRatio || 1) * 2)) * 0.08;
      const bendY = midY + (midY - canvas.height / ((window.devicePixelRatio || 1) * 2)) * 0.08;
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(bendX, bendY, to.x, to.y);
    }

    ctx.stroke();
    ctx.restore();
    pulse.life *= 0.86;
  });

  pulses = pulses.filter(pulse => pulse.life > 0.04);
}

function drawAgents(positions) {
  positions.forEach(position => {
    const radius = 8 + position.grievance * 12;
    ctx.beginPath();
    ctx.fillStyle = colorForGrievance(position.grievance);
    ctx.strokeStyle = position.grievance > threshold ? '#7c2d12' : '#5d7565';
    ctx.lineWidth = 1.4;
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function drawCenterGauge(width, height) {
  const chartHeight = 118;
  const centerX = width / 2;
  const centerY = (height - chartHeight) / 2 + 4;
  const { containment, status } = state.metrics;

  ctx.save();
  ctx.fillStyle = '#20354a';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 56, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 24px system-ui, sans-serif';
  ctx.fillText(String(containment), centerX, centerY - 8);
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(status.toUpperCase(), centerX, centerY + 18);
  ctx.restore();
}

function drawHistory(width, height) {
  const left = 24;
  const right = width - 24;
  const bottom = height - 22;
  const top = height - 112;
  const span = right - left;
  const count = Math.max(2, history.length);

  ctx.save();
  ctx.fillStyle = 'rgba(244, 247, 243, 0.86)';
  ctx.strokeStyle = '#c8d4cd';
  ctx.lineWidth = 1;
  roundRect(left, top - 12, span, 104, 8);
  ctx.fill();
  ctx.stroke();

  drawHistoryLine('mean', '#c2412d', left, right, top, bottom, count);
  drawHistoryLine('active', '#2f6f9f', left, right, top, bottom, count);

  ctx.fillStyle = '#5e6972';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('mean grievance', left + 10, top + 4);
  ctx.fillStyle = '#2f6f9f';
  ctx.fillText('active share', left + 122, top + 4);
  ctx.restore();
}

function drawHistoryLine(key, color, left, right, top, bottom, count) {
  if (history.length < 2) return;

  ctx.beginPath();
  history.forEach((sample, index) => {
    const x = left + (index / (count - 1)) * (right - left);
    const y = bottom - clamp(sample[key], 0, 1) * (bottom - top);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.stroke();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function animate(timestamp) {
  if (running && timestamp - lastAdvance > 110) {
    simulateStep();
    lastAdvance = timestamp;
  }

  draw();
  requestAnimationFrame(animate);
}

function toggleRunning() {
  running = !running;
  updateInterface();
}

function handlePopulationChange() {
  updateSliderLabels();
  resetSimulation();
}

function handleParameterChange() {
  updateSliderLabels();
  updateInterface();
}

elements.playButton.addEventListener('click', toggleRunning);
elements.stepButton.addEventListener('click', () => {
  running = false;
  simulateStep();
  draw();
});
elements.resetButton.addEventListener('click', resetSimulation);
elements.populationSlider.addEventListener('input', handlePopulationChange);
elements.retaliationSlider.addEventListener('input', handleParameterChange);
elements.repairSlider.addEventListener('input', handleParameterChange);
elements.provocationSlider.addEventListener('input', handleParameterChange);
window.addEventListener('resize', draw);

updateSliderLabels();
resetSimulation();
requestAnimationFrame(animate);

if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
