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
const backgroundMusic = document.getElementById("backgroundMusic");
const ambientCanvas = document.getElementById("ambientCanvas");
const ambientCtx = ambientCanvas.getContext("2d");

let soundEnabled = true;
let gratitudeTimers = [];
let motes = [];
let stars = [];
let comets = [];
let bursts = [];
let animationFrame = 0;
let lastDraw = 0;
let nextCometAt = 900;
let activeStageIndex = 0;

function updateSoundControl() {
  soundIcon.textContent = soundEnabled ? "♪" : "×";
  soundButton.setAttribute("aria-label", soundEnabled ? "Pausar música" : "Reanudar música");
  soundButton.title = soundEnabled ? "Pausar música" : "Reanudar música";
}

async function startBackgroundMusic() {
  if (!backgroundMusic || !soundEnabled) return;
  backgroundMusic.volume = 1;

  try {
    await backgroundMusic.play();
    delete soundButton.dataset.audioError;
  } catch (error) {
    soundEnabled = false;
    soundButton.dataset.audioError = error.name || "PlaybackError";
    updateSoundControl();
  }
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
  document.body.classList.add("has-started");
  startBackgroundMusic();
  activateStage(1);
});

gratitudeNext.addEventListener("click", () => {
  activateStage(2);
});

letterNext.addEventListener("click", () => {
  activateStage(3);
});

revealGiftButton.addEventListener("click", revealFinalMessage);

replayButton.addEventListener("click", () => {
  document.body.classList.remove("has-started");
  activateStage(0);
});

soundButton.addEventListener("click", async () => {
  if (!backgroundMusic) return;

  if (soundEnabled) {
    soundEnabled = false;
    backgroundMusic.pause();
  } else {
    soundEnabled = true;
    await startBackgroundMusic();
  }

  updateSoundControl();
});

window.addEventListener("resize", resizeAmbient);

resizeAmbient();
updateSoundControl();
animationFrame = requestAnimationFrame(drawAmbient);
