const canvas = document.getElementById("waveCanvas");
const ctx = canvas.getContext("2d");

const EPS0 = 8.8541878128e-12;
const MU0 = 4e-7 * Math.PI;
const C = 299792458;
let model;
let fields;

function calculateModel(er1, mr1, er2, mr2, frequency, powerDensity) {
  const medium1 = { er: er1, mr: mr1 };
  const medium2 = { er: er2, mr: mr2 };
  const eta1 = Math.sqrt((MU0 * mr1) / (EPS0 * er1));
  const eta2 = Math.sqrt((MU0 * mr2) / (EPS0 * er2));
  const v1 = C / Math.sqrt(er1 * mr1);
  const v2 = C / Math.sqrt(er2 * mr2);
  const lambda1 = v1 / frequency;
  const lambda2 = v2 / frequency;
  const gammaE = (eta2 - eta1) / (eta2 + eta1);
  const gammaH = -gammaE;
  const tauE = 1 + gammaE;
  const tauH = 1 + gammaH;
  const reflectionPower = gammaE ** 2;
  const transmissionPower = 1 - reflectionPower;
  const E0 = Math.sqrt(2 * eta1 * powerDensity);
  const H0 = E0 / eta1;
  return { medium1, medium2, frequency, powerDensity, eta1, eta2, v1, v2, lambda1, lambda2, beta1: 2 * Math.PI / lambda1, beta2: 2 * Math.PI / lambda2, gammaE, gammaH, tauE, tauH, reflectionPower, transmissionPower, swr: (1 + Math.abs(gammaE)) / (1 - Math.abs(gammaE)), E0, H0 };
}

function buildFields(m) {
  const ratioEpsilon = m.medium2.er / m.medium1.er;
  const ratioMu = m.medium2.mr / m.medium1.mr;
  return {
    E: { title: "Pole elektryczne Eₓ(z,t)", short: "Pole E", unit: "V/m", base: m.E0, incident: m.E0, reflected: m.gammaE * m.E0, transmitted: m.tauE * m.E0, continuity: "E₁⁺(0,t) + E₁⁻(0,t) = E₂(0,t)", equation: `E₀(1 + ΓE) = E₀·${fmt(m.tauE)} = TE·E₀`, explanation: `E jest styczne i ciągłe. ΓE = ${fmt(m.gammaE)}, więc fala odbita ${m.gammaE < 0 ? "ma przeciwny znak pola E" : "ma ten sam znak pola E"} względem padającej przy granicy.`, hint: "Dodatnia wartość oznacza wektor E skierowany ku +x, ujemna ku −x." },
    H: { title: "Pole magnetyczne Hᵧ(z,t)", short: "Pole H", unit: "A/m", base: m.H0, incident: m.H0, reflected: m.gammaH * m.H0, transmitted: m.tauH * m.H0, continuity: "H₁⁺(0,t) + H₁⁻(0,t) = H₂(0,t)", equation: `H₀(1 + ΓH) = H₀·${fmt(m.tauH)} = TH·H₀`, explanation: `H jest styczne i ciągłe. Zmiana kierunku propagacji powoduje ΓH = −ΓE = ${fmt(m.gammaH)}.`, hint: "Dla fali padającej E×H wskazuje +z, a dla odbitej −z." },
    D: { title: "Indukcja elektryczna Dₓ(z,t)", short: "Pole D", unit: "C/m²", base: EPS0 * m.medium1.er * m.E0, incident: EPS0 * m.medium1.er * m.E0, reflected: EPS0 * m.medium1.er * m.gammaE * m.E0, transmitted: EPS0 * m.medium2.er * m.tauE * m.E0, continuity: `D₂t / D₁t = ε₂ / ε₁ = ${fmt(ratioEpsilon)}`, equation: "D₁t(0) = ε₁Eₜ(0),   D₂t(0) = ε₂Eₜ(0)", explanation: `D = εE. Styczne E jest ciągłe, ale styczne D zmienia się na granicy w stosunku ε₂/ε₁ = ${fmt(ratioEpsilon)}.`, hint: "Skok D wynika ze zmiany przenikalności elektrycznej materiału." },
    B: { title: "Indukcja magnetyczna Bᵧ(z,t)", short: "Pole B", unit: "T", base: MU0 * m.medium1.mr * m.H0, incident: MU0 * m.medium1.mr * m.H0, reflected: MU0 * m.medium1.mr * m.gammaH * m.H0, transmitted: MU0 * m.medium2.mr * m.tauH * m.H0, continuity: `B₂t / B₁t = μ₂ / μ₁ = ${fmt(ratioMu)}`, equation: "B₁t(0) = μ₁Hₜ(0),   B₂t(0) = μ₂Hₜ(0)", explanation: `B = μH. Styczne H jest ciągłe, ale styczne B zmienia się na granicy w stosunku μ₂/μ₁ = ${fmt(ratioMu)}.`, hint: "B ma ten sam kierunek co H, lecz jego wartość zależy od μ ośrodka." }
  };
}

