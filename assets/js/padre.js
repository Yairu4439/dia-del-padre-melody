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
let soundEnabled = true;
let gratitudeTimers = [];
let motes = [];
let bursts = [];
let animationFrame = 0;
let lastDraw = 0;

function setupAudio() {
  if (audioContext) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    soundButton.hidden = true;
    return;
  }
  audioContext = new AudioCtor();
}

function playNote(frequency, duration = 0.16, volume = 0.035, delay = 0) {
  if (!soundEnabled || !audioContext) return;
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function playChord(frequencies) {
  frequencies.forEach((frequency, index) => {
    playNote(frequency, 0.7, 0.025, index * 0.08);
  });
}

function activateStage(index) {
  if (!stages[index]) return;

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
  playChord([261.63, 329.63, 392]);
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
  if (soundEnabled) playNote(392, 0.15, 0.04);
});

window.addEventListener("resize", resizeAmbient);

resizeAmbient();
animationFrame = requestAnimationFrame(drawAmbient);
