const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const soundEffects = document.getElementById('soundEffects');
const backgroundMusic1 = new Audio('assets/music1.mp3'); // 0-9s
const backgroundMusic2 = new Audio('assets/music2.mp3'); // 5-9s
backgroundMusic1.volume = 0;
backgroundMusic2.volume = 0;
backgroundMusic2.loop = true;
let musicStarted = false;

backgroundMusic1.addEventListener('ended', () => {
    backgroundMusic1.pause();
    backgroundMusic2.play().catch(err => console.error('Music2 blocked:', err));
    musicStarted = true;
});

const fartSound = new Audio('assets/fart.mp3');
const fanfareSound = new Audio('assets/fanfare.mp3');
const giggleSound = new Audio('assets/giggle.mp3');
const oddFartSound = new Audio('assets/oddfart.mp3');

const unicornImg = new Image(); unicornImg.src = 'assets/unicorn.png';
const dustImg = new Image(); dustImg.src = 'assets/dust.png';
const wordsImg = new Image(); wordsImg.src = 'assets/words.png';
const artBackgrounds = [
    new Image(), new Image(), new Image()
];
artBackgrounds[0].src = 'assets/ufd-art1.png';
artBackgrounds[1].src = 'assets/ufd-art2.png';
artBackgrounds[2].src = 'assets/ufd-art3.png';
let artLoaded = [false, false, false];
let currentArtIndex = 0;
const artPattern = [0, 1, 0, 1, 2, 1, 2, 1, 2];
let artPatternIndex = 0;

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
let lastFanfareDust = 0;
let useArtBackground = false;
let playerName = localStorage.getItem('playerName') || null;
// localStorage.removeItem('playerName'); // Uncomment to reset $cashtag
if (!playerName) {
    playerName = prompt('Enter your favorite meme coin $cashtag (e.g., $DOGE):') || '$UNICORN';
    if (playerName.charAt(0) !== '$') playerName = '$' + playerName;
    localStorage.setItem('playerName', playerName);
}

const skyColorLight = '#4682B4';
const skyColorDark = '#1a1a2e';
const cloudColorLight = '#FFFFFF';
const cloudColorDark = '#4A4A4A';

artBackgrounds.forEach((img, index) => {
    img.onload = () => {
        console.log(`Art background ${index + 1} loaded: ${img.src}`);
        artLoaded[index] = true;
    };
    img.onerror = () => {
        console.error(`Art background ${index + 1} failed: ${img.src}`);
        artLoaded[index] = false;
    };
});

soundEffects.addEventListener('canplaythrough', () => {
    if (!isMuted) {
        soundEffects.play().catch(() => console.log('Sound effects blocked'));
        setTimeout(() => soundEffects.pause(), 5000);
    }
}, { once: true });

