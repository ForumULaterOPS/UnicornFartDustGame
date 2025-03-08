const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const soundEffects = document.getElementById('soundEffects');
soundEffects.loop = true;
const trumpet = document.getElementById('trumpet');
const fartSound = new Audio('assets/fart.mp3');
const fanfareSound = new Audio('assets/fanfare.mp3');

const unicornImg = new Image(); unicornImg.src = 'assets/unicorn.png';
const dustImg = new Image(); dustImg.src = 'assets/dust.png';
const wordsImg = new Image(); wordsImg.src = 'assets/words.png';

const soundEffectsMap = {
    'pop': 0,
    'whizz': 2,
    'fizzle': 4,
    'bang': 6
};

const player = {
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    angle: 0,
    farting: false,
    direction: 'right',
    shiftX: 0,
    shiftY: 0,
    shiftDuration: 0,
    flipped: false
};

const dustParticles = [];
const dustPixels = [];
let dustCount = 0;
let clicks = 0;
let isDarkMode = true;
let showLeaderboard = false;
let isMuted = false;
let lastClickTime = Date.now();
const idleTimeout = 3000;
let clickState = 0;
let lastFanfareDust = 0;

const skyColorLight = '#4682B4';
const skyColorDark = '#1a1a2e';
const cloudColorLight = '#FFFFFF';
const cloudColorDark = '#4A4A4A';

