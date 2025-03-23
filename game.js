// Sticky_UFD Game - Part 1: Setup & Assets (March 22, 2025)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const soundEffects = document.getElementById('soundEffects');

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

const backgroundMusic = new Audio('assets/music2.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;
let musicStarted = false;

const fartSounds = [new Audio('assets/fart.mp3'), new Audio('assets/fart.mp3'), new Audio('assets/fart.mp3')];
let fartIndex = 0;
const fanfareSound = new Audio('assets/fanfare.mp3');
const giggleSound = new Audio('assets/giggle.mp3');
const oddFartSound = new Audio('assets/oddfart.mp3');
const buttercupSound = new Audio('assets/buttercup.mp3');
const dusterSound = new Audio('assets/duster.mp3');
const diamondHoofSound = new Audio('assets/diamond_hoof.mp3');
const hornTingleSound = new Audio('assets/horn_tingle.mp3');
const feelSomethingSound = new Audio('assets/feel_something.mp3');
const uhOhSound = new Audio('assets/uh_oh.mp3');

const backgroundVideo = document.createElement('video');
let scenes = [
    { type: 'static', name: 'Day', color: '#4682B4' },
    { type: 'static', name: 'Night', color: '#1a1a2e' },
    { type: 'video', name: 'Fartscape 1', src: 'assets/dj-bg.mp4' },
    { type: 'video', name: 'Fartscape 2', src: 'assets/scene1.mp4' },
    { type: 'video', name: 'Fartscape 3', src: 'assets/scene2.mp4' }
];
let currentScene = 0;
backgroundVideo.src = scenes[currentScene].src || '';
backgroundVideo.loop = true;
backgroundVideo.muted = true;
backgroundVideo.play().catch(err => console.error('Video blocked:', err));
let videoReady = false;
backgroundVideo.addEventListener('canplaythrough', () => { videoReady = true; });

const unicornImg = new Image(); unicornImg.src = 'assets/unicorn.png';
const dustImg = new Image(); dustImg.src = 'assets/dust.png';
const wordsImg = new Image(); wordsImg.src = 'assets/words.png';
const unicornWizardImg = new Image(); unicornWizardImg.src = 'assets/unicorn_wizard.png';

const player = {
    x: 0, y: 0, width: 200, height: 200, angle: 0, farting: false, direction: 'right',
    shiftX: 0, shiftY: 0, shiftDuration: 0, flipped: false, health: 100
};

const dustParticles = [];
const dustPixels = [];
const stars = [];
let chillDust = 0;
let gameDust = 0;
let power = 0;
let powerChargeTime = 10;
let isDarkMode = false;
let showLeaderboard = false;
let isLocked = true;
let showUnicornWizard = false;
let unicornWizardStep = 0;
let bearomeThreshold = Math.floor(Math.random() * 251) + 500;
let bearomeActive = false;
let bearomeTimer = 0;
let bearomeWarnings = 0;
let shrinkActive = false;
let shrinkDuration = 0;
let isMuted = false;
let isMusicOn = true;
let lastClickTime = Date.now();
const idleTimeout = 3000;
let clickState = 0;
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
let hornsUpTimer = 0;
let collectAllReady = false;
let envTimer = 0;
let envMaxDelay = 15;
let thunderWarning = 0;
let thunderActive = false;
let ufdPrice = 'Loading...';
let currentLevel = 1;
let chillMode = true;

const skyColorLight = '#4682B4';
const skyColorDark = '#1a1a2e';
const cloudColorLight = '#FFFFFF';
const cloudColorDark = '#4A4A4A';

const soundEffectsMap = { 'pop': 0, 'whizz': 2, 'fizzle': 4, 'bang': 6 };

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
            ufdPrice = data['unicorn-fart-dust']?.usd ? `UFD: $${data['unicorn-fart-dust'].usd}` : 'UFD: N/A';
        })
        .catch(() => ufdPrice = 'UFD: Error');
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
window.addEventListener('load', () => {
    chillDust = 0;
    gameDust = 0;
    power = 0;
});
resizeCanvas();
// Sticky_UFD Game - Part 2: Core Functions
let leaderboardData = [];

