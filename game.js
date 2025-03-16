// Sticky_UFD Game - Part 1: First Half
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const soundEffects = document.getElementById('soundEffects');

const backgroundMusic = new Audio('assets/music2.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;
let musicStarted = false;

backgroundMusic.addEventListener('play', () => console.log('Music playing'));
backgroundMusic.addEventListener('error', (e) => console.error('Music error:', e));

const fartSounds = [new Audio('assets/fart.mp3'), new Audio('assets/fart.mp3'), new Audio('assets/fart.mp3')];
let fartIndex = 0;
const fanfareSound = new Audio('assets/fanfare.mp3');
const giggleSound = new Audio('assets/giggle.mp3');
const oddFartSound = new Audio('assets/oddfart.mp3');

const backgroundVideo = document.createElement('video');
backgroundVideo.src = 'assets/dj-bg.mp4';
backgroundVideo.loop = true;
backgroundVideo.muted = true;
backgroundVideo.play().catch(err => console.error('Video blocked:', err));
let videoReady = false;
backgroundVideo.addEventListener('canplaythrough', () => {
    console.log('DJ video ready');
    videoReady = true;
});
backgroundVideo.addEventListener('error', () => console.error('DJ video failed'));

const unicornImg = new Image(); unicornImg.src = 'assets/unicorn.png';
const dustImg = new Image(); dustImg.src = 'assets/dust.png';
const wordsImg = new Image(); wordsImg.src = 'assets/words.png';

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
const stars = [];
let dustCount = 0;
let clicks = 0;
let isDarkMode = true;
let showLeaderboard = false;
let showWelcome = false;
let showInstructions = false;
let isMuted = false;
let isMusicOn = true;
let lastClickTime = Date.now();
const idleTimeout = 3000;
let clickState = 0;
let useArtBackground = false;
let playerName = localStorage.getItem('playerName') || null;
if (!playerName) {
    playerName = prompt('Enter your fave meme coin $cashtag (e.g., $DOGE):') || '$UNICORN';
    if (playerName.charAt(0) !== '$') playerName = '$' + playerName;
    localStorage.setItem('playerName', playerName);
}

const skyColorLight = '#4682B4';
const skyColorDark = '#1a1a2e';
const cloudColorLight = '#FFFFFF';
const cloudColorDark = '#4A4A4A';

const soundEffectsMap = {
    'pop': 0,
    'whizz': 2,
    'fizzle': 4,
    'bang': 6
};

function initStars() {
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            opacity: Math.random(),
            speed: Math.random() * 0.02 + 0.01
        });
    }
}
initStars();

function fetchUFDPrice() {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=unicorn-fart-dust&vs_currencies=usd')
        .then(response => response.json())
        .then(data => {
            const price = data['unicorn-fart-dust']?.usd || 'N/A';
            document.getElementById('ufdPrice').textContent = `UFD Price: $${price}`;
        })
        .catch(() => document.getElementById('ufdPrice').textContent = 'UFD Price: Error');
}
fetchUFDPrice();
setInterval(fetchUFDPrice, 60000);

