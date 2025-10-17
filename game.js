const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const spellButtons = document.querySelectorAll('.spell-button');
const logMessages = document.getElementById('log-messages');
const gameOverDiv = document.getElementById('game-over');
const gameOverMessage = document.getElementById('game-over-message');
const gameOverSubmessage = document.getElementById('game-over-submessage');

const WIDTH = 1900, HEIGHT = 1000;
const MAGE_HP = 100;
const COLORS = {
    WHITE: '#FFFFFF', BLACK: '#000000', RED: '#DC3232', BLUE: '#3250DC',
    GREEN: '#3CC83C', YELLOW: '#FADC32', ORANGE: '#FF8C00', PURPLE: '#A03CC8',
    DARKRED: '#8B0000', CYAN: '#00B4FF', DARKGRAY: '#646464', LIGHTBLUE: '#ADD8E6', PINK: '#FFC0CB'
};

class Spell {
    constructor(name, damage, accuracy, spellType, cooldown, description) {
        this.name = name;
        this.damage = damage;
        this.accuracy = accuracy;
        this.spellType = spellType;
        this.cooldown = cooldown;
        this.description = description;
    }
}

class Mage {
    constructor(x, y, color, name = "Mago") {
        this.x = x;
        this.y = y;
        this.color = color;
        this.name = name;
        this.hp = MAGE_HP;
        this.maxHp = MAGE_HP;
        this.poisonTurns = 0;
        this.isStunned = false;
        this.spellCooldowns = {};
        this.castingAnimation = 0;
        this.damageAnimation = 0;
        this.potionCount = 3;
    }

