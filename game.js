const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const soundEffects = document.getElementById('soundEffects');

const unicornImg = new Image();
unicornImg.src = 'assets/unicorn.png';

const soundEffectsMap = {
    'pop': 0,
    'whizz': 2,
    'fizzle': 4,
    'bang': 6
};

const player = {
    x: canvas.width / 2 - 100,
    y: canvas.height / 2 - 100,
    width: 200,
    height: 200,
    angle: 0,
    farting: false,
    direction: 'right',
    shiftX: 0,
    shiftY: 0,
    shiftDuration: 0
};

const dustParticles = [];
let score = 0;
let clicks = 0;
let isDarkMode = false;
let showLeaderboard = false;
let isMuted = false;
let lastClickTime = Date.now();
const idleTimeout = 3000;

const skyColorLight = '#B0E0FF';
const skyColorDark = '#1a1a2e';
const cloudColorLight = '#FFFFFF';
const cloudColorDark = '#4A4A4A';

// Draw background with clouds
function drawBackground() {
    ctx.fillStyle = isDarkMode ? skyColorDark : skyColorLight;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = isDarkMode ? cloudColorDark : cloudColorLight;
    ctx.beginPath();
    ctx.arc(100, 100, 40, 0, Math.PI * 2);
    ctx.arc(140, 110, 30, 0, Math.PI * 2);
    ctx.arc(80, 110, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(350, 150, 50, 0, Math.PI * 2);
    ctx.arc(390, 160, 35, 0, Math.PI * 2);
    ctx.arc(320, 160, 30, 0, Math.PI * 2);
    ctx.fill();
}

// Draw unicorn with shift effect
function drawUnicorn() {
    ctx.save();
    ctx.translate(player.x + player.width / 2 + player.shiftX, player.y + player.height / 2 + player.shiftY);
    ctx.rotate(player.angle);

    if (player.direction === 'left') {
        ctx.scale(-1, 1);
    }

    ctx.drawImage(unicornImg, -player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();

    if (player.shiftDuration > 0) {
        player.shiftDuration -= 1 / 60;
        if (player.shiftDuration <= 0) {
            player.shiftX = 0;
            player.shiftY = 0;
            player.angle = 0;
        }
    }
}

// Draw dust particles
function drawDust() {
    dustParticles.forEach((dust, index) => {
        if (dust.visible) {
            let color;
            switch (dust.value) {
                case 1: color = 'rgba(128,128,128,0.8)'; break;
                case 2: color = 'rgba(0,128,0,0.8)'; break;
                case 3: color = 'rgba(255,215,0,0.8)'; break;
            }
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(dust.x, dust.y, dust.width * (dust.timeLeft / dust.maxTime), 0, Math.PI * 2);
            ctx.fill();
            dust.timeLeft -= 1 / 60;
            if (dust.timeLeft <= 0) {
                dustParticles.splice(index, 1);
            }
        }
    });
}

// Draw arched rainbow banner with bubble-like letters
function drawBanner() {
    const text = "Unicorn Fart Dust";
    const centerX = canvas.width / 2;
    const centerY = player.y - 7;
    const radius = 150;
    ctx.font = 'bold 36px "Comic Sans MS"';
    ctx.textAlign = 'center';

    const gradient = ctx.createLinearGradient(centerX - 120, 0, centerX + 120, 0);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(0.2, 'orange');
    gradient.addColorStop(0.4, 'yellow');
    gradient.addColorStop(0.6, 'green');
    gradient.addColorStop(0.8, 'blue');
    gradient.addColorStop(1, 'violet');

    ctx.fillStyle = gradient;
    ctx.save();
    ctx.translate(centerX, centerY);
    for (let i = 0; i < text.length; i++) {
        const angle = (i - text.length / 2) * (Math.PI / (text.length + 4));
        const x = radius * Math.sin(angle);
        const y = -radius * Math.cos(angle);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
    }
    ctx.restore();
}

// Draw leaderboard
function drawLeaderboard() {
    if (showLeaderboard) {
        ctx.fillStyle = isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Leaderboard', canvas.width / 2, canvas.height / 4 + 30);

        const scores = JSON.parse(localStorage.getItem('leaderboardScores')) || [];
        scores.sort((a, b) => b - a).slice(0, 10).forEach((score, index) => {
            ctx.fillText(`${index + 1}. ${score}`, canvas.width / 2, canvas.height / 4 + 60 + index * 30);
        });

        ctx.font = '16px Arial';
        ctx.fillText('Click to Close', canvas.width / 2, canvas.height / 4 + canvas.height / 2 - 20);
    }
}

// Play sound effect with mute check
function playSoundEffect(effectName) {
    if (!isMuted && soundEffectsMap[effectName] !== undefined) {
        soundEffects.pause();
        soundEffects.currentTime = soundEffectsMap[effectName];
        soundEffects.play();
    }
}

// Play full soundtrack when idle
function playFullSoundtrack() {
    if (!isMuted) {
        soundEffects.pause();
        soundEffects.currentTime = 0;
        soundEffects.play();
    }
}

// Generate multiple dust particles with side-heavy spawn zones
function generateDust() {
    const dustCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < dustCount; i++) {
        const dust = {
            width: 20,
            height: 20,
            visible: true,
            timeLeft: Math.random() * 1 + 0.3,
            maxTime: Math.random() * 1 + 0.3,
            value: 1
        };

        const randZone = Math.random();
        if (randZone < 0.4) { // Left side (40% chance)
            dust.x = player.x - (Math.random() * 40 + 20);
            dust.y = player.y + player.height / 2 + (Math.random() * 60 - 30);
        } else if (randZone < 0.8) { // Right side (40% chance)
            dust.x = player.x + player.width + (Math.random() * 40 + 20);
            dust.y = player.y + player.height / 2 + (Math.random() * 60 - 30);
        } else if (randZone < 0.9) { // Top (10% chance)
            dust.x = player.x + player.width / 2 + (Math.random() * 40 - 20);
            dust.y = player.y - (Math.random() * 40 + 20);
        } else { // Bottom (10% chance)
            dust.x = player.x + player.width / 2 + (Math.random() * 40 - 20);
            dust.y = player.y + player.height + (Math.random() * 40 + 20);
        }

        const rand = Math.random();
        if (rand < 0.5) dust.value = 1;
        else if (rand < 0.75) dust.value = 2;
        else dust.value = 3;

        dustParticles.push(dust);
    }

    setTimeout(() => {
        player.farting = false;
    }, 200);
}

// Game loop with idle check
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawUnicorn();
    drawDust();
    drawBanner();

    ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 20, 40);
    ctx.fillText('Clicks: ' + clicks, 20, 70);
    ctx.fillText('Leaderboard (L)', canvas.width - 150, canvas.height - 20);
    ctx.fillText(isMuted ? 'Unmute (M)' : 'Mute (M)', canvas.width - 150, canvas.height - 40);

    drawLeaderboard();

    const currentTime = Date.now();
    if (currentTime - lastClickTime > idleTimeout && !soundEffects.paused && !isMuted) {
        playFullSoundtrack();
    }

    requestAnimationFrame(gameLoop);
}