function resizeCanvas() {
    const vw = Math.min(window.innerWidth, 800);
    const vh = Math.min(window.innerHeight, 600);
    canvas.width = vw;
    canvas.height = vh;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;
    backgroundVideo.style.width = vw + 'px';
    backgroundVideo.style.height = vh + 'px';
    backgroundVideo.width = vw;
    backgroundVideo.height = vh;
    stars.forEach(star => {
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
    });
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
canvas.focus();

function drawBackground() {
    if (useArtBackground && videoReady) {
        try {
            console.log('Video native:', backgroundVideo.videoWidth, backgroundVideo.videoHeight);
            ctx.drawImage(backgroundVideo, 0, 0, canvas.width, canvas.height);
            backgroundVideo.width = canvas.width;
            backgroundVideo.height = canvas.height;
        } catch (e) {
            console.error('Video draw fail:', e.message, backgroundVideo.readyState);
            ctx.fillStyle = isDarkMode ? skyColorDark : skyColorLight;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (isDarkMode) drawStars();
        }
    } else {
        ctx.fillStyle = isDarkMode ? skyColorDark : skyColorLight;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (isDarkMode) drawStars();
        ctx.fillStyle = isDarkMode ? cloudColorDark : cloudColorLight;

        ctx.save();
        ctx.translate(120, 110);
        ctx.beginPath();
        ctx.arc(-20, -10, 40, 0, Math.PI * 2);
        ctx.arc(20, 0, 30, 0, Math.PI * 2);
        ctx.arc(-40, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(360, 160);
        ctx.beginPath();
        ctx.arc(-10, -10, 40, 0, Math.PI * 2);
        ctx.arc(30, 0, 35, 0, Math.PI * 2);
        ctx.arc(-40, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        star.opacity += star.speed;
        if (star.opacity > 1 || star.opacity < 0) star.speed = -star.speed;
    });
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
    } else {
        ctx.fillStyle = 'gray';
        ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
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

function generateDust() {
    const dustCountLocal = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < dustCountLocal; i++) {
        const dust = {
            width: 40,
            height: 40,
            visible: true,
            timeLeft: 5,
            growth: 10,
            maxGrowth: Math.random() * 40 + 30,
            value: Math.random() < 0.5 ? 3 : Math.random() < 0.75 ? 5 : 7,
            x: player.x + player.width / 2 + (Math.random() - 0.5) * 150,
            y: player.y + player.height / 2 + (Math.random() - 0.5) * 150,
            tentacle: 0,
            driftX: 0, // Reset for sway
            driftY: 0
        };
        dustParticles.push(dust);
    }
    setTimeout(() => { player.farting = false; }, 200);
}

// [Split point — copy up to here for Part 1]
// Sticky_UFD Game - Part 2: Second Half
function drawDust() {
    dustParticles.forEach((dust, index) => {
        if (dust.visible) {
            dust.tentacle += 0.05;
            dust.driftX = Math.sin(dust.tentacle) * 0.5;
            dust.driftY -= 0.1;
            dust.x += dust.driftX;
            dust.y += dust.driftY;
            dust.growth += 0.3;
            dust.timeLeft -= 1 / 60;

            let color;
            switch (dust.value) {
                case 3: color = 'rgba(128, 0, 128, 0.8)'; break;
                case 5: color = 'rgba(0, 128, 0, 0.8)'; break;
                case 7: color = 'rgba(218, 165, 32, 0.8)'; break;
            }
            ctx.fillStyle = color;
            ctx.save();
            ctx.translate(dust.x, dust.y);
            ctx.scale(1 + Math.sin(dust.tentacle) * 0.5, 1 + Math.cos(dust.tentacle) * 0.5);
            ctx.beginPath();
            const baseRadius = dust.width * (dust.growth / dust.maxGrowth);
            ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (dust.growth >= dust.maxGrowth || dust.timeLeft <= 0) dust.visible = false;
        }
    });

    dustPixels.forEach((pixel, index) => {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(pixel.x, pixel.y, 8, 8);
        pixel.x += pixel.vx;
        pixel.y += pixel.vy;
        pixel.timeLeft -= 1 / 60;
        if (pixel.timeLeft <= 0) dustPixels.splice(index, 1);
    });
}

function explodeDust(x, y, value) {
    const pixelCount = 30;
    let color;
    switch (value) {
        case 3: color = 'rgba(128, 0, 128, 0.8)'; break;
        case 5: color = 'rgba(0, 128, 0, 0.8)'; break;
        case 7: color = 'rgba(218, 165, 32, 0.8)'; break;
    }
    for (let i = 0; i < pixelCount; i++) {
        dustPixels.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            color: color,
            timeLeft: 0.5
        });
    }
}

function drawBanner() {
    const text = "Unicorn Fart Dust";
    const centerX = canvas.width / 2;
    const centerY = player.y + 50;
    const radius = 160;
    ctx.font = 'bold 48px "Bubblegum Sans"';
    ctx.textAlign = 'center';
    const gradient = ctx.createLinearGradient(centerX - 200, 0, centerX + 200, 0);
    gradient.addColorStop(0, '#FF99CC');
    gradient.addColorStop(1, '#CC00FF');
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#FFFFFF';
    ctx.save();
    ctx.translate(centerX, centerY);
    for (let i = 0; i < text.length; i++) {
        const angle = (i - text.length / 2) * (Math.PI / (text.length + 4));
        const x = radius * Math.sin(angle);
        const y = -radius * Math.cos(angle);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.strokeText(text[i], 0, 0);
        ctx.fillStyle = gradient;
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
            ctx.fillText(`${index + 1}. ${playerName} - ${entry.score} (Clicks: ${entry.clicks})`, canvas.width / 2, canvas.height / 4 + 60 + index * 30);
        });
        ctx.font = '16px Arial';
        ctx.fillText('Click to Close', canvas.width / 2, canvas.height / 4 + canvas.height / 2 - 20);
    }
}

function drawWelcome() {
    if (showWelcome) {
        ctx.fillStyle = isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Howdy, Fart Dust Fanatic!', canvas.width / 2, canvas.height / 4 + 30);
        ctx.font = '16px Arial';
        ctx.fillText('Welcome to the UFD Clicker—', canvas.width / 2, canvas.height / 4 + 60);
        ctx.fillText('magic butts, sparkly bucks.', canvas.width / 2, canvas.height / 4 + 90);
        ctx.fillText('Click that unicorn!', canvas.width / 2, canvas.height / 4 + 120);
        ctx.fillText('Click to Close (W)', canvas.width / 2, canvas.height / 4 + canvas.height / 2 - 20);
    }
}