function drawBackground() {
    const scene = scenes[currentScene];
    if (scene.type === 'video' && videoReady && backgroundVideo.readyState >= 2) {
        ctx.drawImage(backgroundVideo, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = scene.color || skyColorDark;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (scene.name === 'Night') drawStars();
        ctx.fillStyle = scene.name === 'Night' ? cloudColorDark : cloudColorLight;
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
    }
    if (clickState === 2 && wordsImg.complete) ctx.drawImage(wordsImg, -player.width / 2, -player.height / 2, player.width, player.height);
    if (shieldActive || shieldCharged) {
        ctx.strokeStyle = shieldCharged ? 'rgba(255, 255, 0, 0.9)' : 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = shieldCharged ? 10 : 5;
        ctx.beginPath();
        ctx.arc(0, 0, player.width / 2 + 20 + (shieldCharged ? Math.sin(Date.now() / 200) * 5 : 0), 0, Math.PI * 2);
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

function generateDust() {
    const spawnChance = Math.random();
    const dustCountLocal = spawnChance < 0.5 ? 1 : spawnChance < 0.75 ? 2 : 0;
    for (let i = 0; i < dustCountLocal; i++) {
        const dust = {
            width: 60, height: 60, visible: true, timeLeft: 10,
            growth: 10, maxGrowth: Math.random() * 40 + 30,
            value: shrinkActive ? 1 : (Math.random() < 0.5 ? 1 : Math.random() < 0.75 ? 2 : 3),
            health: 2,
            x: player.x + player.width / 2 + (Math.random() - 0.5) * 400,
            y: player.y + player.height / 2 + (Math.random() - 0.5) * 200,
            tentacle: 0, driftX: 0, driftY: 0
        };
        dustParticles.push(dust);
    }
    setTimeout(() => { player.farting = false; }, 400);
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
            switch (dust.value) {
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
    switch (value) {
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
            console.log('Leaderboard empty or not fetched');
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
    console.log('Fetching leaderboard...');
    db.collection('leaderboard')
        .orderBy('score', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            console.log('Fetched docs:', querySnapshot.size);
            leaderboardData = [];
            if (querySnapshot.empty) {
                leaderboardData.push({ name: 'No scores yet!', score: '' });
            } else {
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.name.includes(chillMode ? 'Chill' : 'L')) {
                        leaderboardData.push(data);
                    }
                });
            }
            if (leaderboardData.length === 0) leaderboardData.push({ name: 'No scores yet!', score: '' });
        })
        .catch(err => console.error('Fetch failed:', err));
}

function updateLeaderboard(newScore) {
    console.log('updateLeaderboard called with:', newScore);
    if (newScore > 0 && newScore < 10000) {
        console.log('Sending:', playerName, newScore);
        db.collection('leaderboard').doc(playerName + (chillMode ? '_chill' : '_game')).set({
            name: `${playerName} (${chillMode ? 'Chill' : 'L' + currentLevel})`,
            score: newScore,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
            .then(() => console.log('Score saved:', playerName, newScore))
            .catch(err => console.error('Leaderboard error:', err));
    }
}

function playSoundEffect(effectName) {
    if (!isMuted && soundEffectsMap[effectName] !== undefined) {
        soundEffects.currentTime = soundEffectsMap[effectName];
        soundEffects.play().catch(() => console.log('Sound blocked'));
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
        if (Date.now() - lastClickTime > idleTimeout) playRandomGiggleFart();
    }, nextDelay);
}

function triggerThunder() {
    thunderWarning = 1;
    let dustCollected = 0;
    setTimeout(() => { thunderWarning = 0; }, 300);
    setTimeout(() => { thunderWarning = 1; }, 400);
    setTimeout(() => { thunderWarning = 0; }, 600);
    setTimeout(() => { thunderWarning = 1; }, 700);
    setTimeout(() => { thunderWarning = 0; }, 800);
    setTimeout(() => { thunderWarning = 1; }, 900);
    setTimeout(() => {
        thunderWarning = 0;
        thunderActive = true;
        if (!chillMode) {
            if (shieldActive) {
                dusterStrength = dustCollected > 0 ? Math.min(dustCollected, 3) : 0;
                shieldCharged = dusterStrength > 0;
                shieldActive = false;
                shieldTimer = 0;
                if (dusterStrength === 3) hornsUpTimer = 2;
                ctx.fillText(shieldCharged ? `Shield charged (S${dusterStrength})!` : 'Shield holds!', canvas.width / 2, 50);
            } else if (!shieldCharged) {
                dustParticles.length = 0;
                player.health -= 20;
                ctx.fillText('Thunder hits!', canvas.width / 2, 50);
            }
        }
        dustCollected = 0;
        setTimeout(() => { thunderActive = false; }, 1200);
    }, 1000);

    window.collectDustDuringStorm = () => {
        if (thunderWarning) dustCollected++;
    };
}
// Sticky_UFD Game - Part 3: Game Loop & Settings
setTimeout(() => {
    if (Date.now() - lastClickTime > idleTimeout) playRandomGiggleFart();
}, Math.floor(Math.random() * (21000 - 7000 + 1)) + 7000);

function drawSettings() {
    if (showSettings) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(canvas.width - 200, 10, 190, 210);
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width - 200, 10, 190, 210);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Settings', canvas.width - 190, 40);
        ctx.fillText(isMuted ? 'Unmute (M)' : 'Mute (M)', canvas.width - 190, 70);
        ctx.fillText(isMusicOn ? 'Music Off (N)' : 'Music On (N)', canvas.width - 190, 100);
        ctx.fillText(`Scene: ${scenes[currentScene].name} (B)`, canvas.width - 190, 130);
        ctx.fillText('Leaderboard (L)', canvas.width - 190, 160);
        ctx.fillText(chillMode ? 'Chill Off (H)' : 'Chill On (H)', canvas.width - 190, 190);
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

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        drawBackground();
        drawUnicorn();
        if (!chillMode && thunderWarning === 1) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Thunder incoming!', canvas.width / 2, 50);
        }
        if (!chillMode && thunderActive) {
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
            setTimeout(() => { thunderActive = false; }, 800);
        }
        drawDust();
        drawBanner();

        if (power < 1) {
            power += (1 / powerChargeTime) / 60;
            if (power > 1) power = 1;
        }

        if (!chillMode) {
            envTimer += 1 / 60;
            if (envTimer >= envMaxDelay) {
                envTimer = Math.random() * envMaxDelay;
                triggerThunder();
            }
            if (gameDust >= 2000 && currentLevel < 5) {
                currentLevel = 5; envMaxDelay = 3;
                currentScene = 4;
                backgroundVideo.src = scenes[currentScene].src; backgroundVideo.play();
            } else if (gameDust >= 1000 && currentLevel < 4) {
                currentLevel = 4; envMaxDelay = 6;
                currentScene = 3;
                backgroundVideo.src = scenes[currentScene].src; backgroundVideo.play();
            } else if (gameDust >= 500 && currentLevel < 3) {
                currentLevel = 3; envMaxDelay = 9;
                currentScene = 2;
                backgroundVideo.src = scenes[currentScene].src; backgroundVideo.play();
            } else if (gameDust >= 200 && currentLevel < 2) {
                currentLevel = 2; envMaxDelay = 12;
                currentScene = 1;
                backgroundVideo.pause(); backgroundVideo.src = '';
            }
        }

        if (hornsUpTimer > 0) {
            hornsUpTimer -= 1 / 60;
            ctx.fillText('Horns Up!', canvas.width / 2, 70);
            if (hornsUpTimer <= 0) dusterStrength = 0;
        }
        if (shieldActive) {
            ctx.fillText('Shield up—collect dust!', canvas.width / 2, 50);
        } else if (shieldCharged) {
            ctx.fillText(`Shield charged (S${dusterStrength})—tap X to strike!`, canvas.width / 2, 50);
        }

        if (!chillMode && gameDust >= bearomeThreshold - 50 && bearomeWarnings < 3) {
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
                        if (!isMuted) hornTingleSound.play().catch(() => console.log('Tingle blocked'));
                        break;
                    case 2:
                        ctx.fillText('Bearome Scowel: Feel my wrath brewing!', canvas.width / 2, 30);
                        if (!isMuted) feelSomethingSound.play().catch(() => console.log('Feel blocked'));
                        break;
                    case 3:
                        ctx.fillText('Bearome Scowel: Glitter storm incoming!', canvas.width / 2, 30);
                        if (!isMuted) uhOhSound.play().catch(() => console.log('Uh oh blocked'));
                        bearomeActive = true;
                        setTimeout(() => {
                            if (!shieldActive && !shieldCharged) {
                                shrinkActive = true;
                                shrinkDuration = 10;
                                dustParticles.forEach(dust => dust.value = 1);
                                for (let i = 0; i < 50; i++) {
                                    dustPixels.push({
                                        x: canvas.width / 2,
                                        y: canvas.height / 2,
                                        vx: (Math.random() - 0.5) * 30,
                                        vy: (Math.random() - 0.5) * 30,
                                        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                                        timeLeft: 1
                                    });
                                }
                            }
                            bearomeActive = false;
                            bearomeWarnings = 0;
                            bearomeThreshold = Math.floor(Math.random() * 251) + 500;
                        }, 1000);
                        break;
                }
            }
        }
        if (shrinkActive) {
            shrinkDuration -= 1 / 60;
            if (shrinkDuration <= 0) shrinkActive = false;
            ctx.fillText('Glitter Bomb—dust shrunk!', canvas.width / 2, 90);
        }

        if (showUnicornWizard && unicornWizardImg.complete) {
            ctx.drawImage(unicornWizardImg, canvas.width - 300, canvas.height / 2 - 100, 200, 200);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            if (unicornWizardStep === 0) {
                ctx.fillText('Unicorn Wizard: Welcome Dust Collectors!', canvas.width - 150, canvas.height / 2 + 120);
            } else if (unicornWizardStep === 1) {
                ctx.fillText('Unicorn Wizard: Tap to gather fart dust!', canvas.width - 150, canvas.height / 2 + 120);
            } else if (unicornWizardStep === 2) {
                ctx.fillText('Unicorn Wizard: Shield from Bearome’s thunder!', canvas.width - 150, canvas.height / 2 + 120);
                setTimeout(() => { showUnicornWizard = false; unicornWizardStep = 3; }, 4000);
            } else if (unicornWizardStep === 3) {
                ctx.fillText('Unicorn Wizard: Dust Master!', canvas.width - 150, canvas.height / 2 + 120);
                setTimeout(() => { showUnicornWizard = false; }, 4000);
            } else if (unicornWizardStep === 4) {
                ctx.fillText('Unicorn Wizard: Glitter Hoof Legend!', canvas.width - 150, canvas.height / 2 + 120);
                setTimeout(() => { showUnicornWizard = false; }, 4000);
            }
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
        ctx.fillRect(10, chillMode ? 80 : 130, 200 * power, 20);
        ctx.strokeStyle = '#FF69B4';
        ctx.strokeRect(10, chillMode ? 80 : 130, 200, 20);

        ctx.fillStyle = power >= 1 && !shieldActive && !shieldCharged ? '#FFFF00' : 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(150, canvas.height - 150, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = shieldCharged ? '#FFFF00' : '#FF69B4';
        ctx.lineWidth = shieldCharged ? 5 : 3;
        ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.fillText(shieldCharged ? 'Strike (X)' : 'Shield (S)', 150, canvas.height - 145);

        ctx.fillStyle = power >= 1 && !collectAllReady ? '#FFFF00' : 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(canvas.width - 150, canvas.height - 150, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF69B4';
        ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.fillText('Collect', canvas.width - 150, canvas.height - 145);
        ctx.fillText('(C)', canvas.width - 150, canvas.height - 125);

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'right';
        ctx.fillText('Settings (Tab)', canvas.width - 20, 30);
        ctx.textAlign = 'center';
        ctx.fillText('Chill Mode', canvas.width / 2 - 50, 30);
        if (chillMode) {
            ctx.fillStyle = power >= 1 ? '#FFFF00' : 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(canvas.width / 2 + 50, 20, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FF69B4';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#000000';
            ctx.font = '16px Arial';
            ctx.fillText('Game', canvas.width / 2 + 50, 25);
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
    }
    drawSettings();
    drawLeaderboard();
    requestAnimationFrame(gameLoop);
}
// Sticky_UFD Game - Part 4: Interactions & Events
canvas.addEventListener('click', function (event) {
    lastClickTime = Date.now();
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    if (isLocked) {
        if (x >= canvas.width / 2 - 100 && x <= canvas.width / 2 + 100 &&
            y >= canvas.height / 2 - 50 && y <= canvas.height / 2 + 50) {
            isLocked = false;
            showUnicornWizard = true;
            unicornWizardStep = 0;
            if (!isMuted) buttercupSound.play().catch(() => console.log('Buttercup blocked'));
        }
        return;
    }

    if (!chillMode && player.health <= 0) {
        if (x >= canvas.width / 2 - 100 && x <= canvas.width / 2 + 100 &&
            y >= canvas.height / 2 + 20 && y <= canvas.height / 2 + 60) {
            player.health = 100;
            gameDust = 0;
            currentLevel = 1;
            envMaxDelay = 15;
            dustParticles.length = 0;
            power = 0;
            currentScene = 0;
            backgroundVideo.pause(); backgroundVideo.src = '';
        }
        return;
    }

    if (showSettings) {
        if (x >= canvas.width - 200 && x <= canvas.width - 10 && y >= 10 && y <= 220) {
            if (Math.sqrt((x - (canvas.width - 20)) ** 2 + (y - 30) ** 2) <= 15) {
                showSettings = false;
                return;
            }
            if (y >= 50 && y <= 80) {
                isMuted = !isMuted;
                if (isMuted) {
                    soundEffects.pause();
                    backgroundMusic.pause();
                    fartSounds.forEach(f => f.pause());
                } else {
                    toggleMusic();
                }
            } else if (y >= 80 && y <= 110) {
                isMusicOn = !isMusicOn;
                toggleMusic();
            } else if (y >= 110 && y <= 140) {
                currentScene = (currentScene + 1) % scenes.length;
                if (scenes[currentScene].type === 'video') {
                    backgroundVideo.src = scenes[currentScene].src;
                    backgroundVideo.play();
                } else {
                    backgroundVideo.pause();
                    backgroundVideo.src = '';
                }
                isDarkMode = scenes[currentScene].name === 'Night';
                document.body.classList.toggle('dark-mode', isDarkMode);
            } else if (y >= 140 && y <= 170) {
                console.log('Leaderboard clicked!');
                showLeaderboard = true;
                fetchLeaderboard();
                showSettings = false;
            } else if (y >= 170 && y <= 200) {
                chillMode = !chillMode;
                if (chillMode) {
                    player.health = 100;
                    currentLevel = 1;
                    envMaxDelay = 15;
                    currentScene = 0;
                    backgroundVideo.pause(); backgroundVideo.src = '';
                }
            }
            return;
        }
    }

    if (x >= canvas.width - 150 && x <= canvas.width - 10 && y >= 10 && y <= 40) {
        showSettings = !showSettings;
        return;
    }

    if (x >= canvas.width / 2 - 100 && x <= canvas.width / 2 + 100 && y >= canvas.height - 30 && y <= canvas.height - 10) {
        window.open('https://unicornfartdust.com', '_blank');
        return;
    }

    if (showLeaderboard) {
        showLeaderboard = false;
        return;
    }

    if (showUnicornWizard && unicornWizardStep < 3) {
        unicornWizardStep++;
        return;
    }

    if (chillMode && Math.sqrt((x - (canvas.width / 2 + 50)) ** 2 + (y - 20) ** 2) <= 20 && power >= 1) {
        chillMode = false;
        gameDust = 0;
        currentLevel = 1;
        envMaxDelay = 15;
        envTimer = 0;
        player.health = 100;
        dustParticles.length = 0;
        return;
    }

    if (Math.sqrt((x - 150) ** 2 + (y - (canvas.height - 150)) ** 2) <= 50) {
        if (power >= 1 && !shieldActive && !shieldCharged) {
            shieldActive = true;
            power = 0;
            powerChargeTime = 10;
            ctx.fillText('Shield up!', canvas.width / 2, 50);
        } else if (shieldCharged) {
            shieldCharged = false;
            let collected = 0;
            for (let j = dustParticles.length - 1; j >= 0; j--) {
                const dust = dustParticles[j];
                const dx = dust.x - x;
                const dy = dust.y - y;
                if (dust.visible && (hornsUpTimer > 0 ? Math.sqrt(dx * dx + dy * dy) <= 100 : true)) {
                    collected += dust.value * (1 + dusterStrength * 0.3);
                    explodeDust(dust.x, dust.y, dust.value);
                    dustParticles.splice(j, 1);
                }
            }
            if (chillMode) chillDust += Math.floor(collected); else gameDust += Math.floor(collected);
            ctx.fillText(`Shield Strike (S${dusterStrength}): +${Math.floor(collected)}!`, canvas.width / 2, 50);
            updateLeaderboard(chillMode ? chillDust : gameDust);
            if (dusterStrength === 3) hornsUpTimer = 2;
            dusterStrength = 0;
        }
        return;
    }

    if (Math.sqrt((x - (canvas.width - 150)) ** 2 + (y - (canvas.height - 150)) ** 2) <= 50 && power >= 1 && !collectAllReady) {
        collectAllReady = true;
        power = 0;
        powerChargeTime = 10;
        let collected = 0;
        for (let j = dustParticles.length - 1; j >= 0; j--) {
            if (dustParticles[j].visible) {
                collected += dustParticles[j].value;
                explodeDust(dustParticles[j].x, dustParticles[j].y, dustParticles[j].value);
                dustParticles.splice(j, 1);
            }
        }
        if (chillMode) chillDust += collected; else gameDust += collected;
        ctx.fillText(`Swept up ${collected} dust!`, canvas.width / 2, 110);
        collectAllReady = false;
        updateLeaderboard(chillMode ? chillDust : gameDust);
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
            dust.health--;
            if (dust.health <= 0) {
                if (chillMode) chillDust += dust.value; else gameDust += dust.value;
                if (dust.value === 3 && player.health < 100 && !chillMode) {
                    player.health = Math.min(100, player.health + 5);
                    ctx.fillStyle = '#00FF00';
                    ctx.fillText('+5 Health', dust.x, dust.y - 40);
                }
                explodeDust(dust.x, dust.y, dust.value);
                ctx.font = '20px Arial';
                ctx.fillStyle = '#ffcc00';
                ctx.fillText(`+${dust.value} Dust`, dust.x, dust.y - 20);
                dustParticles.splice(i, 1);
                playSoundEffect('pop');
                if (power < 1) {
                    let remainingTime = powerChargeTime * (1 - power);
                    remainingTime = Math.max(0, remainingTime - 1);
                    power = 1 - (remainingTime / powerChargeTime);
                }
                if (shieldActive && thunderWarning) {
                    window.collectDustDuringStorm();
                }
                if ((chillMode ? chillDust : gameDust) >= 125 && (chillMode ? chillDust : gameDust) - dust.value < 125 && !isMuted) {
                    fanfareSound.play().catch(() => console.log('Fanfare blocked'));
                    setTimeout(() => {
                        showUnicornWizard = true;
                        unicornWizardStep = 3;
                        dusterSound.play().catch(() => console.log('Duster blocked'));
                    }, 1000);
                }
                if ((chillMode ? chillDust : gameDust) >= 1000 && (chillMode ? chillDust : gameDust) - dust.value < 1000 && !isMuted) {
                    showUnicornWizard = true;
                    unicornWizardStep = 4;
                    diamondHoofSound.play().catch(() => console.log('Diamond blocked'));
                }
                updateLeaderboard(chillMode ? chillDust : gameDust);
            } else {
                ctx.fillStyle = '#FF0000';
                ctx.fillText('Crack!', dust.x, dust.y - 20);
                playSoundEffect('fizzle');
            }
            break;
        }
    }
});

document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'm') {
        isMuted = !isMuted;
        if (isMuted) {
            soundEffects.pause();
            backgroundMusic.pause();
            fartSounds.forEach(f => f.pause());
        } else {
            toggleMusic();
        }
    }
    if (key === 'n') {
        isMusicOn = !isMusicOn;
        toggleMusic();
    }
    if (key === 'b') {
        currentScene = (currentScene + 1) % scenes.length;
        if (scenes[currentScene].type === 'video') {
            backgroundVideo.src = scenes[currentScene].src;
            backgroundVideo.play();
        } else {
            backgroundVideo.pause();
            backgroundVideo.src = '';
        }
        isDarkMode = scenes[currentScene].name === 'Night';
        document.body.classList.toggle('dark-mode', isDarkMode);
    }
    if (key === 'l') {
        console.log('Leaderboard toggled!');
        showLeaderboard = !showLeaderboard;
        if (showLeaderboard) fetchLeaderboard();
        showSettings = false;
    }
    if (key === 's' && power >= 1 && !shieldActive && !shieldCharged) {
        shieldActive = true;
        power = 0;
        powerChargeTime = 10;
        ctx.fillText('Shield up!', canvas.width / 2, 50);
    }
    if (key === 'x' && shieldCharged) {
        shieldCharged = false;
        let collected = 0;
        for (let j = dustParticles.length - 1; j >= 0; j--) {
            const dust = dustParticles[j];
            const dx = dust.x - (canvas.width / 2); // Center-ish for key press
            const dy = dust.y - (canvas.height / 2);
            if (dust.visible && (hornsUpTimer > 0 ? Math.sqrt(dx * dx + dy * dy) <= 100 : true)) {
                collected += dust.value * (1 + dusterStrength * 0.3);
                explodeDust(dust.x, dust.y, dust.value);
                dustParticles.splice(j, 1);
            }
        }
        if (chillMode) chillDust += Math.floor(collected); else gameDust += Math.floor(collected);
        ctx.fillText(`Shield Strike (S${dusterStrength}): +${Math.floor(collected)}!`, canvas.width / 2, 50);
        updateLeaderboard(chillMode ? chillDust : gameDust);
        if (dusterStrength === 3) hornsUpTimer = 2;
        dusterStrength = 0;
    }
    if (key === 'c' && power >= 1 && !collectAllReady) {
        collectAllReady = true;
        power = 0;
        powerChargeTime = 10;
        let collected = 0;
        for (let j = dustParticles.length - 1; j >= 0; j--) {
            if (dustParticles[j].visible) {
                collected += dustParticles[j].value;
                explodeDust(dustParticles[j].x, dustParticles[j].y, dustParticles[j].value);
                dustParticles.splice(j, 1);
            }
        }
        if (chillMode) chillDust += collected; else gameDust += collected;
        ctx.fillText(`Swept up ${collected} dust!`, canvas.width / 2, 110);
        collectAllReady = false;
        updateLeaderboard(chillMode ? chillDust : gameDust);
    }
    if (key === 'tab') {
        showSettings = !showSettings;
        event.preventDefault();
    }
    if (key === 'escape') {
        showSettings = false;
    }
    if (key === 'h') {
        chillMode = !chillMode;
        if (chillMode) {
            player.health = 100;
            currentLevel = 1;
            envMaxDelay = 15;
            currentScene = 0;
            backgroundVideo.pause(); backgroundVideo.src = '';
        }
    }
    if (key === 'g' && chillMode && power >= 1) {
        chillMode = false;
        gameDust = 0;
        currentLevel = 1;
        envMaxDelay = 15;
        envTimer = 0;
        player.health = 100;
        dustParticles.length = 0;
    }
    lastClickTime = Date.now();
});

unicornImg.onload = function () { gameLoop(); };
unicornImg.onerror = () => console.error('Unicorn image failed');