    draw() {
        // Efeito de animação ao conjurar
        if (this.castingAnimation > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 40 + this.castingAnimation * 10, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(160, 60, 200, 0.5)`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Efeito de dano
        let color = this.color;
        if (this.damageAnimation > 0) {
            color = `rgb(${Math.min(255, parseInt(this.color.slice(1, 3), 16) + this.damageAnimation * 50)},
                          ${Math.min(255, parseInt(this.color.slice(3, 5), 16) + this.damageAnimation * 50)},
                          ${Math.min(255, parseInt(this.color.slice(5, 7), 16) + this.damageAnimation * 50)})`;
        }

        // Corpo do mago
        ctx.beginPath();
        ctx.arc(this.x, this.y, 40, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // Cabeça
        ctx.beginPath();
        ctx.arc(this.x, this.y - 50, 25, 0, 2 * Math.PI);
        ctx.fillStyle = '#F0D4B4';
        ctx.fill();

        // Olhos
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 55, 4, 0, 2 * Math.PI);
        ctx.arc(this.x + 8, this.y - 55, 4, 0, 2 * Math.PI);
        ctx.fillStyle = COLORS.BLACK;
        ctx.fill();

        // Chapéu
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 90);
        ctx.lineTo(this.x - 30, this.y - 40);
        ctx.lineTo(this.x + 30, this.y - 40);
        ctx.closePath();
        ctx.fillStyle = COLORS.PURPLE;
        ctx.fill();

        // Estrela no chapéu
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            let angle = (i * 72 - 90) * Math.PI / 180;
            let x = this.x + 10 * Math.cos(angle);
            let y = this.y - 75 + 10 * Math.sin(angle);
            ctx[i % 2 === 0 ? 'lineTo' : 'moveTo'](x, y);
        }
        ctx.closePath();
        ctx.fillStyle = COLORS.YELLOW;
        ctx.fill();

        // Barra de vida
        let barWidth = 120, barHeight = 12;
        let healthRatio = Math.max(0, this.hp) / this.maxHp;
        ctx.fillStyle = COLORS.DARKGRAY;
        ctx.fillRect(this.x - 60, this.y - 120, barWidth, barHeight);
        ctx.fillStyle = healthRatio > 0.6 ? COLORS.GREEN : healthRatio > 0.3 ? COLORS.YELLOW : COLORS.RED;
        ctx.fillRect(this.x - 60, this.y - 120, barWidth * healthRatio, barHeight);

        // Texto da vida
        ctx.font = '20px Arial';
        ctx.fillStyle = COLORS.WHITE;
        ctx.textAlign = 'center';
        ctx.fillText(`${this.hp}/${this.maxHp}`, this.x, this.y - 130);

        // Efeitos de status
        let statusY = this.y + 60;
        if (this.poisonTurns > 0) {
            for (let i = 0; i < 3; i++) {
                let bubbleX = this.x + (Math.random() * 40 - 20);
                let bubbleY = this.y + (Math.random() * 20 - 10);
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, 3, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
                ctx.fill();
            }
            ctx.fillStyle = COLORS.GREEN;
            ctx.fillText(`Veneno: ${this.poisonTurns}`, this.x, statusY);
            statusY += 25;
        }
        if (this.isStunned) {
            ctx.fillStyle = COLORS.YELLOW;
            ctx.fillText('ATORDOADO', this.x, statusY);
            for (let i = 0; i < 4; i++) {
                let angle = (i * 90 + Date.now() * 0.1) % 360 * Math.PI / 180;
                let endX = this.x + 60 * Math.cos(angle);
                let endY = this.y + 60 * Math.sin(angle);
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = COLORS.YELLOW;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }
    }

    updateAnimations() {
        if (this.castingAnimation > 0) this.castingAnimation -= 0.05;
        if (this.damageAnimation > 0) this.damageAnimation -= 0.1;
    }

    startCasting() { this.castingAnimation = 1.0; }
    takeDamage() { this.damageAnimation = 1.0; }
}

class Game {
    constructor() {
        this.player = new Mage(300, HEIGHT / 2, COLORS.BLUE, "Você");
        this.enemy = new Mage(WIDTH - 300, HEIGHT / 2, COLORS.RED, "Inimigo");
        this.spells = {
            fireball: new Spell("Bola de Fogo", 30, 0.75, "fire", 3, "Projétil flamejante poderoso"),
            lightning: new Spell("Zap", 20, 0.85, "lightning", 2, "Raio rápido que causa dano direto"),
            poison: new Spell("Veneno", 12, 0.8, "poison", 4, "Veneno que persiste por 3 turnos"),
            heal: new Spell("Cura Divina", -25, 1.0, "heal", 5, "Restaura pontos de vida")
        };
        this.currentTurn = "player";
        this.gameStatus = "playing";
        this.turnCount = 1;
        this.log = ["O duelo começou!"];
        this.isAnimating = false;
        this.setupEventListeners();
        this.drawBackground();
        this.animate();
    }

    drawBackground() {
        // Gradiente escuro
        let gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        gradient.addColorStop(0, '#14140a');
        gradient.addColorStop(1, '#2d1e0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Estrelas
        for (let i = 0; i < 50; i++) {
            let x = Math.random() * WIDTH;
            let y = Math.random() * (HEIGHT / 2);
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, 2 * Math.PI);
            ctx.fillStyle = COLORS.WHITE;
            ctx.fill();
        }
    }

    setupEventListeners() {
        spellButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (this.currentTurn === "player" && !this.isAnimating && this.gameStatus === "playing") {
                    let spellId = button.dataset.spell;
                    let cooldown = this.player.spellCooldowns[spellId] || 0;
                    if (cooldown === 0 && !this.player.isStunned && (spellId !== "heal" || this.player.potionCount > 0)) {
                        this.processTurn(spellId);
                    }
                }
            });
        });
    }

    animateSpell(caster, target, spell, callback) {
        this.isAnimating = true;
        caster.startCasting();
        if (spell.spellType === "fire") {
            this.animateFireball(caster, target, callback);
        } else if (spell.spellType === "lightning") {
            this.animateLightning(caster, target, callback);
        } else if (spell.spellType === "poison") {
            this.animatePoison(target, callback);
        } else if (spell.spellType === "heal") {
            this.animateHeal(caster, callback);
        }
    }

    animateFireball(caster, target, callback) {
        let i = 0;
        let animate = () => {
            if (i >= 30) {
                this.isAnimating = false;
                callback();
                return;
            }
            let t = i / 30;
            let x = caster.x * (1 - t) + target.x * t;
            let y = caster.y * (1 - t) + target.y * t;
            this.draw();
            for (let j = 0; j < 5; j++) {
                let trailX = x - j * 10 * (target.x - caster.x) / Math.abs(target.x - caster.x || 1);
                let trailY = y - j * 3;
                let size = Math.max(5, 20 - j * 3);
                ctx.beginPath();
                ctx.arc(trailX, trailY, size, 0, 2 * Math.PI);
                ctx.fillStyle = `rgb(255, ${140 - j * 20}, ${j * 10})`;
                ctx.fill();
            }
            i++;
            requestAnimationFrame(animate);
        };
        animate();
    }

    animateLightning(caster, target, callback) {
        let frame = 0;
        let animate = () => {
            if (frame >= 10) {
                this.isAnimating = false;
                callback();
                return;
            }
            this.draw();
            let points = [];
            for (let i = 0; i <= 20; i++) {
                let t = i / 20;
                let x = caster.x + t * (target.x - caster.x) + (Math.random() * 30 - 15);
                let y = caster.y + t * (target.y - caster.y) + (Math.random() * 20 - 10);
                points.push([x, y]);
            }
            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let p of points) ctx.lineTo(p[0], p[1]);
            ctx.strokeStyle = COLORS.CYAN;
            ctx.lineWidth = 8;
            ctx.stroke();
            ctx.strokeStyle = COLORS.WHITE;
            ctx.lineWidth = 4;
            ctx.stroke();
            let midPoint = points[Math.floor(points.length / 2)];
            for (let i = 0; i < 3; i++) {
                let endX = midPoint[0] + (Math.random() * 100 - 50);
                let endY = midPoint[1] + (Math.random() * 100 - 50);
                ctx.beginPath();
                ctx.moveTo(midPoint[0], midPoint[1]);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = COLORS.CYAN;
                ctx.lineWidth = 4;
                ctx.stroke();
            }
            frame++;
            setTimeout(() => requestAnimationFrame(animate), 100);
        };
        animate();
    }

    animatePoison(target, callback) {
        let frame = 0;
        let animate = () => {
            if (frame >= 20) {
                this.isAnimating = false;
                callback();
                return;
            }
            this.draw();
            for (let i = 0; i < 15; i++) {
                let offsetX = Math.random() * 80 - 40;
                let offsetY = Math.random() * 80 - 40;
                let size = Math.random() * 20 + 5;
                ctx.beginPath();
                ctx.arc(target.x + offsetX, target.y + offsetY, size, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(139, 0, 0, ${Math.random() * 0.6 + 0.2})`;
                ctx.fill();
            }
            frame++;
            setTimeout(() => requestAnimationFrame(animate), 80);
        };
        animate();
    }

    animateHeal(caster, callback) {
        let frame = 0;
        let animate = () => {
            if (frame >= 15) {
                this.isAnimating = false;
                callback();
                return;
            }
            this.draw();
            for (let i = 0; i < 10; i++) {
                let angle = Math.random() * 2 * Math.PI;
                let distance = Math.random() * 40 + 20;
                let x = caster.x + distance * Math.cos(angle);
                let y = caster.y + distance * Math.sin(angle);
                let size = Math.random() * 5 + 3;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(250, 220, 50, 0.8)`;
                ctx.fill();
            }
            frame++;
            setTimeout(() => requestAnimationFrame(animate), 100);
        };
        animate();
    }

    applySpell(spell, caster, target) {
        let hit = Math.random() <= spell.accuracy;
        if (!hit) return `${caster.name} errou ${spell.name}!`;
        let message = "";
        if (spell.spellType === "heal") {
            if (caster.potionCount > 0) {
                let healAmount = Math.abs(spell.damage);
                caster.hp = Math.min(caster.maxHp, caster.hp + healAmount);
                caster.potionCount--;
                message = `${caster.name} se curou em ${healAmount} pontos! Poções restantes: ${caster.potionCount}`;
            } else {
                message = `${caster.name} tentou usar ${spell.name}, mas não há poções restantes!`;
            }
        } else if (spell.spellType === "poison") {
            target.hp -= spell.damage;
            target.poisonTurns = 3;
            target.takeDamage();
            message = `${caster.name} envenenou ${target.name}!`;
        } else if (spell.spellType === "lightning") {
            target.hp -= spell.damage;
            target.takeDamage();
            message = `${caster.name} atingiu ${target.name} com raio! (${spell.damage} dano)`;
        } else {
            target.hp -= spell.damage;
            target.takeDamage();
            message = `${caster.name} atingiu ${target.name} com ${spell.name}! (${spell.damage} dano)`;
        }
        return message;
    }

    updateCooldowns(mage) {
        for (let spellId in mage.spellCooldowns) {
            if (mage.spellCooldowns[spellId] > 0) {
                mage.spellCooldowns[spellId]--;
                if (mage.spellCooldowns[spellId] === 0) delete mage.spellCooldowns[spellId];
            }
        }
    }

    processTurn(spellId) {
        if (this.isAnimating || this.gameStatus !== "playing") return;
        let caster = this.currentTurn === "player" ? this.player : this.enemy;
        let target = this.currentTurn === "player" ? this.enemy : this.player;
        let spell = this.spells[spellId];

        if (caster.spellCooldowns[spellId] > 0) return;
        if (caster.isStunned) {
            caster.isStunned = false;
            this.log.push(`${caster.name} está atordoado e perdeu o turno!`);
            if (this.currentTurn === "player") {
                this.currentTurn = "enemy";
                setTimeout(() => this.enemyTurn(), 1000);
            } else {
                this.switchTurn();
            }
            return;
        }

        this.animateSpell(caster, target, spell, () => {
            let message = this.applySpell(spell, caster, target);
            this.log.push(message);
            caster.spellCooldowns[spellId] = spell.cooldown;

            if (target.poisonTurns > 0) {
                let poisonDamage = 8;
                target.hp -= poisonDamage;
                target.poisonTurns--;
                target.takeDamage();
                this.log.push(`${target.name} sofreu ${poisonDamage} de dano por veneno!`);
            }

            this.updateCooldowns(caster);
            this.updateCooldowns(target);
            caster.hp = Math.max(0, caster.hp);
            target.hp = Math.max(0, target.hp);

            if (target.hp <= 0) {
                this.gameStatus = this.currentTurn === "player" ? "victory" : "defeat";
            } else if (caster.hp <= 0) {
                this.gameStatus = this.currentTurn === "player" ? "defeat" : "victory";
            } else {
                this.switchTurn();
            }

            this.log = this.log.slice(-4);
            this.updateUI();
            if (this.currentTurn === "enemy" && this.gameStatus === "playing") {
                setTimeout(() => this.enemyTurn(), 1000);
            }
        });
    }

    switchTurn() {
        this.currentTurn = this.currentTurn === "player" ? "enemy" : "player";
        this.turnCount++;
    }

    enemyTurn() {
        if (this.currentTurn === "enemy" && !this.isAnimating && this.gameStatus === "playing") {
            let availableSpells = Object.keys(this.spells).filter(spellId => !this.enemy.spellCooldowns[spellId]);
            if (availableSpells.length) {
                let chosenSpell = availableSpells[Math.floor(Math.random() * availableSpells.length)];
                this.processTurn(chosenSpell);
            }
        }
    }

    updateUI() {
        spellButtons.forEach(button => {
            let spellId = button.dataset.spell;
            let cooldown = this.player.spellCooldowns[spellId] || 0;
            let disabled = this.isAnimating || this.player.isStunned || cooldown > 0 || (spellId === "heal" && this.player.potionCount === 0);
            button.disabled = disabled;
            button.textContent = cooldown > 0 ? `${this.spells[spellId].name} (${cooldown})` : this.spells[spellId].name;
        });
        logMessages.innerHTML = this.log.map(msg => `<li>${msg}</li>`).join('');
        if (this.gameStatus !== "playing") {
            gameOverDiv.classList.remove('hidden');
            gameOverMessage.textContent = this.gameStatus === "victory" ? "🎉 VITÓRIA! 🎉" : "💀 DERROTA 💀";
            gameOverMessage.style.color = this.gameStatus === "victory" ? COLORS.GREEN : COLORS.RED;
            gameOverSubmessage.textContent = this.gameStatus === "victory" ?
                "Parabéns! Você derrotou o mago inimigo!" :
                "O mago inimigo foi mais forte desta vez...";
        }
    }

    draw() {
        this.drawBackground();
        ctx.font = '48px Arial';
        ctx.fillStyle = COLORS.WHITE;
        ctx.textAlign = 'center';
        ctx.fillText('⚔️ DUELO DE MAGOS ⚔️', WIDTH / 2, 50);
        ctx.font = '20px Arial';
        ctx.fillStyle = COLORS.YELLOW;
        ctx.fillText(`Turno ${this.turnCount} - ${this.currentTurn.toUpperCase()}`, WIDTH / 2, 100);
        this.player.draw();
        this.enemy.draw();
        ctx.font = '48px Arial';
        ctx.fillStyle = COLORS.WHITE;
        ctx.fillText('VS', WIDTH / 2, HEIGHT / 2);
        ctx.font = '20px Arial';
        ctx.fillText(`Poções de Vida (Você): ${this.player.potionCount}/3`, 50, HEIGHT - 180);
        ctx.textAlign = 'right';
        ctx.fillText(`Poções de Vida (Inimigo): ${this.enemy.potionCount}/3`, WIDTH - 50, HEIGHT - 180);
        ctx.textAlign = 'center';
    }

    resetGame() {
        this.player = new Mage(300, HEIGHT / 2, COLORS.BLUE, "Você");
        this.enemy = new Mage(WIDTH - 300, HEIGHT / 2, COLORS.RED, "Inimigo");
        this.currentTurn = "player";
        this.gameStatus = "playing";
        this.turnCount = 1;
        this.log = ["O duelo recomeçou!"];
        this.isAnimating = false;
        gameOverDiv.classList.add('hidden');
        this.updateUI();
    }

    animate() {
        this.draw();
        this.player.updateAnimations();
        this.enemy.updateAnimations();
        this.updateUI();
        requestAnimationFrame(() => this.animate());
    }
}

const game = new Game();