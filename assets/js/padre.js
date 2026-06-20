const stages = Array.from(document.querySelectorAll(".stage"));
const progressLines = Array.from(document.querySelectorAll(".progress-line"));
const startButton = document.getElementById("startButton");
const gratitudeItems = Array.from(document.querySelectorAll(".gratitude-item"));
const gratitudeNext = document.getElementById("gratitudeNext");
const letterNext = document.getElementById("letterNext");
const revealGiftButton = document.getElementById("revealGiftButton");
const finalMessage = document.getElementById("finalMessage");
const replayButton = document.getElementById("replayButton");
const soundButton = document.getElementById("soundButton");
const soundIcon = document.getElementById("soundIcon");
const ambientCanvas = document.getElementById("ambientCanvas");
const ambientCtx = ambientCanvas.getContext("2d");

let audioContext = null;
let masterGain = null;
let soundEnabled = true;
let symphonyStarted = false;
let symphonyTimer = 0;
let gratitudeTimers = [];
let motes = [];
let stars = [];
let comets = [];
let bursts = [];
let animationFrame = 0;
let lastDraw = 0;
let nextCometAt = 900;
let activeStageIndex = 0;

function setupAudio() {
  if (audioContext) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    soundButton.hidden = true;
    return;
  }
  audioContext = new AudioCtor();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.72;
  masterGain.connect(audioContext.destination);
}

function playNote(frequency, duration = 0.16, volume = 0.055, delay = 0, type = "sine") {
  if (!soundEnabled || !audioContext || !masterGain) return;
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + Math.min(0.08, duration * 0.22));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function playChord(frequencies) {
  frequencies.forEach((frequency, index) => {
    playNote(frequency, 0.7, 0.025, index * 0.08);
  });
}

function scheduleSymphonyCycle() {
  if (!audioContext || !soundEnabled) return;

  const chords = [
    [130.81, 196, 261.63, 329.63],
    [110, 164.81, 220, 261.63],
    [87.31, 130.81, 174.61, 220],
    [98, 146.83, 196, 246.94]
  ];
  const melody = [
    [523.25, 0.25], [659.25, 0.78], [783.99, 1.34],
    [659.25, 2.2], [587.33, 2.78], [523.25, 3.36],
    [440, 4.22], [523.25, 4.82], [659.25, 5.42],
    [587.33, 6.28], [493.88, 6.88], [523.25, 7.48]
  ];

  chords.forEach((chord, chordIndex) => {
    const offset = chordIndex * 2;
    chord.forEach((frequency, voiceIndex) => {
      playNote(
        frequency,
        2.35,
        voiceIndex === 0 ? 0.055 : 0.035,
        offset,
        voiceIndex % 2 === 0 ? "sine" : "triangle"
      );
    });
  });

  melody.forEach(([frequency, delay], index) => {
    playNote(frequency, 0.72, 0.046, delay, index % 3 === 0 ? "sine" : "triangle");
  });
}

function startSymphony() {
  if (symphonyStarted) return;
  symphonyStarted = true;
  scheduleSymphonyCycle();
  symphonyTimer = window.setInterval(scheduleSymphonyCycle, 8000);
}

function activateStage(index) {
  if (!stages[index]) return;
  activeStageIndex = index;

  stages.forEach((stage) => {
    stage.classList.remove("is-active");
    stage.setAttribute("aria-hidden", "true");
    stage.scrollTop = 0;
  });

  stages[index].classList.add("is-active");
  stages[index].removeAttribute("aria-hidden");
  progressLines.forEach((line, lineIndex) => {
    line.classList.toggle("is-active", lineIndex === index);
  });

  if (index === 1) revealGratitude();
  if (index === 3) resetGift();
}

function revealGratitude() {
  gratitudeTimers.forEach((timer) => clearTimeout(timer));
  gratitudeTimers = [];
  gratitudeItems.forEach((item) => item.classList.remove("is-visible"));
  gratitudeNext.classList.remove("is-visible");

  gratitudeItems.forEach((item, index) => {
    gratitudeTimers.push(setTimeout(() => {
      item.classList.add("is-visible");
      playNote(280 + index * 52, 0.12, 0.025);
    }, 220 + index * 520));
  });

  gratitudeTimers.push(setTimeout(() => {
    gratitudeNext.classList.add("is-visible");
  }, 350 + gratitudeItems.length * 520));
}

function resetGift() {
  revealGiftButton.hidden = false;
  finalMessage.classList.remove("is-visible");
  replayButton.classList.remove("is-visible");
}

function revealFinalMessage() {
  revealGiftButton.hidden = true;
  finalMessage.classList.add("is-visible");
  replayButton.classList.add("is-visible");
  createBurst();
  playChord([261.63, 329.63, 392, 523.25]);
}

function resizeAmbient() {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  ambientCanvas.width = Math.floor(window.innerWidth * scale);
  ambientCanvas.height = Math.floor(window.innerHeight * scale);
  ambientCanvas.style.width = `${window.innerWidth}px`;
  ambientCanvas.style.height = `${window.innerHeight}px`;
  ambientCtx.setTransform(scale, 0, 0, scale, 0, 0);

  const count = Math.max(45, Math.floor((window.innerWidth * window.innerHeight) / 18000));
  motes = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: 0.7 + Math.random() * 1.8,
    alpha: 0.14 + Math.random() * 0.46,
    speed: 0.08 + Math.random() * 0.22,
    drift: -0.12 + Math.random() * 0.24
  }));

  const starCount = Math.max(95, Math.floor((window.innerWidth * window.innerHeight) / 7200));
  stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: 0.45 + Math.random() * 1.65,
    alpha: 0.28 + Math.random() * 0.68,
    phase: Math.random() * Math.PI * 2,
    speed: 0.0008 + Math.random() * 0.0021
  }));
  comets = [];
  nextCometAt = 700 + Math.random() * 900;
}