// Click event with unicorn shift, sound, and leaderboard/mute toggles
canvas.addEventListener('click', function (event) {
    clicks++;
    lastClickTime = Date.now();
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    if (x >= canvas.width - 150 && x <= canvas.width - 10 && y >= canvas.height - 30 && y <= canvas.height - 10) {
        showLeaderboard = !showLeaderboard;
        return;
    }

    if (x >= canvas.width - 150 && x <= canvas.width - 10 && y >= canvas.height - 50 && y <= canvas.height - 30) {
        isMuted = !isMuted;
        if (isMuted) soundEffects.pause();
        return;
    }

    if (showLeaderboard) {
        showLeaderboard = false;
        return;
    }

    if (!player.farting) {
        player.farting = true;
        generateDust();

        player.shiftX = Math.random() * 10 - 5;
        player.shiftY = -10;
        player.shiftDuration = 0.3;
        player.angle = Math.random() * 0.2 - 0.1;

        const soundEffectsArray = ['pop', 'whizz', 'fizzle', 'bang'];
        const randSound = Math.random();
        let soundEffect = 'pop';
        if (randSound < 0.5) soundEffect = 'pop';
        else soundEffect = soundEffectsArray[Math.floor((randSound - 0.5) * 6) + 1];
        playSoundEffect(soundEffect);
    } else {
        for (let i = dustParticles.length - 1; i >= 0; i--) {
            const dust = dustParticles[i];
            if (dust.visible && x >= dust.x - dust.width && x <= dust.x + dust.width && y >= dust.y - dust.height && y <= dust.y + dust.height) {
                score += dust.value;
                dustParticles.splice(i, 1);
                playSoundEffect('pop');
                updateLeaderboard(score);
                break;
            }
        }
    }
});

// Dark mode toggle
document.getElementById('darkModeToggle').addEventListener('click', function () {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    lastClickTime = Date.now();
});

// Key controls for leaderboard and mute
document.addEventListener('keydown', (event) => {
    if (event.key === 'l') {
        showLeaderboard = !showLeaderboard;
        lastClickTime = Date.now();
    }
    if (event.key === 'm') {
        isMuted = !isMuted;
        if (isMuted) soundEffects.pause();
        lastClickTime = Date.now();
    }
});

// Leaderboard functions
function updateLeaderboard(newScore) {
    let scores = JSON.parse(localStorage.getItem('leaderboardScores')) || [];
    scores.push(newScore);
    scores.sort((a, b) => b - a);
    scores = scores.slice(0, 10);
    localStorage.setItem('leaderboardScores', JSON.stringify(scores));
}

// Start game only after image is loaded
unicornImg.onload = function () {
    gameLoop();
};