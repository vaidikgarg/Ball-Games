// Updated game.js with monster obstacles and dynamic backgrounds

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.6;

const gravity = 0.5;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let lives = 3;
let gameRunning = false;
let speed = 4;
let lastObstacleTime = 0;
let obstacleFrequency = 1500;
let playerName = "";
let isPaused = false;
let currentMilestone = 0;
let currentBackground = "daytime";

const jumpSound = new Audio('jump.mp3');
const collisionSound = new Audio('collision.mp3');
const scoreSound = new Audio('score.mp3');
const lifeLostSound = new Audio('lifeLost.mp3');

const ball = {
  x: 50,
  y: canvas.height - 30,
  radius: 20,
  dx: 0,
  dy: 0,
  speed: speed,
  jumpPower: -12,
  grounded: false,
  emotion: "happy",
};

let obstacles = [];
let keys = { left: false, right: false, up: false };

function drawBall() {
  // Draw the ball body
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.emotion === "happy" ? "yellow" : ball.emotion === "sad" ? "blue" : "orange";
  ctx.fill();
  ctx.closePath();

  // Draw googly eyes
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(ball.x - 7, ball.y - 5, 5, 0, Math.PI * 2); // Left eye white
  ctx.arc(ball.x + 7, ball.y - 5, 5, 0, Math.PI * 2); // Right eye white
  ctx.fill();

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(ball.x - 7 + Math.random() * 2 - 1, ball.y - 5 + Math.random() * 2 - 1, 2, 0, Math.PI * 2); // Left eye pupil
  ctx.arc(ball.x + 7 + Math.random() * 2 - 1, ball.y - 5 + Math.random() * 2 - 1, 2, 0, Math.PI * 2); // Right eye pupil
  ctx.fill();
}

function drawObstacles() {
  obstacles.forEach((obstacle) => {
    if (obstacle.type === "hole") {
      ctx.fillStyle = "white";
      ctx.fillRect(obstacle.x, canvas.height - obstacle.height, obstacle.width, obstacle.height);
    } else if (obstacle.type === "spike") {
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.moveTo(obstacle.x, canvas.height);
      ctx.lineTo(obstacle.x + obstacle.width / 2, canvas.height - obstacle.height);
      ctx.lineTo(obstacle.x + obstacle.width, canvas.height);
      ctx.closePath();
      ctx.fill();
    } else if (obstacle.type === "monster") {
      drawMonster(obstacle);
    } else {
      ctx.fillStyle = "gray";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  });
}

function drawMonster(obstacle) {
  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(obstacle.x + obstacle.width / 3, obstacle.y - obstacle.height / 3, 5, 0, Math.PI * 2);
  ctx.arc(obstacle.x + 2 * obstacle.width / 3, obstacle.y - obstacle.height / 3, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y - obstacle.height / 5, 8, 0, Math.PI, false);
  ctx.fill();
}

function drawScore() {
  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Lives: ${lives}`, canvas.width - 100, 30);
}

function updateBall() {
  ball.dy += gravity;

  if (keys.up && ball.grounded) {
    ball.dy = ball.jumpPower;
    ball.grounded = false;
    ball.emotion = "happy";
    jumpSound.play();
  }

  if (keys.right) {
    ball.dx = ball.speed;
  } else if (keys.left) {
    ball.dx = -ball.speed;
  } else {
    ball.dx *= 0.9;
  }

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.y + ball.radius >= canvas.height) {
    ball.y = canvas.height - ball.radius;
    ball.dy = 0;
    ball.grounded = true;
  }

  checkCollisions();
}

function checkCollisions() {
  obstacles.forEach((obstacle) => {
    if (ball.x + ball.radius > obstacle.x && ball.x - ball.radius < obstacle.x + obstacle.width &&
        ball.y + ball.radius > obstacle.y && ball.y - ball.radius < obstacle.y + obstacle.height) {
      if (obstacle.type === "spike" || obstacle.type === "hole" || obstacle.type === "monster") {
        collisionSound.play();
        lives--;
        ball.emotion = "sad";
        if (lives <= 0) {
          gameOver();
        } else {
          lifeLostSound.play();
          resetBall();
        }
      }
    }
  });
}

function createObstacle() {
  const type = Math.random() < 0.3 ? "monster" : Math.random() < 0.5 ? "spike" : Math.random() < 0.8 ? "hole" : "block";
  const width = type === "spike" ? 30 : type === "hole" ? 100 : type === "monster" ? 50 : 50;
  const height = type === "spike" ? 40 : type === "hole" ? 60 : type === "monster" ? 50 : 20;
  const x = canvas.width;
  const y = type === "monster" ? canvas.height - height - 10 : canvas.height - height;
  obstacles.push({ type, x, y, width, height });
}

function moveObstacles() {
  obstacles.forEach((obstacle) => {
    obstacle.x -= speed;

    if (obstacle.x + obstacle.width < 0) {
      score += 100;
      scoreSound.play();
      obstacles.splice(obstacles.indexOf(obstacle), 1);

      // Speed increases every 1000 points
      if (score % 1000 === 0) {
        speed += 1;
        changeBackground();
      }
    }
  });
}

function changeBackground() {
  const backgrounds = ["daytime", "nighttime", "garden", "snow"];
  currentBackground = backgrounds[(Math.floor(score / 1000) - 1) % backgrounds.length];
  updateBackgroundStyle();
}

function updateBackgroundStyle() {
  switch (currentBackground) {
    case "daytime":
      canvas.style.background = "#81BFDA"; // Sky blue
      break;
    case "nighttime":
      canvas.style.background = "#074799"; // Dark blue
      break;
    case "garden":
      canvas.style.background = "#D6CFB4"; // Green
      break;
    case "snow":
      canvas.style.background = "#E5D9F2"; // White
      break;
  }
}

function resetBall() {
  ball.x = 50;
  ball.y = canvas.height - 30;
  ball.dy = 0;
  ball.grounded = false;
  ball.emotion = "sad";
}

function gameOver() {
  gameRunning = false;
  document.getElementById("gameOverScreen").style.display = "block";
  document.getElementById("gameOverPlayer").textContent = playerName;
  document.getElementById("currentScore").textContent = score;
  document.getElementById("highScore").textContent = highScore;
  document.getElementById("currentLives").textContent = lives;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBall();
  moveObstacles();
  drawObstacles();
  drawScore();
  updateBall();

  const now = Date.now();
  if (now - lastObstacleTime > obstacleFrequency) {
    createObstacle();
    lastObstacleTime = now;
  }

  if (!isPaused) {
    requestAnimationFrame(gameLoop);
  }
}

// Event listeners for controls
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") keys.up = true;
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp") keys.up = false;
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
});

// Start button logic
document.getElementById("startButton").addEventListener("click", () => {
  playerName = document.getElementById("playerName").value;
  if (playerName === "") playerName = "Player";
  document.getElementById("startScreen").style.display = "none";
  gameRunning = true;
  gameLoop();
});

// Play again button
document.getElementById("playAgainButton").addEventListener("click", () => {
  // Reset the game state
  score = 0;
  lives = 3;
  obstacles = [];
  speed = 4;
  currentMilestone = 0;

  // Hide the game over screen
  document.getElementById("gameOverScreen").style.display = "none";

  // Start the game
  gameRunning = true;
  gameLoop();
});