const colors = {
  incident: "#31d6c4",
  reflected: "#ff6b7c",
  transmitted: "#f8c85b",
  total: "#f8fbff",
  envelope: "#9b8cff",
  grid: "rgba(190, 224, 235, .13)",
  text: "#9ab1bc"
};

const state = {
  field: "E",
  phase: 0,
  playing: true,
  speed: 0.2,
  verticalZoom: 1,
  lastTime: performance.now()
};

const controls = {
  play: document.getElementById("playPause"),
  back: document.getElementById("stepBack"),
  forward: document.getElementById("stepForward"),
  slider: document.getElementById("timeSlider"),
  phase: document.getElementById("phaseOutput"),
  speed: document.getElementById("speed"),
  incident: document.getElementById("showIncident"),
  reflected: document.getElementById("showReflected"),
  transmitted: document.getElementById("showTransmitted"),
  total: document.getElementById("showTotal"),
  envelope: document.getElementById("showEnvelope"),
  normalize: document.getElementById("normalize"),
  zoomOut: document.getElementById("zoomOut"),
  zoomIn: document.getElementById("zoomIn"),
  zoomReset: document.getElementById("zoomReset"),
  verticalZoom: document.getElementById("verticalZoom"),
  zoomOutput: document.getElementById("zoomOutput"),
  er1: document.getElementById("er1"), mr1: document.getElementById("mr1"),
  er2: document.getElementById("er2"), mr2: document.getElementById("mr2"),
  frequency: document.getElementById("frequency"), powerDensity: document.getElementById("powerDensity"),
  reset: document.getElementById("resetParameters")
};

function phaseAt(z, direction, phase) {
  const beta = z < 0 ? model.beta1 : model.beta2;
  return 2 * Math.PI * phase - direction * beta * z;
}

function componentsAt(field, z) {
  if (z < 0) {
    const incident = field.incident * Math.cos(phaseAt(z, 1, state.phase));
    const reflected = field.reflected * Math.cos(phaseAt(z, -1, state.phase));
    return { incident, reflected, transmitted: null, total: incident + reflected };
  }
  const transmitted = field.transmitted * Math.cos(phaseAt(z, 1, state.phase));
  return { incident: null, reflected: null, transmitted, total: transmitted };
}

function envelopeAt(field, z) {
  if (z >= 0) return Math.abs(field.transmitted);
  const a = field.incident;
  const b = field.reflected;
  return Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(2 * model.beta1 * z));
}

function fmt(value, digits = 4) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e4 || abs < 1e-3)) return value.toExponential(3);
  return Number(value.toFixed(digits)).toString();
}

function formatValue(value, unit) {
  const abs = Math.abs(value);
  if (unit === "V/m" || unit === "A/m") return `${value.toFixed(abs >= 1 ? 3 : 5)} ${unit}`;
  return `${value.toExponential(3)} ${unit}`;
}