function drawInstructions() {
    if (showInstructions) {
        ctx.fillStyle = isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Instructions', canvas.width / 2, canvas.height / 4 + 30);
        ctx.font = '16px Arial';
        ctx.fillText('Click unicorn to fart dust (3-5-7).', canvas.width / 2, canvas.height / 4 + 60);
        ctx.fillText('Tap bubbles to score.', canvas.width / 2, canvas.height / 4 + 90);
        ctx.fillText('Mute (M), Music (N), Dark (D), Lit (B).', canvas.width / 2, canvas.height / 4 + 120);
        ctx.fillText('Leaderboard (L). Fart away!', canvas.width / 2, canvas.height / 4 + 150);
        ctx.fillText('Click to Close (I)', canvas.width / 2, canvas.height / 4 + canvas.height / 2 - 20);
    }
}

function playSoundEffect(effectName) {
    if (!isMuted && soundEffectsMap[effectName] !== undefined) {
        soundEffects.currentTime = soundEffectsMap[effectName];
        soundEffects.play().catch(() => console.log('Sound effect blocked'));
    }
}

function toggleMusic() {
    if (isMusicOn && !isMuted) {
        if (!musicStarted) {
            backgroundMusic.play().catch(err => console.error('Music blocked:', err));
            musicStarted = true;
        }
    } else {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        musicStarted = false;
    }
}

function playRandomGiggleFart() {
    if (!isMuted) {
        giggleSound.play().catch(() => console.log('Giggle blocked'));
        setTimeout(() => oddFartSound.play().catch(() => console.log('Odd fart blocked')), 500);
    }
    const nextDelay = Math.floor(Math.random() * (21000 - 7000 + 1)) + 7000;
    setTimeout(() => {
        const currentTime = Date.now();
        if (currentTime - lastClickTime > idleTimeout) playRandomGiggleFart();
    }, nextDelay);
}