function createComet() {
  const fromLeft = Math.random() > 0.28;
  const speed = 4.5 + Math.random() * 3.2;
  comets.push({
    x: fromLeft ? -90 : window.innerWidth + 90,
    y: window.innerHeight * (0.08 + Math.random() * 0.46),
    vx: fromLeft ? speed : -speed,
    vy: 1.7 + Math.random() * 1.8,
    length: 70 + Math.random() * 80,
    alpha: 0.8 + Math.random() * 0.2,
    life: 0
  });
}

function drawStarField(time) {
  stars.forEach((star) => {
    const twinkle = 0.5 + Math.sin(time * star.speed + star.phase) * 0.5;
    ambientCtx.beginPath();
    ambientCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ambientCtx.fillStyle = `rgba(255, 244, 216, ${star.alpha * (0.42 + twinkle * 0.58)})`;
    ambientCtx.fill();
  });

  if (time >= nextCometAt) {
    createComet();
    nextCometAt = time + 3000 + Math.random() * 4200;
  }

  comets = comets.filter((comet) => (
    comet.x > -220 &&
    comet.x < window.innerWidth + 220 &&
    comet.y < window.innerHeight + 120 &&
    comet.alpha > 0.03
  ));

  comets.forEach((comet) => {
    comet.x += comet.vx;
    comet.y += comet.vy;
    comet.life += 1;
    if (comet.life > 68) comet.alpha *= 0.97;

    const magnitude = Math.hypot(comet.vx, comet.vy);
    const tailX = comet.x - (comet.vx / magnitude) * comet.length;
    const tailY = comet.y - (comet.vy / magnitude) * comet.length;
    const gradient = ambientCtx.createLinearGradient(tailX, tailY, comet.x, comet.y);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.72, `rgba(151, 211, 229, ${comet.alpha * 0.34})`);
    gradient.addColorStop(1, `rgba(255, 247, 220, ${comet.alpha})`);

    ambientCtx.beginPath();
    ambientCtx.moveTo(tailX, tailY);
    ambientCtx.lineTo(comet.x, comet.y);
    ambientCtx.strokeStyle = gradient;
    ambientCtx.lineWidth = 1.6;
    ambientCtx.stroke();

    ambientCtx.beginPath();
    ambientCtx.arc(comet.x, comet.y, 2.2, 0, Math.PI * 2);
    ambientCtx.fillStyle = `rgba(255, 247, 220, ${comet.alpha})`;
    ambientCtx.shadowBlur = 14;
    ambientCtx.shadowColor = "#fff0c4";
    ambientCtx.fill();
    ambientCtx.shadowBlur = 0;
  });
}

function createBurst() {
  const colors = ["227,174,95", "136,169,143", "214,119,98", "255,250,241"];
  for (let index = 0; index < 80; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4.2;
    bursts.push({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.48,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      size: 1 + Math.random() * 2.3,
      color: colors[index % colors.length]
    });
  }
}

function drawAmbient(time) {
  if (time - lastDraw < 33) {
    animationFrame = requestAnimationFrame(drawAmbient);
    return;
  }
  lastDraw = time;
  ambientCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  if (activeStageIndex === 0) {
    drawStarField(time);
  } else {
    motes.forEach((mote) => {
      mote.y -= mote.speed;
      mote.x += mote.drift;
      if (mote.y < -10) {
        mote.y = window.innerHeight + 10;
        mote.x = Math.random() * window.innerWidth;
      }
      ambientCtx.beginPath();
      ambientCtx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
      ambientCtx.fillStyle = `rgba(255, 232, 181, ${mote.alpha})`;
      ambientCtx.fill();
    });
  }

  bursts = bursts.filter((particle) => particle.alpha > 0.02);
  bursts.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.025;
    particle.alpha *= 0.972;
    ambientCtx.beginPath();
    ambientCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ambientCtx.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
    ambientCtx.fill();
  });

  animationFrame = requestAnimationFrame(drawAmbient);
}

startButton.addEventListener("click", () => {
  setupAudio();
  if (audioContext && audioContext.state === "suspended") audioContext.resume();
  document.body.classList.add("has-started");
  startSymphony();
  playChord([261.63, 329.63, 392, 523.25]);
  activateStage(1);
});

gratitudeNext.addEventListener("click", () => {
  playNote(392, 0.2, 0.035);
  activateStage(2);
});

letterNext.addEventListener("click", () => {
  playChord([293.66, 369.99, 440]);
  activateStage(3);
});

revealGiftButton.addEventListener("click", revealFinalMessage);

replayButton.addEventListener("click", () => {
  document.body.classList.remove("has-started");
  activateStage(0);
});

soundButton.addEventListener("click", () => {
  setupAudio();
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? "♪" : "×";
  soundButton.setAttribute("aria-label", soundEnabled ? "Desactivar sonido" : "Activar sonido");
  if (!masterGain || !audioContext) return;

  const now = audioContext.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);

  if (soundEnabled) {
    if (audioContext.state === "suspended") audioContext.resume();
    masterGain.gain.exponentialRampToValueAtTime(0.72, now + 0.18);
    if (!symphonyStarted) startSymphony();
    else scheduleSymphonyCycle();
    playNote(523.25, 0.24, 0.06, 0.05);
  } else {
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  }
});

window.addEventListener("resize", resizeAmbient);

resizeAmbient();
animationFrame = requestAnimationFrame(drawAmbient);