function table(title, rows) {
  return `<article class="parameter-table"><h3>${title}</h3><dl>${rows.map(([k,v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></article>`;
}

function updateParameterPanels() {
  const m = model;
  document.getElementById("medium1Summary").innerHTML = `ε<sub>r1</sub> = ${fmt(m.medium1.er)} · μ<sub>r1</sub> = ${fmt(m.medium1.mr)}<br>Z<sub>w1</sub> = ${fmt(m.eta1)} Ω<br>λ<sub>1</sub> = ${fmt(m.lambda1 * 100)} cm`;
  document.getElementById("medium2Summary").innerHTML = `ε<sub>r2</sub> = ${fmt(m.medium2.er)} · μ<sub>r2</sub> = ${fmt(m.medium2.mr)}<br>Z<sub>w2</sub> = ${fmt(m.eta2)} Ω<br>λ<sub>2</sub> = ${fmt(m.lambda2 * 100)} cm`;
  document.getElementById("coefficients").innerHTML = `<span>Γ<sub>E</sub> = ${fmt(m.gammaE)}</span><span>Γ<sub>H</sub> = ${fmt(m.gammaH)}</span><span>T<sub>E</sub> = ${fmt(m.tauE)}</span><span>T<sub>H</sub> = ${fmt(m.tauH)}</span><span>R = ${fmt(m.reflectionPower)}</span><span>T<sub>P</sub> = ${fmt(m.transmissionPower)}</span><span>WFS = ${fmt(m.swr)}</span>`;
  const e = fields.E, h = fields.H, d = fields.D, b = fields.B;
  document.getElementById("parameterTables").innerHTML = [
    table("Fala i ośrodek 1", [["f", `${fmt(m.frequency / 1e9)} GHz`],["ω", `${fmt(2 * Math.PI * m.frequency)} rad/s`],["T", `${fmt(1e9 / m.frequency)} ns`],["Savg padającej", `${fmt(m.powerDensity)} W/m²`],["εr1 / μr1", `${fmt(m.medium1.er)} / ${fmt(m.medium1.mr)}`],["ε1 / μ1", `${fmt(EPS0 * m.medium1.er)} F/m / ${fmt(MU0 * m.medium1.mr)} H/m`],["n1", `${fmt(Math.sqrt(m.medium1.er * m.medium1.mr))}`],["Zw1", `${fmt(m.eta1)} Ω`],["v1", `${fmt(m.v1)} m/s`],["λ1", `${fmt(m.lambda1)} m`],["β1", `${fmt(m.beta1)} rad/m`]]),
    table("Ośrodek 2 i współczynniki", [["εr2 / μr2", `${fmt(m.medium2.er)} / ${fmt(m.medium2.mr)}`],["ε2 / μ2", `${fmt(EPS0 * m.medium2.er)} F/m / ${fmt(MU0 * m.medium2.mr)} H/m`],["n2", `${fmt(Math.sqrt(m.medium2.er * m.medium2.mr))}`],["Zw2", `${fmt(m.eta2)} Ω`],["v2", `${fmt(m.v2)} m/s`],["λ2", `${fmt(m.lambda2)} m`],["β2", `${fmt(m.beta2)} rad/m`],["ΓE / ΓH", `${fmt(m.gammaE)} / ${fmt(m.gammaH)}`],["TE / TH", `${fmt(m.tauE)} / ${fmt(m.tauH)}`],["R / TP", `${fmt(m.reflectionPower)} / ${fmt(m.transmissionPower)}`],["WFS1 / WFS2", `${fmt(m.swr)} / 1`]]),
    table("Amplitudy szczytowe", [["E+ / E− / E2", `${fmt(e.incident)} / ${fmt(e.reflected)} / ${fmt(e.transmitted)} V/m`],["H+ / H− / H2", `${fmt(h.incident)} / ${fmt(h.reflected)} / ${fmt(h.transmitted)} A/m`],["D+ / D− / D2", `${fmt(d.incident)} / ${fmt(d.reflected)} / ${fmt(d.transmitted)} C/m²`],["B+ / B− / B2", `${fmt(b.incident)} / ${fmt(b.reflected)} / ${fmt(b.transmitted)} T`],["Savg odbita", `${fmt(m.powerDensity * m.reflectionPower)} W/m²`],["Savg transmitowana", `${fmt(m.powerDensity * m.transmissionPower)} W/m²`]])
  ].join("");
  document.getElementById("envelopeGuide").textContent = `Obwiednia pokazuje zakres zmian amplitudy sumy. Dla |Γ| = ${fmt(Math.abs(m.gammaE))} powstaje fala częściowo stojąca, WFS = ${fmt(m.swr)}.`;
  document.getElementById("footerText").textContent = `Model harmoniczny, f = ${fmt(m.frequency / 1e9)} GHz. Oś z jest skompresowana względem rzeczywistej skali czasu.`;
}