setTimeout(() => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime > idleTimeout) playRandomGiggleFart();
}, Math.floor(Math.random() * (21000 - 7000 + 1)) + 7000);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawUnicorn();
    drawDust();
    drawBanner();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 100);
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 200, 100);
    const gradient = ctx.createLinearGradient(20, 0, 220, 0);
    gradient.addColorStop(0, '#FF99CC');
    gradient.addColorStop(1, '#CC00FF');
    ctx.fillStyle = gradient;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(playerName, 20, 40);
    ctx.fillText('Dust: ' + dustCount, 20, 70);
    ctx.fillText('Clicks: ' + clicks, 20, 100);

    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    const actions = [
        isMuted ? 'Unmute (M)' : 'Mute (M)',
        isMusicOn ? 'Music Off (N)' : 'Music On (N)',
        isDarkMode ? 'Light (D)' : 'Dark (D)',
        useArtBackground ? 'Sky (B)' : 'Lit Backdrop (B)',
        'Leaderboard (L)',
        'Welcome (W)',
        'Instructions (I)'
    ];
    for (let i = 0; i < actions.length; i++) {
        ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
        ctx.strokeStyle = isDarkMode ? '#000000' : '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeText(actions[i], canvas.width - 150, canvas.height - 20 - i * 20);
        ctx.fillText(actions[i], canvas.width - 150, canvas.height - 20 - i * 20);
    }

    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#000000';
    ctx.fillText('unicornfartdust.com', canvas.width / 2, canvas.height - 20);

    drawLeaderboard();
    drawWelcome();
    drawInstructions();

    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', function (event) {
    clicks++;
    lastClickTime = Date.now();
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    console.log('Click at:', x, y);

    if (x >= canvas.width - 150 && x <= canvas.width - 10 && y >= canvas.height - 30 && y <= canvas.height - 10) {
        isMuted = !isMuted;
        if (isMuted) {
            soundEffects.pause();
            backgroundMusic.pause();
            fartSounds[0].pause(); fartSounds[1].pause(); fartSounds[2].pause();
        } else {
            toggleMusic();
        }
        return;
    }
    if (x >= canvas.width - 150 && x <= canvas.width - 10 && y >= canvas.height - 50 && y <= canvas.height - 30) {
        isMusicOn = !isMusicOn;
        toggleMusic();
        return;
    }
    if (x >= canvas.width - 150 && x <= canvas.width - 10 && y >= canvas.height - 70 && y <= canvas.height - 50) {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        return;
    }
    if (x >= canvas.width - 150 && x <= canvas.width - 10 && y >= canvas.height - 90 && y <= canvas.height - 70) {
        useArtBackground = !useArtBackground;
        return;
    }
    if (x >= canvas.width - 150 && x <= canvas.width - 10 && y >= canvas.height - 110 && y <= canvas.height - 90) {
        showLeaderboard = !showLeaderboard;
        if (showLeaderboard) { showWelcome = false; showInstructions = false; }
        return;
    }
    if (x >= canvas.width - 150 && x <= canvas.width - 10 && y >= canvas.height - 130 && y <= canvas.height - 110) {
        showWelcome = !showWelcome;
        if (showWelcome) { showLeaderboard = false; showInstructions = false; }
        return;
    }
    if (x >= canvas.width - 150 && x <= canvas.width - 10 && y >= canvas.height - 150 && y <= canvas.height - 130) {
        showInstructions = !showInstructions;
        if (showInstructions) { showLeaderboard = false; showWelcome = false; }
        return;
    }
    if (x >= canvas.width / 2 - 100 && x <= canvas.width / 2 + 100 && y >= canvas.height - 30 && y <= canvas.height - 10) {
        window.open('https://unicornfartdust.com', '_blank');
        return;
    }
    if (showLeaderboard || showWelcome || showInstructions) {
        showLeaderboard = false;
        showWelcome = false;
        showInstructions = false;
        return;
    }

    player.farting = true;
    generateDust();
    if (!isMuted && isMusicOn) {
        fartSounds[fartIndex].pause();
        fartSounds[fartIndex].currentTime = 0;
        fartSounds[fartIndex].play().catch(() => console.log('Fart blocked'));
        fartIndex = (fartIndex + 1) % 3;
        if (!musicStarted) {
            console.log('Starting Music');
            backgroundMusic.play().catch(err => console.error('Music blocked:', err));
            musicStarted = true;
        }
    }
    player.shiftX = Math.random() * 10 - 5;
    player.shiftY = -10;
    player.shiftDuration = 0.3;
    player.angle = Math.random() * 0.2 - 0.1;
    clickState = 1;
    setTimeout(() => { clickState = 2; }, 150);
    setTimeout(() => { clickState = 0; player.farting = false; }, 300);
    if (!isMuted) setTimeout(() => playSoundEffect('pop'), 200);

    for (let i = dustParticles.length - 1; i >= 0; i--) {
        const dust = dustParticles[i];
        const pulseRadius = dust.width * (dust.growth / dust.maxGrowth);
        if (dust.visible && x >= dust.x - pulseRadius && x <= dust.x + pulseRadius && y >= dust.y - pulseRadius && y <= dust.y + pulseRadius) {
            dustCount += dust.value;
            explodeDust(dust.x, dust.y, dust.value);
            ctx.font = '20px Arial';
            ctx.fillStyle = '#ffcc00';
            ctx.fillText(`+${dust.value} Dust`, dust.x, dust.y - 20);
            dustParticles.splice(i, 1);
            playSoundEffect('pop');
            if (dustCount >= 100 && dustCount - dust.value < 100 && !isMuted) {
                fanfareSound.play().catch(() => console.log('Fanfare blocked'));
            }
            updateLeaderboard(dustCount, clicks);
            break;
        }
    }
});

document.addEventListener('keydown', (event) => {
    console.log('Key pressed:', event.key);
    const key = event.key.toLowerCase();
    if (key === 'm') {
        isMuted = !isMuted;
        if (isMuted) {
            soundEffects.pause();
            backgroundMusic.pause();
            fartSounds[0].pause(); fartSounds[1].pause(); fartSounds[2].pause();
        } else {
            toggleMusic();
        }
        lastClickTime = Date.now();
    }
    if (key === 'n') {
        isMusicOn = !isMusicOn;
        toggleMusic();
        lastClickTime = Date.now();
    }
    if (key === 'd') {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        lastClickTime = Date.now();
    }
    if (key === 'b') {
        useArtBackground = !useArtBackground;
        lastClickTime = Date.now();
    }
    if (key === 'l') {
        showLeaderboard = !showLeaderboard;
        if (showLeaderboard) { showWelcome = false; showInstructions = false; }
        lastClickTime = Date.now();
    }
    if (key === 'w') {
        showWelcome = !showWelcome;
        if (showWelcome) { showLeaderboard = false; showInstructions = false; }
        lastClickTime = Date.now();
    }
    if (key === 'i') {
        showInstructions = !showInstructions;
        if (showInstructions) { showLeaderboard = false; showWelcome = false; }
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

unicornImg.onload = function () { gameLoop(); };
unicornImg.onerror = () => console.error('Unicorn image failed');
dustImg.onerror = () => console.error('Dust image failed');
wordsImg.onerror = () => console.error('Words image failed');