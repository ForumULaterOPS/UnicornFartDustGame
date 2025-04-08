// Sticky_UFD Click Game - Updated Version (April 04, 2025)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const firebaseConfig = {
    apiKey: "AIzaSyAZ6YYV0zRQ74hrJ4HwsMUujk9rLRA8utg",
    authDomain: "unicornclick.firebaseapp.com",
    projectId: "unicornclick",
    storageBucket: "unicornclick.firebasestorage.app",
    messagingSenderId: "1006534504779",
    appId: "1:1006534504779:web:9094a1b10b5dc067ccf8ce",
    measurementId: "G-JDNLXJJ2XJ"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Audio
const musicTracks = [
    new Audio('assets/music1.mp3'),
    new Audio('assets/music2.mp3'),
    new Audio('assets/music3.mp3')
];
let currentMusicIndex = 1;
musicTracks.forEach(track => { track.loop = true; track.volume = 0.5; });
let backgroundMusic = musicTracks[currentMusicIndex];
let musicStarted = false;
const fartSounds = [
    new Audio('assets/fart.mp3'),
    new Audio('assets/fart.mp3'),
    new Audio('assets/fart.mp3')
];
fartSounds.forEach(fart => fart.volume = 0.10);
let fartIndex = 0;
const fanfareSound = new Audio('assets/fanfare.mp3');
const giggleSound = new Audio('assets/giggle.mp3'); giggleSound.volume = 0.10;
const oddFartSound = new Audio('assets/oddfart.mp3'); oddFartSound.volume = 0.10;
const buttercupSound = new Audio('assets/buttercup.mp3');
const diamondHoofSound = new Audio('assets/diamond_hoof.mp3');
const hornTingleSound = new Audio('assets/horn_tingle.mp3');
const feelSomethingSound = new Audio('assets/feel_something.mp3');
const uhOhSound = new Audio('assets/uh_oh.mp3');
const bearomeLaughSound = new Audio('assets/bearome_laugh.mp3');
const hoovesDownSound = new Audio('assets/hooves_down.mp3');
const closeCallSound = new Audio('assets/close_call.mp3');

// Video and Images
const backgroundVideo = document.createElement('video');
let scenes = [
    { type: 'static', name: 'Day', color: '#4682B4' },
    { type: 'static', name: 'Night', color: '#1a1a2e' },
    { type: 'video', name: 'Fartscape 1', src: 'assets/dj-bg.mp4' },
    { type: 'video', name: 'Fartscape 2', src: 'assets/fartscape-4.mp4' },
    { type: 'video', name: 'Fartscape 3', src: 'assets/fartscape-5.mp4' }
];
let chillMode = true;
let currentScene = chillMode ? 1 : 2;
backgroundVideo.src = scenes[currentScene].src || '';
backgroundVideo.loop = true;
backgroundVideo.muted = true;
backgroundVideo.play().catch(err => console.error('Video blocked:', err));
let videoReady = false;
backgroundVideo.addEventListener('canplaythrough', () => { videoReady = true; });

const unicornVideo = document.createElement('video');
unicornVideo.src = 'assets/unicornDance.webm';
unicornVideo.loop = true;
unicornVideo.muted = true;
const restUnicornImg = new Image(); restUnicornImg.src = 'assets/unicorn.png';
const rontoshiSilvermotoImg = new Image(); rontoshiSilvermotoImg.src = 'assets/unicorn_wizard.png';
const bearomeImg = new Image(); bearomeImg.src = 'assets/bearome.png';
const moonPayImg = new Image(); moonPayImg.src = 'assets/MoonPay.png'; moonPayImg.onerror = () => console.log('MoonPay.png not found');
const ledgerImg = new Image(); ledgerImg.src = 'assets/Ledger.png'; ledgerImg.onerror = () => console.log('Ledger.png not found');

// Game State
const player = { x: 0, y: 0, width: 200, height: 200, angle: 0, farting: false, direction: 'right', shiftX: 0, shiftY: 0, shiftDuration: 0, flipped: false, health: 100 };
const dustParticles = [];
const dustPixels = [];
const glitterParticles = [];
const stars = [];
let chillDust = 0;
let gameDust = 0;
let shieldPower = 0;
let collectPower = 0;
const shieldChargeTime = 10;
const collectChargeTime = 15;
let isDarkMode = scenes[currentScene].name === 'Night';
let showLeaderboard = false;
let isLocked = true;
let showRontoshiSilvermoto = false;
let rontoshiStep = 0;
let rontoshiDialogues = [
    "Rontoshi Silvermoto: Welcome Dust Collectors!",
    "Rontoshi Silvermoto: Tap to gather fart dust!",
    "Rontoshi Silvermoto: Shield from Bearome’s thunder!",
    "Rontoshi Silvermoto: Dust Master!"
];
let bearomeThreshold = 200;
let bearomeActive = false;
let bearomeTimer = 0;
let bearomeWarnings = 0;
let shrinkActive = false;
let shrinkDuration = 0;
let shakeTimer = 0;
let isMuted = false;
let isAllMuted = false;
let isMusicOn = true;
let lastClickTime = Date.now();
const idleTimeout = 3000;
let showSettings = false;
let playerName = localStorage.getItem('playerName') || null;
if (!playerName) {
    playerName = prompt('Enter your fave meme coin $cashtag (e.g., $DOGE):') || '$UNICORN';
    if (playerName.charAt(0) !== '$') playerName = '$' + playerName;
    localStorage.setItem('playerName', playerName);
}
let shieldActive = false;
let shieldTimer = 0;
let shieldCharged = false;
let dusterStrength = 0;
let shieldHits = 0;
let hornsUpTimer = 0;
let collectAllReady = false;
let envTimer = 0;
let envMaxDelay = chillMode ? 15 : 25;
let thunderWarning = 0;
let thunderActive = false;
let ufdPrice = 'Loading...';
let currentLevel = chillMode ? 1 : 1;
let moonshotCharge = 0;
const moonshotChargeTime = 23;
let moonshotActive = false;
let moonshotTimer = 0;
let shieldBonusCharge = 0;
let shieldBonusActive = false;
let shieldBonusTimer = 0;
let dustSpawnQueue = [];
let dustSpawnTimer = 0;

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
        .then(data => { ufdPrice = data['unicorn-fart-dust']?.usd ? `UFD: $${data['unicorn-fart-dust'].usd}` : 'UFD: N/A'; })
        .catch(() => ufdPrice = 'UFD: Error');
}
fetchUFDPrice();
setInterval(fetchUFDPrice, 60000);