function updateParameters() {
  const inputs = [controls.er1, controls.mr1, controls.er2, controls.mr2, controls.frequency, controls.powerDensity];
  const values = inputs.map(input => Number(input.value));
  inputs.forEach((input, i) => input.classList.toggle("invalid", !Number.isFinite(values[i]) || values[i] <= 0));
  if (values.some(value => !Number.isFinite(value) || value <= 0)) { document.getElementById("parameterError").textContent = "Wszystkie parametry muszą być liczbami większymi od zera."; return; }
  document.getElementById("parameterError").textContent = "";
  model = calculateModel(values[0], values[1], values[2], values[3], values[4] * 1e9, values[5]);
  fields = buildFields(model);
  updateParameterPanels();
  updateInfo();
  draw();
}

function updateInfo() {
  const f = fields[state.field];
  document.getElementById("fieldTitle").innerHTML = f.title;
  document.getElementById("explanationTitle").textContent =
    state.field === "E" || state.field === "H" ? `${state.field} jest styczne i ciągłe` : `${state.field} jest styczne i może wykonać skok`;
  document.getElementById("explanationText").textContent = f.explanation;
  document.getElementById("boundaryEquation").innerHTML = `${f.continuity}<br>${f.equation}`;
  document.getElementById("numbersTitle").textContent = f.short;
  document.getElementById("canvasHint").textContent = f.hint;

  const rows = [
    ["Padająca A⁺", f.incident],
    ["Odbita A⁻", f.reflected],
    ["Transmitowana A₂", f.transmitted],
    ["Suma tuż przed granicą", f.incident + f.reflected],
    ["Wartość tuż za granicą", f.transmitted]
  ];
  document.getElementById("amplitudes").innerHTML = rows
    .map(([label, value]) => `<dt>${label}</dt><dd>${formatValue(value, f.unit)}</dd>`)
    .join("");
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawArrow(x1, y1, x2, y2, color, width = 2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(angle - Math.PI / 6), y2 - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 8 * Math.cos(angle + Math.PI / 6), y2 - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  ctx.clearRect(0, 0, w, h);

  const pad = { left: 62, right: 28, top: 34, bottom: 48 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const boundaryX = pad.left + plotW * (2 / 3);
  const midY = pad.top + plotH / 2;
  const zMin = -2 * model.lambda1;
  const zMax = 3 * model.lambda2;
  const leftWidth = boundaryX - pad.left;
  const rightWidth = w - pad.right - boundaryX;
  const xForZ = z => z < 0
    ? boundaryX + (z / -zMin) * leftWidth
    : boundaryX + (z / zMax) * rightWidth;
  const zForX = x => x < boundaryX
    ? zMin * ((boundaryX - x) / leftWidth)
    : zMax * ((x - boundaryX) / rightWidth);
  const f = fields[state.field];
  const maxAmp = controls.normalize.checked
    ? Math.max(Math.abs(f.incident) + Math.abs(f.reflected), Math.abs(f.transmitted))
    : f.base;
  const yScale = plotH * 0.34 * state.verticalZoom / maxAmp;
  const yForValue = value => midY - value * yScale;

  ctx.fillStyle = "rgba(29, 91, 119, .18)";
  ctx.fillRect(pad.left, pad.top, boundaryX - pad.left, plotH);
  ctx.fillStyle = "rgba(112, 76, 22, .18)";
  ctx.fillRect(boundaryX, pad.top, w - pad.right - boundaryX, plotH);

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i++) {
    const x = pad.left + (plotW * i) / 6;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotH);
    ctx.stroke();
  }
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,.86)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(boundaryX, pad.top);
  ctx.lineTo(boundaryX, pad.top + plotH);
  ctx.stroke();
  ctx.fillStyle = "#edf8fb";
  ctx.font = "700 12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("GRANICA z = 0", boundaryX, pad.top + 15);

  ctx.fillStyle = colors.text;
  ctx.font = "12px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`OŚRODEK 1  εr=${fmt(model.medium1.er)}, μr=${fmt(model.medium1.mr)}, λ=${fmt(model.lambda1 * 100)} cm`, pad.left + 12, pad.top + 20);
  ctx.textAlign = "right";
  ctx.fillText(`OŚRODEK 2  εr=${fmt(model.medium2.er)}, μr=${fmt(model.medium2.mr)}, λ=${fmt(model.lambda2 * 100)} cm`, w - pad.right - 12, pad.top + 20);

  ctx.strokeStyle = "rgba(255,255,255,.32)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, midY);
  ctx.lineTo(w - pad.right, midY);
  ctx.stroke();

  const drawCurve = (key, color, width, condition) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    let started = false;
    for (let x = pad.left; x <= w - pad.right; x += 1.3) {
      const z = zForX(x);
      if (!condition(z)) {
        started = false;
        continue;
      }
      const c = componentsAt(f, z);
      const value = c[key];
      if (value === null) continue;
      const y = yForValue(value);
      if (!started) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      started = true;
    }
    ctx.stroke();
  };

  if (controls.incident.checked) drawCurve("incident", colors.incident, 1.8, z => z < 0);
  if (controls.reflected.checked) drawCurve("reflected", colors.reflected, 1.8, z => z < 0);
  if (controls.transmitted.checked) drawCurve("transmitted", colors.transmitted, 2.1, z => z >= 0);
  if (controls.total.checked) drawCurve("total", colors.total, 3.5, () => true);

  if (controls.envelope.checked) {
    ctx.strokeStyle = colors.envelope;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 5]);
    for (const sign of [1, -1]) {
      ctx.beginPath();
      for (let x = pad.left; x <= w - pad.right; x += 1.3) {
        const z = zForX(x);
        const y = yForValue(sign * envelopeAt(f, z));
        if (x === pad.left) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Sparse field vectors make the sign and local amplitude visible.
  if (controls.total.checked) {
    for (let x = pad.left + 28; x < w - pad.right; x += Math.max(42, plotW / 22)) {
      if (Math.abs(x - boundaryX) < 18) continue;
      const z = zForX(x);
      const value = componentsAt(f, z).total;
      const endY = yForValue(value);
      drawArrow(x, midY, x, endY, state.field === "E" || state.field === "D" ? "rgba(255,255,255,.48)" : "rgba(248,200,91,.55)", 1.2);
    }
  }

  drawArrow(pad.left + 55, pad.top + plotH - 25, pad.left + 135, pad.top + plotH - 25, colors.incident, 2);
  ctx.fillStyle = colors.incident;
  ctx.textAlign = "left";
  ctx.fillText("padająca +z", pad.left + 142, pad.top + plotH - 21);
  drawArrow(boundaryX - 45, pad.top + plotH - 25, boundaryX - 125, pad.top + plotH - 25, colors.reflected, 2);
  ctx.fillStyle = colors.reflected;
  ctx.textAlign = "right";
  ctx.fillText("odbita −z", boundaryX - 132, pad.top + plotH - 21);
  drawArrow(boundaryX + 35, pad.top + plotH - 25, boundaryX + 115, pad.top + plotH - 25, colors.transmitted, 2);
  ctx.fillStyle = colors.transmitted;
  ctx.textAlign = "left";
  ctx.fillText("transmitowana +z", boundaryX + 122, pad.top + plotH - 21);

  ctx.fillStyle = colors.text;
  ctx.textAlign = "center";
  ctx.fillText("−2λ₁", xForZ(-2 * model.lambda1), h - 18);
  ctx.fillText("−λ₁", xForZ(-model.lambda1), h - 18);
  ctx.fillText("0", boundaryX, h - 18);
  ctx.fillText("+λ₂", xForZ(model.lambda2), h - 18);
  ctx.fillText("+2λ₂", xForZ(2 * model.lambda2), h - 18);
  ctx.fillText("+3λ₂", xForZ(3 * model.lambda2), h - 18);
}

function setPhase(value) {
  state.phase = (value + 1) % 1;
  controls.slider.value = state.phase;
  controls.phase.value = `${state.phase.toFixed(2)} T`;
  draw();
}

function setVerticalZoom(percent) {
  const clamped = Math.min(400, Math.max(25, Math.round(percent / 25) * 25));
  state.verticalZoom = clamped / 100;
  controls.verticalZoom.value = clamped;
  controls.zoomOutput.value = `${clamped}%`;
  draw();
}

document.querySelectorAll(".field-tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".field-tab").forEach(tab => tab.classList.remove("active"));
    button.classList.add("active");
    state.field = button.dataset.field;
    updateInfo();
    draw();
  });
});