function resizeCanvas() {
    const vw = Math.min(window.innerWidth, 800);
    const vh = Math.min(window.innerHeight, 600);
    canvas.width = vw;
    canvas.height = vh;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawBackground() {
    ctx.fillStyle = isDarkMode ? skyColorDark : skyColorLight;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isDarkMode) {
        const gradient1 = ctx.createRadialGradient(100, 100, 0, 100, 100, 50);
        gradient1.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
        gradient1.addColorStop(0.2, 'rgba(255, 165, 0, 0.7)');
        gradient1.addColorStop(0.4, 'rgba(255, 255, 0, 0.6)');
        gradient1.addColorStop(0.6, 'rgba(0, 255, 0, 0.5)');
        gradient1.addColorStop(0.8, 'rgba(0, 0, 255, 0.4)');
        gradient1.addColorStop(1, 'rgba(75, 0, 130, 0.3)');
        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.arc(100, 100, 40, 0, Math.PI * 2);
        ctx.arc(140, 110, 30, 0, Math.PI * 2);
        ctx.arc(80, 110, 30, 0, Math.PI * 2);
        ctx.fill();

        const gradient2 = ctx.createRadialGradient(350, 150, 0, 350, 150, 60);
        gradient2.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
        gradient2.addColorStop(0.2, 'rgba(255, 165, 0, 0.7)');
        gradient2.addColorStop(0.4, 'rgba(255, 255, 0, 0.6)');
        gradient2.addColorStop(0.6, 'rgba(0, 255, 0, 0.5)');
        gradient2.addColorStop(0.8, 'rgba(0, 0, 255, 0.4)');
        gradient2.addColorStop(1, 'rgba(75, 0, 130, 0.3)');
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.arc(350, 150, 50, 0, Math.PI * 2);
        ctx.arc(390, 160, 35, 0, Math.PI * 2);
        ctx.arc(320, 160, 30, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = cloudColorLight;
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
}

function drawUnicorn() {
    ctx.save();
    ctx.translate(player.x + player.width / 2 + player.shiftX, player.y + player.height / 2 + player.shiftY);
    ctx.rotate(player.angle);
    if (player.direction === 'left') ctx.scale(-1, 1);

    if (clickState >= 1 && dustImg.complete) ctx.drawImage(dustImg, -player.width / 2, -player.height / 2, player.width, player.height);
    if (unicornImg.complete) {
        ctx.save();
        if (player.flipped) ctx.scale(-1, 1);
        ctx.drawImage(unicornImg, -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();
    }
    if (clickState === 2 && wordsImg.complete) ctx.drawImage(wordsImg, -player.width / 2, -player.height / 2, player.width, player.height);

    ctx.restore();
    if (player.shiftDuration > 0) {
        player.shiftDuration -= 1 / 60;
        if (player.shiftDuration <= 0) {
            player.shiftX = 0;
            player.shiftY = 0;
            player.angle = 0;
            player.flipped = false;
        }
    }
}

function drawDust() {
    dustParticles.forEach((dust, index) => {
        if (dust.visible) {
            let color;
            switch (dust.value) {
                case 1: color = 'rgba(128, 0, 128, 0.8)'; break;
                case 2: color = 'rgba(0, 128, 0, 0.8)'; break;
                case 3: color = 'rgba(255, 215, 0, 0.8)'; break;
            }
            ctx.fillStyle = color;
            ctx.beginPath();
            const radius = dust.width * (dust.growth / dust.maxGrowth);
            ctx.arc(dust.x, dust.y, radius, 0, Math.PI * 2);
            ctx.fill();
            dust.growth += 0.5;
            dust.timeLeft -= 1 / 60;
            if (dust.growth >= dust.maxGrowth || dust.timeLeft <= 0) dust.visible = false;
        }
    });

    dustPixels.forEach((pixel, index) => {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(pixel.x, pixel.y, 5, 5);
        pixel.x += pixel.vx;
        pixel.y += pixel.vy;
        pixel.timeLeft -= 1 / 60;
        if (pixel.timeLeft <= 0) dustPixels.splice(index, 1);
    });
}

function explodeDust(x, y, value) {
    const pixelCount = 15;
    let color;
    switch (value) {
        case 1: color = 'rgba(128, 0, 128, 0.8)'; break;
        case 2: color = 'rgba(0, 128, 0, 0.8)'; break;
        case 3: color = 'rgba(255, 215, 0, 0.8)'; break;
    }
    for (let i = 0; i < pixelCount; i++) {
        dustPixels.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            color: color,
            timeLeft: 0.5
        });
    }
}

function drawBanner() {
    const text = "Unicorn Fart Dust";
    const centerX = canvas.width / 2;
    const centerY = player.y - 7;
    const radius = 150;
    ctx.font = 'bold 40px "Bubblegum Sans"';
    ctx.textAlign = 'center';

    const gradient = ctx.createLinearGradient(centerX - 150, 0, centerX + 150, 0);
    gradient.addColorStop(0, '#FF69B4');
    gradient.addColorStop(0.2, '#FF4500');
    gradient.addColorStop(0.4, '#FFD700');
    gradient.addColorStop(0.6, '#00FF7F');
    gradient.addColorStop(0.8, '#1E90FF');
    gradient.addColorStop(1, '#9400D3');

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

function drawLeaderboard() {
    if (showLeaderboard) {
        ctx.fillStyle = isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Leaderboard', canvas.width / 2, canvas.height / 4 + 30);

        const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
        leaderboard.sort((a, b) => b.score - a.score).slice(0, 10).forEach((entry, index) => {
            ctx.fillText(`${index + 1}. ${entry.score} (Clicks: ${entry.clicks})`, canvas.width / 2, canvas.height / 4 + 60 + index * 30);
        });

        ctx.font = '16px Arial';
        ctx.fillText('Click to Close', canvas.width / 2, canvas.height / 4 + canvas.height / 2 - 20);
    }
}

function playSoundEffect(effectName) {
    if (!isMuted && soundEffectsMap[effectName] !== undefined) {
        soundEffects.pause();
        soundEffects.currentTime = soundEffectsMap[effectName];
        soundEffects.play();
    }
}

function playFullSoundtrack() {
    if (!isMuted) {
        soundEffects.pause();
        soundEffects.currentTime = 0;
        soundEffects.play();
    }
}

function generateDust() {
    const dustCountLocal = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < dustCountLocal; i++) {
        const dust = {
            width: 40,
            height: 40,
            visible: true,
            timeLeft: 2,
            growth: 10,
            maxGrowth: Math.random() * 40 + 30,
            value: 1,
            x: player.x + player.width / 2 + (Math.random() - 0.5) * 150,
            y: player.y + player.height / 2 + (Math.random() - 0.5) * 150
        };

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

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawUnicorn();
    drawDust();
    drawBanner();

    // $UFD Ticker Placeholder (top-right)
    ctx.font = 'bold 24px "Comic Sans MS"';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('$UFD: Coming Soon', canvas.width - 10, 30);

    // UI
    ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Dust: ' + dustCount, 20, 40);
    ctx.fillText('Clicks: ' + clicks, 20, 70);
    ctx.fillText('Leaderboard (L)', canvas.width - 150, canvas.height - 20);
    ctx.fillText(isMuted ? 'Unmute (M)' : 'Mute (M)', canvas.width - 150, canvas.height - 40);

    // UFD Scene Coming Soon (bottom-left)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, canvas.height - 40, 140, 30);
    ctx.font = 'bold 18px "Comic Sans MS"';
    ctx.textAlign = 'left';
    const gradient = ctx.createLinearGradient(15, 0, 145, 0);
    gradient.addColorStop(0, '#FF69B4');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#00FF7F');
    ctx.fillStyle = gradient;
    ctx.fillText("UFD Scene: Soon!", 15, canvas.height - 20);

    drawLeaderboard();

    const currentTime = Date.now();
    if (currentTime - lastClickTime > idleTimeout && !soundEffects.paused && !isMuted) {
        playFullSoundtrack();
    }

    requestAnimationFrame(gameLoop);
}

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
        player.flipped = true;
        generateDust();
        fartSound.play();
        player.shiftX = Math.random() * 10 - 5;
        player.shiftY = -10;
        player.shiftDuration = 0.3;
        player.angle = Math.random() * 0.2 - 0.1;
        clickState = 1;
        setTimeout(() => { clickState = 2; }, 150);
        setTimeout(() => { clickState = 0; }, 300);
        playSoundEffect('pop');
    } else {
        for (let i = dustParticles.length - 1; i >= 0; i--) {
            const dust = dustParticles[i];
            if (dust.visible && x >= dust.x - dust.width && x <= dust.x + dust.width && y >= dust.y - dust.height && y <= dust.y + dust.height) {
                dustCount += dust.value;
                explodeDust(dust.x, dust.y, dust.value);
                ctx.font = '20px Arial';
                ctx.fillStyle = '#ffcc00';
                ctx.fillText(`+${dust.value} Dust`, dust.x, dust.y - 20);
                setTimeout(() => { }, 500);
                dustParticles.splice(i, 1);
                playSoundEffect('pop');
                if (dustCount >= 100 && dustCount - dust.value < 100 && !isMuted) {
                    fanfareSound.play();
                }
                updateLeaderboard(dustCount, clicks);
                break;
            }
        }
    }
});

document.getElementById('darkModeToggle').addEventListener('click', function () {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    lastClickTime = Date.now();
});

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

function updateLeaderboard(newScore, newClicks) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.push({ score: newScore, clicks: newClicks });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

unicornImg.onload = function () {
    gameLoop();
};

dustImg.onerror = () => console.log('Dust image failed to load');
wordsImg.onerror = () => console.log('Words image failed to load');

window.addEventListener('load', () => {
    trumpet.play().catch(() => console.log('Trumpet blocked—click to play'));
});