function resizeCanvas() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = Math.min(vw, 800);
    canvas.height = Math.min(vh, 600);
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;
    const aspectRatio = backgroundVideo.videoWidth / backgroundVideo.videoHeight || 4 / 3;
    if (vw / vh > aspectRatio) {
        backgroundVideo.style.width = `${vw}px`;
        backgroundVideo.style.height = `${vw / aspectRatio}px`;
    } else {
        backgroundVideo.style.width = `${vh * aspectRatio}px`;
        backgroundVideo.style.height = `${vh}px`;
    }
    backgroundVideo.style.left = `${(vw - backgroundVideo.style.width.replace('px', '')) / 2}px`;
    backgroundVideo.style.top = `${(vh - backgroundVideo.style.height.replace('px', '')) / 2}px`;
    stars.forEach(star => {
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
    });
    if (chillMode && currentScene !== 1) {
        currentScene = 1;
        backgroundVideo.pause();
        backgroundVideo.src = '';
        isDarkMode = true;
        document.body.classList.add('dark-mode');
    } else if (!chillMode && currentLevel === 1 && currentScene !== 2) {
        currentScene = 2;
        backgroundVideo.src = scenes[currentScene].src;
        backgroundVideo.play();
        isDarkMode = false;
        document.body.classList.remove('dark-mode');
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let leaderboardData = [];
let dustCollectedLastFrame = 0;

function drawBackground() {
    const scene = scenes[currentScene];
    if (scene.type === 'video' && videoReady && backgroundVideo.readyState >= 2) {
        ctx.drawImage(backgroundVideo,
            -backgroundVideo.style.left.replace('px', '') * (canvas.width / window.innerWidth),
            -backgroundVideo.style.top.replace('px', '') * (canvas.height / window.innerHeight),
            backgroundVideo.style.width.replace('px', '') * (canvas.width / window.innerWidth),
            backgroundVideo.style.height.replace('px', '') * (canvas.height / window.innerHeight));
    } else {
        ctx.fillStyle = scene.color || '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (scene.name === 'Night') drawStars();
        ctx.fillStyle = scene.name === 'Night' ? '#4A4A4A' : '#FFFFFF';
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
    const idleTime = Date.now() - lastClickTime;
    if (idleTime < 3000 && unicornVideo.readyState >= 2) {
        unicornVideo.play().catch(() => { });
        ctx.drawImage(unicornVideo, -player.width / 2, -player.height / 2, player.width, player.height);
    } else if (restUnicornImg.complete) {
        unicornVideo.pause();
        ctx.save();
        if (player.flipped) ctx.scale(-1, 1);
        // Add pulse effect
        const pulse = 1 + Math.sin(Date.now() / 500) * 0.05; // Scale between 0.95 and 1.05
        ctx.scale(pulse, pulse);
        ctx.drawImage(restUnicornImg, -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();
    }
    if (shieldActive || shieldCharged) {
        ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
        ctx.strokeStyle = shieldCharged ? 'rgba(192, 192, 192, 0.9)' : 'rgba(192, 192, 192, 0.7)';
        ctx.lineWidth = shieldCharged ? 10 : 5;
        ctx.beginPath();
        ctx.arc(0, 0, player.width / 2 + 20 + (shieldCharged ? Math.sin(Date.now() / 200) * 5 : 0), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
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

function generateDust(multiplier = 1) {
    const spawnCount = Math.floor(Math.random() * 5) + 3;
    dustSpawnQueue = [];
    for (let i = 0; i < spawnCount * multiplier; i++) {
        dustSpawnQueue.push({
            width: 60, height: 60, visible: true, timeLeft: 30,
            growth: 10, maxGrowth: Math.random() * 40 + 30,
            value: shrinkActive ? 1 : (Math.random() < 0.3 ? 1 : Math.random() < 0.7 ? 2 : 3) * (shieldBonusActive ? 2 : 1),
            health: 2,
            x: player.x + player.width / 2 + (Math.random() - 0.5) * 300,
            y: player.y + player.height / 2 + (Math.random() - 0.5) * 150,
            tentacle: 0, driftX: 0, driftY: 0,
            delay: i * (3 / spawnCount)
        });
    }
    dustSpawnTimer = 0;
    player.farting = false;
}

function updateDustSpawn() {
    dustSpawnTimer += 1 / 60;
    while (dustSpawnQueue.length > 0 && dustSpawnTimer >= dustSpawnQueue[0].delay) {
        dustParticles.push(dustSpawnQueue.shift());
    }
}

function drawDust() {
    dustParticles.forEach((dust, index) => {
        if (dust.visible) {
            dust.tentacle += 0.05;
            const driftScale = chillMode ? 1 : Math.min(1 + (currentLevel - 1) * 0.2, 2);
            const scale = canvas.width / 800;
            dust.driftX = Math.sin(dust.tentacle) * 2 * driftScale * scale;
            dust.driftY = (dust.y < player.y + 50 ? 0.1 : -0.1) + Math.cos(dust.tentacle) * 0.2 * driftScale * scale;
            dust.x += dust.driftX;
            dust.y += dust.driftY;
            dust.growth += 0.2;
            dust.timeLeft -= 1 / 30;
            const baseRadius = dust.width * (dust.growth / dust.maxGrowth);
            let color;
            switch (dust.value / (shieldBonusActive ? 2 : 1)) {
                case 1: color = 'rgba(128, 0, 128, 0.8)'; break;
                case 2: color = 'rgba(0, 128, 0, 0.8)'; break;
                case 3: color = 'rgba(218, 165, 32, 0.8)'; break;
                default: color = 'rgba(128, 0, 128, 0.8)';
            }
            ctx.save();
            ctx.translate(dust.x, dust.y);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
            ctx.fill();
            for (let i = 0; i < 3; i++) {
                const sparkleX = (Math.random() - 0.5) * baseRadius * 2;
                const sparkleY = (Math.random() - 0.5) * baseRadius * 2;
                ctx.fillStyle = 'rgba(255, 255, 255, ' + (Math.random() * 0.5 + 0.5) + ')';
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, Math.random() * 2 + 1, 0, Math.PI * 2);
                ctx.fill();
            }
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
    switch (value / (shieldBonusActive ? 2 : 1)) {
        case 1: color = 'rgba(128, 0, 128, 0.8)'; break;
        case 2: color = 'rgba(0, 128, 0, 0.8)'; break;
        case 3: color = 'rgba(218, 165, 32, 0.8)'; break;
        default: color = 'rgba(128, 0, 128, 0.8)';
    }
    for (let i = 0; i < pixelCount; i++) {
        dustPixels.push({ x, y, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20, color, timeLeft: 0.5 });
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(chillMode ? 'Chill Leaderboard' : 'Game Leaderboard', canvas.width / 2, canvas.height / 4 + 30);
        if (leaderboardData.length === 0) {
            ctx.fillText('Loading...', canvas.width / 2, canvas.height / 4 + 60);
            fetchLeaderboard();
        } else {
            leaderboardData.forEach((entry, i) => {
                ctx.fillText(`${i + 1}. ${entry.name} - ${entry.score}`, canvas.width / 2, canvas.height / 4 + 60 + i * 30);
            });
        }
        ctx.fillText('Click to Close', canvas.width / 2, canvas.height / 4 + canvas.height / 2 - 20);
    }
}

function fetchLeaderboard() {
    db.collection('leaderboard')
        .orderBy('score', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            leaderboardData = [];
            if (querySnapshot.empty) {
                leaderboardData.push({ name: 'No scores yet!', score: '' });
            } else {
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    leaderboardData.push(data);
                });
            }
            if (leaderboardData.length === 0) leaderboardData.push({ name: 'No scores yet!', score: '' });
        })
        .catch(err => console.error('Fetch failed:', err));
}

function updateLeaderboard(newScore) {
    if (newScore > 0 && newScore < 10000) {
        db.collection('leaderboard').doc(playerName + (chillMode ? '_chill' : '_game')).set({
            name: `${playerName} (${chillMode ? 'Chill' : 'L' + currentLevel})`,
            score: newScore,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => console.log('Score saved:', playerName, newScore))
            .catch(err => console.error('Leaderboard error:', err));
    }
}

function toggleMusic() {
    if (isMusicOn && !isAllMuted) {
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
    if (!isMuted && !isAllMuted) {
        giggleSound.play().catch(() => console.log('Giggle blocked'));
        setTimeout(() => oddFartSound.play().catch(() => console.log('Odd fart blocked')), 500);
    }
    const nextDelay = Math.floor(Math.random() * (21000 - 7000 + 1)) + 7000;
    setTimeout(() => {
        if (Date.now() - lastClickTime > idleTimeout) playRandomGiggleFart();
    }, nextDelay);
}

function triggerThunder() {
    if (thunderActive || thunderWarning) return;
    thunderWarning = 1;
    let dustCollected = 0;
    const warningSequence = [
        { delay: 300, warning: 0 },
        { delay: 400, warning: 1 },
        { delay: 600, warning: 0 },
        { delay: 700, warning: 1 },
        { delay: 800, warning: 0 },
        { delay: 900, warning: 1 }
    ];
    warningSequence.forEach(({ delay, warning }) => {
        setTimeout(() => { thunderWarning = warning; }, delay);
    });

    setTimeout(() => {
        thunderWarning = 0;
        thunderActive = true;
        console.log('Thunder striking!');
        dustParticles.length = 0;
        if (shieldActive) {
            shieldHits--;
            dusterStrength = dustCollected > 0 ? Math.min(dustCollected, 3) : dusterStrength;
            if (dusterStrength > 0) {
                shieldCharged = true;
                shieldActive = false;
                shieldHits = 0;
                if (dusterStrength === 3) hornsUpTimer = 2;
                console.log('Shield charged with strength:', dusterStrength);
                ctx.fillText(`Shield charged (S${dusterStrength})!`, canvas.width / 2, 50);
            } else if (shieldHits <= 0) {
                shieldActive = false;
                shieldTimer = 0;
                for (let i = 0; i < 20; i++) {
                    dustPixels.push({ x: player.x + player.width / 2, y: player.y + player.height / 2, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, color: 'rgba(192, 192, 192, 0.8)', timeLeft: 0.5 });
                }
                if (!isMuted && !isAllMuted) uhOhSound.play();
                ctx.fillText('Shield popped by thunder!', canvas.width / 2, 50);
            } else {
                ctx.fillText(`Shield holds (${shieldHits} hits left)!`, canvas.width / 2, 50);
            }
        } else if (!shieldCharged) {
            if (chillMode) ctx.fillText('Thunder zaps all bubbles!', canvas.width / 2, 50);
            else {
                player.health -= currentLevel === 1 ? 10 : 20;
                ctx.fillText('Thunder strikes—ouch!', canvas.width / 2, 50);
            }
        }
        setTimeout(() => { thunderActive = false; }, 1000);
    }, 1000);

    if (shieldActive) {
        const stormCollectionInterval = setInterval(() => {
            if (thunderWarning || thunderActive) {
                dustParticles.forEach((dust, index) => {
                    if (dust.visible && Math.random() < 0.3) {
                        dustCollected++;
                        explodeDust(dust.x, dust.y, dust.value);
                        dustParticles.splice(index, 1);
                    }
                });
            } else {
                clearInterval(stormCollectionInterval);
            }
        }, 16);
    }
}

setTimeout(() => {
    if (Date.now() - lastClickTime > idleTimeout) playRandomGiggleFart();
}, Math.floor(Math.random() * (21000 - 7000 + 1)) + 7000);

function drawSettings() {
    if (showSettings) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(canvas.width - 200, 10, 190, 240);
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width - 200, 10, 190, 240);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Settings', canvas.width - 190, 40);
        ctx.fillText(isMuted ? 'Unmute Farts (M)' : 'Mute Farts (M)', canvas.width - 190, 70);
        ctx.fillText(isMusicOn ? 'Music Off (N)' : 'Music On (N)', canvas.width - 190, 100);
        ctx.fillText(`Scene: ${scenes[currentScene].name} (B)`, canvas.width - 190, 130);
        ctx.fillText('Leaderboard (L)', canvas.width - 190, 160);
        ctx.fillText(chillMode ? 'Chill Off (H)' : 'Chill On (H)', canvas.width - 190, 190);
        ctx.fillText(`Track: ${currentMusicIndex + 1} (T)`, canvas.width - 190, 220);
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(canvas.width - 20, 30, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('X', canvas.width - 20, 35);
    }
}

function drawMuteAllButton() {
    ctx.save();
    const yPos = chillMode ? 110 : 160;
    ctx.translate(105, yPos);
    ctx.fillStyle = isAllMuted ? 'rgba(255, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(5, -3);
    ctx.lineTo(3, 3);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    if (isAllMuted) {
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(5, 5);
        ctx.moveTo(5, -5);
        ctx.lineTo(-5, 5);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.restore();
}

function drawMoonPayButton() {
    const x = canvas.width - 90;
    const y = 120;
    ctx.save();
    ctx.translate(x, y);
    let radius = 58;
    if (moonshotActive) radius += Math.sin(Date.now() / 200) * 5;
    ctx.fillStyle = '#800080';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-20, -20, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, 20, 10, 0, Math.PI * 2);
    ctx.fill();
    if (moonPayImg.complete && moonPayImg.naturalWidth !== 0) {
        const imgWidth = 200;
        const imgHeight = 80;
        const scale = moonshotActive ? 1 + Math.sin(Date.now() / 200) * 0.1 : 1;
        ctx.drawImage(moonPayImg, -imgWidth / 2 * scale, -imgHeight / 2 * scale, imgWidth * scale, imgHeight * scale);
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(moonshotActive ? `Auto (${Math.ceil(moonshotTimer)}s)` : 'MoonPay', 0, 40);
    if (moonshotCharge < 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, radius - 5, -Math.PI / 2, -Math.PI / 2 + moonshotCharge * 2 * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fill();
    }
    ctx.restore();
}

function drawLedgerButton() {
    const x = 110;
    const y = chillMode ? 180 : 210;
    ctx.save();
    ctx.translate(x, y);
    let radius = 70;
    if (shieldBonusActive) radius += Math.sin(Date.now() / 200) * 5;
    ctx.fillStyle = shieldBonusCharge >= 1 && !shieldBonusActive ? '#FFFF00' : 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 5;
    ctx.stroke();
    if (ledgerImg.complete && ledgerImg.naturalWidth !== 0) {
        const imgWidth = 200;
        const imgHeight = 80;
        const scale = shieldBonusActive ? 1 + Math.sin(Date.now() / 200) * 0.1 : 1;
        ctx.drawImage(ledgerImg, -imgWidth / 2 * scale, -imgHeight / 2 * scale, imgWidth * scale, imgHeight * scale);
    }
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.strokeText(shieldBonusActive ? `Boost (${Math.ceil(shieldBonusTimer)}s)` : 'Ledger', 0, 10);
    ctx.fillText(shieldBonusActive ? `Boost (${Math.ceil(shieldBonusTimer)}s)` : 'Ledger', 0, 10);
    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateDustSpawn();

    if (isLocked) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF99CC';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(playerName, canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillText(playerName, canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '24px Arial';
        ctx.strokeText('Tap to Start', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Tap to Start', canvas.width / 2, canvas.height / 2 + 20);
    } else if (!chillMode && player.health <= 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF99CC';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Unicorn Fried!', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '24px Arial';
        ctx.fillText(`Level ${currentLevel}, Dust: ${gameDust}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText('Tap to Restart', canvas.width / 2, canvas.height / 2 + 40);
    } else {
        if (shakeTimer > 0) {
            shakeTimer -= 1 / 60;
            const shakeX = (Math.random() - 0.5) * 5;
            const shakeY = (Math.random() - 0.5) * 5;
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }

        drawBackground();
        drawUnicorn();
        if (thunderWarning === 1) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Thunder incoming!', canvas.width / 2, 50);
        }
        if (!showRontoshiSilvermoto) drawDust();
        drawBanner();

        glitterParticles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 1 / 60;
            ctx.fillStyle = 'rgba(255, 192, 203, 1)';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            if (particle.life <= 0) {
                dustParticles.push({
                    width: 30, height: 30, visible: true, timeLeft: 15,
                    growth: 10, maxGrowth: 30, value: 1 * (shieldBonusActive ? 2 : 1),
                    health: 1, x: particle.x, y: particle.y,
                    tentacle: 0, driftX: 0, driftY: 0
                });
                glitterParticles.splice(index, 1);
            }
        });

        if (thunderActive) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            let x = 0, y = Math.random() * canvas.height / 2;
            ctx.moveTo(x, y);
            while (x < canvas.width) {
                x += Math.random() * 50 + 20;
                y += (Math.random() - 0.5) * 100;
                if (x > canvas.width) x = canvas.width;
                if (y < 0) y = 0; if (y > canvas.height) y = canvas.height;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        if (shieldPower < 1) {
            shieldPower += (1 / shieldChargeTime) / 60 * (shieldBonusActive ? 2 : 1);
            if (shieldPower > 1) shieldPower = 1;
        }
        if (collectPower < 1) {
            collectPower += (1 / collectChargeTime) / 60;
            if (collectPower > 1) collectPower = 1;
        }
        if (moonshotCharge < 1 && !moonshotActive) {
            moonshotCharge += (1 / moonshotChargeTime) / 60;
            if (moonshotCharge > 1) moonshotCharge = 1;
        }
        if (moonshotActive) {
            moonshotTimer -= 1 / 60;
            if (moonshotTimer <= 0) {
                moonshotActive = false;
                moonshotCharge = 0;
            } else if (Math.random() < 0.1) {
                generateDust();
                if (!isMuted && !isAllMuted) fartSounds[fartIndex].play();
                fartIndex = (fartIndex + 1) % fartSounds.length;
            }
        }
        if (shieldBonusActive) {
            shieldBonusTimer -= 1 / 60;
            if (shieldBonusTimer <= 0) {
                shieldBonusActive = false;
                shieldBonusCharge = 0;
            }
            ctx.fillStyle = '#FFFF00';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('x2 Shield & Score!', canvas.width / 2, 70);
        }
        if (shieldCharged) {
            ctx.save();
            ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
            const strikeRadius = (150 + dusterStrength * 50) * (canvas.width / 800);
            ctx.strokeStyle = `rgba(255, 255, 0, ${0.5 + Math.sin(Date.now() / 200) * 0.2})`;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, strikeRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            shieldTimer += 1 / 60;
            if (shieldTimer >= 10) {
                shieldCharged = false;
                shieldTimer = 0;
                dusterStrength = 0;
                ctx.fillText('Shield charge lost!', canvas.width / 2, 50);
            }
            ctx.fillText(`Shield charged (S${dusterStrength})—tap X to strike!`, canvas.width / 2, 50);
        }
        if (hornsUpTimer > 0) {
            hornsUpTimer -= 1 / 60;
            ctx.fillStyle = '#FFFF00';
            ctx.font = '30px Arial';
            ctx.fillText('Horns Up—Double Dust Radius!', canvas.width / 2, shieldBonusActive ? 90 : 70);
            if (hornsUpTimer <= 0) dusterStrength = 0;
        }
        if (shieldActive) {
            shieldTimer += 1 / 60;
            if (shieldTimer >= 5) {
                shieldActive = false;
                shieldTimer = 0;
                shieldHits = 0;
                ctx.fillText('Shield dropped!', canvas.width / 2, 50);
            } else {
                ctx.fillText(`Shield up (${shieldHits} hits left)—collect dust!`, canvas.width / 2, 50);
            }
        }
        envTimer += 1 / 60;
        if (envTimer >= envMaxDelay) {
            envTimer = Math.random() * envMaxDelay;
            triggerThunder();
        }
        if (!chillMode) {
            if (gameDust >= 2000 && currentLevel < 4) {
                currentLevel = 4;
                envMaxDelay = 3;
                currentScene = 4;
                backgroundVideo.src = scenes[currentScene].src;
                backgroundVideo.play();
            } else if (gameDust >= 1000 && currentLevel < 3) {
                currentLevel = 3;
                envMaxDelay = 6;
                currentScene = 3;
                backgroundVideo.src = scenes[currentScene].src;
                backgroundVideo.play();
            } else if (gameDust >= 250 && currentLevel < 2) {
                currentLevel = 2;
                envMaxDelay = 9;
                currentScene = 2;
                backgroundVideo.src = scenes[currentScene].src;
                backgroundVideo.play();
            }
        }
        if (!chillMode && currentLevel >= 2 && gameDust >= 500 && gameDust - dustCollectedLastFrame <= 500) {
            let bearomeTrigger = Math.floor(Math.random() * 16) + 135;
            if (gameDust >= bearomeTrigger && gameDust - dustCollectedLastFrame < bearomeTrigger && bearomeWarnings < 3) {
                bearomeTimer += 1 / 60;
                if (bearomeTimer >= 1) {
                    bearomeTimer = 0;
                    bearomeWarnings++;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    switch (bearomeWarnings) {
                        case 1:
                            ctx.fillText('Bearome Scowel: Horns tingling yet?', canvas.width / 2, 30);
                            if (!isMuted && !isAllMuted) hornTingleSound.play().catch(() => console.log('Tingle blocked'));
                            break;
                        case 2:
                            ctx.fillText('Bearome Scowel: Feel my wrath brewing!', canvas.width / 2, 30);
                            if (!isMuted && !isAllMuted) feelSomethingSound.play().catch(() => console.log('Feel blocked'));
                            setTimeout(() => {
                                if (!isMuted && !isAllMuted) {
                                    bearomeLaughSound.play().catch(() => console.log('Laugh blocked'));
                                    hornTingleSound.play().catch(() => console.log('Horns blocked'));
                                }
                                showRontoshiSilvermoto = true;
                                rontoshiStep = 5;
                                shakeTimer = 2;
                            }, 2000);
                            break;
                        case 3:
                            ctx.fillText('Bearome Scowel: Glitter storm incoming!', canvas.width / 2, 30);
                            setTimeout(() => {
                                showRontoshiSilvermoto = false;
                                if (shieldCharged) {
                                    if (!isMuted && !isAllMuted) closeCallSound.play().catch(() => console.log('Close call blocked'));
                                    ctx.fillText('Close call—charged shield holds!', canvas.width / 2, 50);
                                } else {
                                    if (!isMuted && !isAllMuted) hoovesDownSound.play().catch(() => console.log('Hooves blocked'));
                                    shrinkActive = true;
                                    shrinkDuration = 10;
                                    dustParticles.forEach(dust => {
                                        dust.maxGrowth = Math.max(40, dust.maxGrowth * 0.75);
                                        dust.value = Math.max(1, dust.value);
                                    });
                                    for (let i = 0; i < 20; i++) {
                                        glitterParticles.push({
                                            x: Math.random() * canvas.width,
                                            y: Math.random() * canvas.height,
                                            vx: (Math.random() - 0.5) * 5,
                                            vy: (Math.random() - 0.5) * 5,
                                            size: 20,
                                            life: 3
                                        });
                                    }
                                    if (shieldActive) {
                                        shieldActive = false;
                                        shieldTimer = 0;
                                        ctx.fillText('Shield shattered by glitter!', canvas.width / 2, 70);
                                    }
                                    if (bearomeImg.complete) {
                                        ctx.drawImage(bearomeImg, 50, 50, 200, 200);
                                        ctx.strokeStyle = 'rgba(255, 192, 203, 0.7)';
                                        ctx.lineWidth = 5;
                                        ctx.beginPath();
                                        ctx.moveTo(150, 150);
                                        ctx.quadraticCurveTo(canvas.width / 4, canvas.height / 4, player.x + player.width / 2, player.y + player.height / 2);
                                        ctx.stroke();
                                    }
                                }
                                bearomeWarnings = 0;
                            }, 2000);
                            break;
                    }
                }
            }
        }
        if (shrinkActive) {
            shrinkDuration -= 1 / 60;
            if (shrinkDuration <= 0) shrinkActive = false;
            ctx.fillStyle = 'rgba(255, 192, 203, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Glitter Bomb—farts unleashed!', canvas.width / 2, 90);
        }
        if (showRontoshiSilvermoto) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
            if (rontoshiStep === 5 && bearomeImg.complete) {
                ctx.drawImage(bearomeImg, canvas.width / 2 - 100, canvas.height / 2 - 100, 200, 200);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Bearome Scowel: Time to sparkle!', canvas.width / 2, canvas.height / 2 + 120);
            } else if (rontoshiSilvermotoImg.complete) {
                ctx.drawImage(rontoshiSilvermotoImg, canvas.width / 2 - 100, canvas.height / 2 - 100, 200, 200);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(rontoshiDialogues[rontoshiStep], canvas.width / 2, canvas.height / 2 + 120);
            }
            ctx.fillText('Click to continue', canvas.width / 2, canvas.height / 2 + 150);
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, chillMode ? 100 : 130);
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 200, chillMode ? 100 : 130);
        const gradient = ctx.createLinearGradient(20, 0, 220, 0);
        gradient.addColorStop(0, '#FF99CC');
        gradient.addColorStop(1, '#CC00FF');
        ctx.fillStyle = gradient;
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(playerName, 20, 40);
        ctx.fillText(`Dust: ${chillMode ? chillDust : gameDust}`, 20, 70);
        if (!chillMode) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(10, 100, 200, 20);
            ctx.fillStyle = `hsl(${player.health * 1.2}, 100%, 50%)`;
            ctx.fillRect(10, 100, 200 * (player.health / 100), 20);
            ctx.strokeStyle = '#FF69B4';
            ctx.strokeRect(10, 100, 200, 20);
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(10, chillMode ? 80 : 130, 200, 20);
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(10, chillMode ? 80 : 130, 200 * shieldPower, 20);
        ctx.strokeStyle = '#FF69B4';
        ctx.strokeRect(10, chillMode ? 80 : 130, 200, 20);
        drawMuteAllButton();

        ctx.fillStyle = shieldPower >= 1 && !shieldActive && !shieldCharged ? '#FFD700' : 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(150, canvas.height - 150, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = shieldCharged ? '#FFD700' : '#FF69B4';
        ctx.lineWidth = shieldCharged ? 5 : 3;
        ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.fillText(shieldCharged ? 'Strike (X)' : 'Shield (S)', 150, canvas.height - 145);

        ctx.fillStyle = collectPower >= 1 && !collectAllReady ? '#00FF00' : 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(canvas.width - 150, canvas.height - 150, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.fillText('Collect', canvas.width - 150, canvas.height - 145);
        ctx.fillText('(C)', canvas.width - 150, canvas.height - 125);

        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(canvas.width - 30, 30, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('S', canvas.width - 30, 35);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        if (chillMode) {
            ctx.fillText('Chill Mode', canvas.width / 2 - 80, 30);
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(canvas.width / 2 + 50, 25, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FF69B4';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.fillText('Game', canvas.width / 2 + 50, 30);
        } else {
            ctx.fillText(`Level ${currentLevel}`, canvas.width / 2, 30);
        }

        ctx.font = '48px "Bubblegum Sans"';
        ctx.fillStyle = '#FF69B4';
        ctx.fillText('Good Attracts Good', canvas.width / 2, canvas.height - 40);
        ctx.font = '20px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('unicornfartdust.com', canvas.width / 2, canvas.height - 20);
        ctx.fillText(ufdPrice, canvas.width / 2, canvas.height);

        if (shakeTimer > 0) ctx.restore();
        dustCollectedLastFrame = chillMode ? chillDust : gameDust;

        drawMoonPayButton();
        drawLedgerButton();
    }
    drawSettings();
    drawLeaderboard();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    lastClickTime = Date.now();

    if (isLocked) {
        isLocked = false;
        if (isMusicOn && !isAllMuted && !musicStarted) {
            backgroundMusic.play().catch(err => console.error('Music blocked:', err));
            musicStarted = true;
        }
        showRontoshiSilvermoto = true;
        rontoshiStep = 0;
        return;
    }

    if (!chillMode && player.health <= 0) {
        chillDust = 0;
        gameDust = 0;
        shieldPower = 0;
        collectPower = 0;
        player.health = 100;
        currentLevel = 1;
        envMaxDelay = 25;
        currentScene = 2;
        backgroundVideo.src = scenes[currentScene].src;
        backgroundVideo.play().catch(err => console.error('Video blocked:', err));
        dustParticles.length = 0;
        glitterParticles.length = 0;
        dustPixels.length = 0;
        bearomeThreshold = Math.floor(Math.random() * 251) + 500;
        bearomeActive = false;
        bearomeTimer = 0;
        bearomeWarnings = 0;
        shrinkActive = false;
        shrinkDuration = 0;
        shieldActive = false;
        shieldCharged = false;
        shieldTimer = 0;
        dusterStrength = 0;
        shieldHits = 0;
        hornsUpTimer = 0;
        moonshotCharge = 0;
        moonshotActive = false;
        moonshotTimer = 0;
        shieldBonusCharge = 0;
        shieldBonusActive = false;
        shieldBonusTimer = 0;
        return;
    }

    if (showLeaderboard) {
        showLeaderboard = false;
        return;
    }

    if (showSettings) {
        if (x >= canvas.width - 200 && x <= canvas.width - 10 && y >= 10 && y <= 250) {
            if (Math.sqrt((x - (canvas.width - 20)) ** 2 + (y - 30) ** 2) <= 15) {
                showSettings = false;
            } else if (y >= 50 && y <= 80) {
                isMuted = !isMuted;
                localStorage.setItem('isMuted', isMuted);
            } else if (y >= 80 && y <= 110) {
                isMusicOn = !isMusicOn;
                toggleMusic();
                localStorage.setItem('isMusicOn', isMusicOn);
            } else if (y >= 110 && y <= 140) {
                currentScene = (currentScene + 1) % scenes.length;
                if (scenes[currentScene].type === 'video') {
                    backgroundVideo.src = scenes[currentScene].src;
                    backgroundVideo.play().catch(err => console.error('Video blocked:', err));
                } else {
                    backgroundVideo.pause();
                    backgroundVideo.src = '';
                }
                isDarkMode = scenes[currentScene].name === 'Night';
                document.body.classList.toggle('dark-mode', isDarkMode);
            } else if (y >= 140 && y <= 170) {
                showLeaderboard = true;
                fetchLeaderboard();
                showSettings = false;
            } else if (y >= 170 && y <= 200) {
                chillMode = !chillMode;
                chillDust = 0;
                gameDust = 0;
                shieldPower = 0;
                collectPower = 0;
                player.health = 100;
                currentLevel = 1;
                envMaxDelay = chillMode ? 15 : 25;
                currentScene = chillMode ? 1 : 2;
                if (chillMode) {
                    backgroundVideo.pause();
                    backgroundVideo.src = '';
                    isDarkMode = true;
                    document.body.classList.add('dark-mode');
                } else {
                    backgroundVideo.src = scenes[currentScene].src;
                    backgroundVideo.play().catch(err => console.error('Video blocked:', err));
                    isDarkMode = false;
                    document.body.classList.remove('dark-mode');
                }
                dustParticles.length = 0;
                glitterParticles.length = 0;
                dustPixels.length = 0;
                bearomeThreshold = Math.floor(Math.random() * 251) + 500;
                bearomeActive = false;
                bearomeTimer = 0;
                bearomeWarnings = 0;
                shrinkActive = false;
                shrinkDuration = 0;
                shieldActive = false;
                shieldCharged = false;
                shieldTimer = 0;
                dusterStrength = 0;
                shieldHits = 0;
                hornsUpTimer = 0;
                moonshotCharge = 0;
                moonshotActive = false;
                moonshotTimer = 0;
                shieldBonusCharge = 0;
                shieldBonusActive = false;
                shieldBonusTimer = 0;
            } else if (y >= 200 && y <= 230) {
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
                currentMusicIndex = (currentMusicIndex + 1) % musicTracks.length;
                backgroundMusic = musicTracks[currentMusicIndex];
                if (isMusicOn && !isAllMuted) {
                    backgroundMusic.play().catch(err => console.error('Music blocked:', err));
                    musicStarted = true;
                }
            }
            return;
        } else {
            showSettings = false;
            return;
        }
    }

    if (showRontoshiSilvermoto) {
        rontoshiStep++;
        if (rontoshiStep >= rontoshiDialogues.length && rontoshiStep !== 5) {
            showRontoshiSilvermoto = false;
            rontoshiStep = 0;
        }
        return;
    }

    let buttonClicked = false;
    if (Math.sqrt((x - (canvas.width - 30)) ** 2 + (y - 30) ** 2) <= 20 && !isLocked) {
        showSettings = true;
        buttonClicked = true;
    } else if (chillMode && Math.sqrt((x - (canvas.width / 2 + 50)) ** 2 + (y - 25) ** 2) <= 30) {
        chillMode = false;
        chillDust = 0;
        gameDust = 0;
        shieldPower = 0;
        collectPower = 0;
        player.health = 100;
        currentLevel = 1;
        envMaxDelay = 25;
        currentScene = 2;
        backgroundVideo.src = scenes[currentScene].src;
        backgroundVideo.play().catch(err => console.error('Video blocked:', err));
        isDarkMode = false;
        document.body.classList.remove('dark-mode');
        dustParticles.length = 0;
        glitterParticles.length = 0;
        dustPixels.length = 0;
        bearomeThreshold = Math.floor(Math.random() * 251) + 500;
        bearomeActive = false;
        bearomeTimer = 0;
        bearomeWarnings = 0;
        shrinkActive = false;
        shrinkDuration = 0;
        shieldActive = false;
        shieldCharged = false;
        shieldTimer = 0;
        dusterStrength = 0;
        shieldHits = 0;
        hornsUpTimer = 0;
        moonshotCharge = 0;
        moonshotActive = false;
        moonshotTimer = 0;
        shieldBonusCharge = 0;
        shieldBonusActive = false;
        shieldBonusTimer = 0;
        buttonClicked = true;
    } else if (Math.sqrt((x - 150) ** 2 + (y - (canvas.height - 150)) ** 2) <= 60) {
        if (shieldPower >= 1 && !shieldActive && !shieldCharged) {
            shieldActive = true;
            shieldHits = 3;
            shieldPower = 0;
            ctx.fillText('Shield up!', canvas.width / 2, 50);
        } else if (shieldCharged) {
            const strikeRadius = (150 + dusterStrength * 50) * (canvas.width / 800);
            const toRemove = [];
            dustParticles.forEach((dust, index) => {
                if (dust.visible) {
                    const dx = dust.x - (player.x + player.width / 2);
                    const dy = dust.y - (player.y + player.height / 2);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= strikeRadius) {
                        toRemove.push(index);
                        explodeDust(dust.x, dust.y, dust.value);
                        if (chillMode) chillDust += dust.value;
                        else gameDust += dust.value;
                    }
                }
            });
            toRemove.sort((a, b) => b - a).forEach(index => dustParticles.splice(index, 1));
            for (let i = 0; i < 30; i++) {
                dustPixels.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    vx: (Math.random() - 0.5) * 20,
                    vy: (Math.random() - 0.5) * 20,
                    color: 'rgba(255, 255, 0, 0.8)',
                    timeLeft: 0.7
                });
            }
            shakeTimer = 0.5;
            shieldCharged = false;
            shieldTimer = 0;
            dusterStrength = 0;
            shieldBonusCharge = 1;
            if (!isMuted && !isAllMuted) diamondHoofSound.play();
            if (gameDust >= 500 && !chillMode && rontoshiStep === 3) {
                showRontoshiSilvermoto = true;
                rontoshiStep = 4;
                setTimeout(() => { showRontoshiSilvermoto = false; }, 4000);
            }
            let strikeFade = 1.0;
            const strikeInterval = setInterval(() => {
                ctx.save();
                ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
                ctx.strokeStyle = `rgba(255, 255, 0, ${strikeFade})`;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(0, 0, strikeRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                strikeFade -= 0.1;
                if (strikeFade <= 0) clearInterval(strikeInterval);
            }, 100);
        }
        buttonClicked = true;
    } else if (Math.sqrt((x - (canvas.width - 150)) ** 2 + (y - (canvas.height - 150)) ** 2) <= 50 && collectPower >= 1 && !collectAllReady) {
        collectAllReady = true;
        let collected = false;
        dustParticles.forEach((dust, index) => {
            if (dust.visible) {
                collected = true;
                explodeDust(dust.x, dust.y, dust.value);
                if (chillMode) chillDust += dust.value;
                else gameDust += dust.value;
                dustParticles.splice(index, 1);
            }
        });
        if (collected && !isMuted && !isAllMuted) buttercupSound.play();
        collectPower = 0;
        setTimeout(() => { collectAllReady = false; }, 500);
        buttonClicked = true;
    } else if (Math.sqrt((x - (canvas.width - 90)) ** 2 + (y - 120) ** 2) <= 58 && moonshotCharge >= 1 && !moonshotActive) {
        moonshotActive = true;
        moonshotTimer = 7;
        moonshotCharge = 0;
        if (!isMuted && !isAllMuted) fanfareSound.play();
        buttonClicked = true;
    } else if (Math.sqrt((x - 110) ** 2 + (y - (chillMode ? 180 : 210)) ** 2) <= 70 && shieldBonusCharge >= 1 && !shieldBonusActive) {
        shieldBonusActive = true;
        shieldBonusTimer = 5;
        shieldBonusCharge = 0;
        if (!isMuted && !isAllMuted) buttercupSound.play();
        buttonClicked = true;
    }

    if (!buttonClicked) {
        generateDust();
        player.farting = true;
        if (!isMuted && !isAllMuted) fartSounds[fartIndex].play();
        fartIndex = (fartIndex + 1) % fartSounds.length;
        dustParticles.forEach((dust, index) => {
            if (dust.visible) {
                const dx = dust.x - x;
                const dy = dust.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const collectRadius = hornsUpTimer > 0 ? 150 : 75;
                if (distance <= collectRadius * (canvas.width / 800)) {
                    dust.health--;
                    if (dust.health <= 0) {
                        explodeDust(dust.x, dust.y, dust.value);
                        if (chillMode) chillDust += dust.value;
                        else gameDust += dust.value;
                        dustParticles.splice(index, 1);
                        if (!isMuted && !isAllMuted) {
                            fartSounds[fartIndex].play();
                            fartIndex = (fartIndex + 1) % fartSounds.length;
                        }
                    }
                }
            }
        });
        if (chillMode && chillDust >= 50 && rontoshiStep === 0) {
            showRontoshiSilvermoto = true;
            rontoshiStep = 1;
            setTimeout(() => { showRontoshiSilvermoto = false; }, 4000);
        }
        updateLeaderboard(chillMode ? chillDust : gameDust);
    }
});

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'tab') {
        e.preventDefault();
        if (!isLocked) showSettings = !showSettings;
    } else if (key === 'm') {
        isMuted = !isMuted;
        localStorage.setItem('isMuted', isMuted);
    } else if (key === 'n') {
        isMusicOn = !isMusicOn;
        toggleMusic();
        localStorage.setItem('isMusicOn', isMusicOn);
    } else if (key === 'b') {
        currentScene = (currentScene + 1) % scenes.length;
        if (scenes[currentScene].type === 'video') {
            backgroundVideo.src = scenes[currentScene].src;
            backgroundVideo.play().catch(err => console.error('Video blocked:', err));
        } else {
            backgroundVideo.pause();
            backgroundVideo.src = '';
        }
        isDarkMode = scenes[currentScene].name === 'Night';
        document.body.classList.toggle('dark-mode', isDarkMode);
    } else if (key === 'l' && !isLocked) {
        showLeaderboard = !showLeaderboard;
        if (showLeaderboard) fetchLeaderboard();
    } else if (key === 'h' && !isLocked) {
        chillMode = !chillMode;
        chillDust = 0;
        gameDust = 0;
        shieldPower = 0;
        collectPower = 0;
        player.health = 100;
        currentLevel = 1;
        envMaxDelay = chillMode ? 15 : 25;
        currentScene = chillMode ? 1 : 2;
        if (chillMode) {
            backgroundVideo.pause();
            backgroundVideo.src = '';
            isDarkMode = true;
            document.body.classList.add('dark-mode');
        } else {
            backgroundVideo.src = scenes[currentScene].src;
            backgroundVideo.play().catch(err => console.error('Video blocked:', err));
            isDarkMode = false;
            document.body.classList.remove('dark-mode');
        }
        dustParticles.length = 0;
        glitterParticles.length = 0;
        dustPixels.length = 0;
        bearomeThreshold = Math.floor(Math.random() * 251) + 500;
        bearomeActive = false;
        bearomeTimer = 0;
        bearomeWarnings = 0;
        shrinkActive = false;
        shrinkDuration = 0;
        shieldActive = false;
        shieldCharged = false;
        shieldTimer = 0;
        dusterStrength = 0;
        shieldHits = 0;
        hornsUpTimer = 0;
        moonshotCharge = 0;
        moonshotActive = false;
        moonshotTimer = 0;
        shieldBonusCharge = 0;
        shieldBonusActive = false;
        shieldBonusTimer = 0;
    } else if (key === 't' && showSettings) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        currentMusicIndex = (currentMusicIndex + 1) % musicTracks.length;
        backgroundMusic = musicTracks[currentMusicIndex];
        if (isMusicOn && !isAllMuted) {
            backgroundMusic.play().catch(err => console.error('Music blocked:', err));
            musicStarted = true;
        }
    } else if (key === 's' && shieldPower >= 1 && !shieldActive && !shieldCharged) {
        shieldActive = true;
        shieldHits = 3;
        shieldPower = 0;
        ctx.fillText('Shield up!', canvas.width / 2, 50);
    } else if (key === 'x' && shieldCharged) {
        const strikeRadius = (150 + dusterStrength * 50) * (canvas.width / 800);
        const toRemove = [];
        dustParticles.forEach((dust, index) => {
            if (dust.visible) {
                const dx = dust.x - (player.x + player.width / 2);
                const dy = dust.y - (player.y + player.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= strikeRadius) {
                    toRemove.push(index);
                    explodeDust(dust.x, dust.y, dust.value);
                    if (chillMode) chillDust += dust.value;
                    else gameDust += dust.value;
                }
            }
        });
        toRemove.sort((a, b) => b - a).forEach(index => dustParticles.splice(index, 1));
        for (let i = 0; i < 30; i++) {
            dustPixels.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                color: 'rgba(255, 255, 0, 0.8)',
                timeLeft: 0.7
            });
        }
        shakeTimer = 0.5;
        shieldCharged = false;
        shieldTimer = 0;
        dusterStrength = 0;
        shieldBonusCharge = 1;
        if (!isMuted && !isAllMuted) diamondHoofSound.play();
        if (gameDust >= 500 && !chillMode && rontoshiStep === 3) {
            showRontoshiSilvermoto = true;
            rontoshiStep = 4;
            setTimeout(() => { showRontoshiSilvermoto = false; }, 4000);
        }
        let strikeFade = 1.0;
        const strikeInterval = setInterval(() => {
            ctx.save();
            ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
            ctx.strokeStyle = `rgba(255, 255, 0, ${strikeFade})`;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, strikeRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            strikeFade -= 0.1;
            if (strikeFade <= 0) clearInterval(strikeInterval);
        }, 100);
    } else if (key === 'c' && collectPower >= 1 && !collectAllReady) {
        collectAllReady = true;
        let collected = false;
        dustParticles.forEach((dust, index) => {
            if (dust.visible) {
                collected = true;
                explodeDust(dust.x, dust.y, dust.value);
                if (chillMode) chillDust += dust.value;
                else gameDust += dust.value;
                dustParticles.splice(index, 1);
            }
        });
        if (collected && !isMuted && !isAllMuted) buttercupSound.play();
        collectPower = 0;
        setTimeout(() => { collectAllReady = false; }, 500);
    } else if (key === ' ' && !isLocked) {
        isAllMuted = !isAllMuted;
        if (isAllMuted) {
            backgroundMusic.pause();
            musicStarted = false;
        } else if (isMusicOn) {
            backgroundMusic.play().catch(err => console.error('Music blocked:', err));
            musicStarted = true;
        }
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    canvas.dispatchEvent(new MouseEvent('click', { clientX: touch.clientX, clientY: touch.clientY }));
}, { passive: false });

requestAnimationFrame(gameLoop);