function swapArt() {
    if (useArtBackground) {
        currentArtIndex = artPattern[artPatternIndex];
        artPatternIndex = (artPatternIndex + 1) % artPattern.length;
    }
    const nextSwap = Math.random() * 400 + 100; // 100-500ms
    setTimeout(swapArt, nextSwap);
}
setTimeout(swapArt, Math.random() * 400 + 100);

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
        .catch(() => {
            document.getElementById('ufdPrice').textContent = 'UFD Price: Error';
        });
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
    stars.forEach(star => {
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
    });
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawBackground() {
    if (useArtBackground && artLoaded[currentArtIndex]) {
        try {
            ctx.drawImage(artBackgrounds[currentArtIndex], 0, 0, canvas.width, canvas.height);
        } catch (e) {
            console.error('Failed to draw art background:', e);
            ctx.fillStyle = isDarkMode ? skyColorDark : skyColorLight;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (isDarkMode) drawStars();
        }
    } else {
        ctx.fillStyle = isDarkMode ? skyColorDark : skyColorLight;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (isDarkMode) drawStars();

        ctx.fillStyle = isDarkMode ? cloudColorDark : cloudColorLight;
        ctx.beginPath();
        ctx.arc(100, 100, 40, 0, Math.PI * 2);
        ctx.arc(140, 110, 30, 0, Math.PI * 2);
        ctx.arc(80, 110, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(350, 150, 40, 0, Math.PI * 2);
        ctx.arc(390, 160, 35, 0, Math.PI * 2);
        ctx.arc(320, 160, 30, 0, Math.PI * 2);
        ctx.fill();
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

function drawDust() {
    dustParticles.forEach((dust, index) => {
        if (dust.visible) {
            let color;
            switch (dust.value) {
                case 3: color = 'rgba(128, 0, 128, 0.8)'; break;
                case 5: color = 'rgba(0, 128, 0, 0.8)'; break;
                case 7: color = 'rgba(218, 165, 32, 0.8)'; break;
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
    const centerY = player.y - 7;
    const radius = 150;
    ctx.font = 'bold 40px "Bubblegum Sans"';
    ctx.textAlign = 'center';
    const gradient = ctx.createLinearGradient(centerX - 150, 0, centerX + 150, 0);
    gradient.addColorStop(0, '#FF69B4');
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
        ctx.fillText('Welcome to the Unicorn Fart Dust Clicker—', canvas.width / 2, canvas.height / 4 + 60);
        ctx.fillText('where magical butts make sparkly bucks.', canvas.width / 2, canvas.height / 4 + 90);
        ctx.fillText('Click that unicorn and rack up some dust!', canvas.width / 2, canvas.height / 4 + 120);
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
        ctx.fillText('Click the unicorn to fart dust (3-5-7 points).', canvas.width / 2, canvas.height / 4 + 60);
        ctx.fillText('Tap the bubbles to score.', canvas.width / 2, canvas.height / 4 + 90);
        ctx.fillText('Mute (M) and Music (N), Dark (D) and Lit (B).', canvas.width / 2, canvas.height / 4 + 120);
        ctx.fillText('Check Leaderboard (L). Fart away!', canvas.width / 2, canvas.height / 4 + 150);
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
        if (musicStarted) {
            backgroundMusic2.play().catch(err => console.error('Music2 blocked:', err));
        } else {
            backgroundMusic1.play().catch(err => console.error('Music1 blocked:', err));
        }
    } else {
        backgroundMusic1.pause();
        backgroundMusic1.currentTime = 0;
        backgroundMusic2.pause();
        backgroundMusic2.currentTime = 0;
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
            value: Math.random() < 0.5 ? 3 : Math.random() < 0.75 ? 5 : 7,
            x: player.x + player.width / 2 + (Math.random() - 0.5) * 150,
            y: player.y + player.height / 2 + (Math.random() - 0.5) * 150
        };
        dustParticles.push(dust);
    }
    setTimeout(() => { player.farting = false; }, 200);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawUnicorn();
    drawDust();
    drawBanner();

    ctx.fillStyle = useArtBackground ? '#000000' : (isDarkMode ? '#FFFFFF' : '#000000');
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(playerName, 20, 40);
    ctx.fillText('Dust: ' + dustCount, 20, 70);
    ctx.fillText('Clicks: ' + clicks, 20, 100);
    ctx.fillText(isMuted ? 'Unmute (M)' : 'Mute (M)', canvas.width - 150, canvas.height - 20);
    ctx.fillText(isMusicOn ? 'Music Off (N)' : 'Music On (N)', canvas.width - 150, canvas.height - 40);
    ctx.fillText(isDarkMode ? 'Light (D)' : 'Dark (D)', canvas.width - 150, canvas.height - 60);
    ctx.fillText(useArtBackground ? 'Sky (B)' : 'Lit Backdrop (B)', canvas.width - 150, canvas.height - 80);
    ctx.fillText('Leaderboard (L)', canvas.width - 150, canvas.height - 100);
    ctx.fillText('Welcome (W)', canvas.width - 150, canvas.height - 120);
    ctx.fillText('Instructions (I)', canvas.width - 150, canvas.height - 140);

    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
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

    if (x >= canvas.width - 150 && x <= canvas.width - 10 && y >= canvas.height - 30 && y <= canvas.height - 10) {
        isMuted = !isMuted;
        if (isMuted) {
            soundEffects.pause();
            backgroundMusic1.pause();
            backgroundMusic2.pause();
            fartSound.pause();
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

    if (!player.farting) {
        player.farting = true;
        player.flipped = true;
        generateDust();
        if (!isMuted && isMusicOn) {
            fartSound.pause();
            fartSound.currentTime = 0;
            fartSound.play().catch(() => console.log('Fart sound blocked'));
            if (!musicStarted) {
                backgroundMusic1.play().catch(err => console.error('Music1 blocked:', err));
                let fadeIn = setInterval(() => {
                    const activeMusic = musicStarted ? backgroundMusic2 : backgroundMusic1;
                    if (activeMusic.volume < 1) {
                        activeMusic.volume = Math.min(1, activeMusic.volume + 0.02);
                    } else {
                        clearInterval(fadeIn);
                    }
                }, 50);
            }
        }
        player.shiftX = Math.random() * 10 - 5;
        player.shiftY = -10;
        player.shiftDuration = 0.3;
        player.angle = Math.random() * 0.2 - 0.1;
        clickState = 1;
        setTimeout(() => { clickState = 2; }, 150);
        setTimeout(() => { clickState = 0; }, 300);
        if (!isMuted) setTimeout(() => playSoundEffect('pop'), 200);
    } else {
        for (let i = dustParticles.length - 1; i >= 0; i--) {
            const dust = dustParticles[i];
            if (dust.visible && x >= dust.x - dust.width && x <= dust.x + dust.width && y >= dust.y - dust.height && y <= dust.y + dust.height) {
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
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'm') {
        isMuted = !isMuted;
        if (isMuted) {
            soundEffects.pause();
            backgroundMusic1.pause();
            backgroundMusic2.pause();
            fartSound.pause();
        } else {
            toggleMusic();
        }
        lastClickTime = Date.now();
    }
    if (event.key === 'n') {
        isMusicOn = !isMusicOn;
        toggleMusic();
        lastClickTime = Date.now();
    }
    if (event.key === 'd') {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        lastClickTime = Date.now();
    }
    if (event.key === 'b') {
        useArtBackground = !useArtBackground;
        lastClickTime = Date.now();
    }
    if (event.key === 'l') {
        showLeaderboard = !showLeaderboard;
        if (showLeaderboard) { showWelcome = false; showInstructions = false; }
        lastClickTime = Date.now();
    }
    if (event.key === 'w') {
        showWelcome = !showWelcome;
        if (showWelcome) { showLeaderboard = false; showInstructions = false; }
        lastClickTime = Date.now();
    }
    if (event.key === 'i') {
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

unicornImg.onload = function () {
    gameLoop();
};
unicornImg.onerror = () => console.error('Unicorn image failed to load');
dustImg.onerror = () => console.error('Dust image failed to load');
wordsImg.onerror = () => console.error('Words image failed to load');
artBackgrounds.forEach((img, i) => img.onerror = () => console.error(`Art ${i + 1} failed to load`));
giggleSound.onerror = () => console.error('Giggle sound failed to load');
oddFartSound.onerror = () => console.error('Odd fart sound failed to load');