controls.play.addEventListener("click", () => {
  state.playing = !state.playing;
  controls.play.textContent = state.playing ? "Pauza" : "Odtwórz";
});
controls.back.addEventListener("click", () => { state.playing = false; controls.play.textContent = "Odtwórz"; setPhase(state.phase - 1 / 16); });
controls.forward.addEventListener("click", () => { state.playing = false; controls.play.textContent = "Odtwórz"; setPhase(state.phase + 1 / 16); });
controls.slider.addEventListener("input", event => { state.playing = false; controls.play.textContent = "Odtwórz"; setPhase(Number(event.target.value)); });
controls.speed.addEventListener("change", event => { state.speed = Number(event.target.value); });
controls.verticalZoom.addEventListener("input", event => setVerticalZoom(Number(event.target.value)));
controls.zoomOut.addEventListener("click", () => setVerticalZoom(Number(controls.verticalZoom.value) - 25));
controls.zoomIn.addEventListener("click", () => setVerticalZoom(Number(controls.verticalZoom.value) + 25));
controls.zoomReset.addEventListener("click", () => setVerticalZoom(100));
[controls.er1, controls.mr1, controls.er2, controls.mr2, controls.frequency, controls.powerDensity].forEach(input => input.addEventListener("input", updateParameters));
controls.reset.addEventListener("click", () => {
  controls.er1.value = 8; controls.mr1.value = 2; controls.er2.value = 36; controls.mr2.value = 4; controls.frequency.value = 1; controls.powerDensity.value = 1; updateParameters();
});
Object.values(controls).filter(control => control instanceof HTMLInputElement && control.type === "checkbox")
  .forEach(control => control.addEventListener("change", draw));

function animate(now) {
  const dt = Math.min((now - state.lastTime) / 1000, 0.1);
  state.lastTime = now;
  if (state.playing) setPhase(state.phase + dt * state.speed);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => { resizeCanvas(); draw(); });
updateParameters();
resizeCanvas();
setPhase(0);
requestAnimationFrame(animate);
