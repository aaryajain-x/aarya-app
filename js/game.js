// ─── Constants ───────────────────────────────────────────────────────────────
const W = 360, H = 640;

// ─── 100-level generator ──────────────────────────────────────────────────────
function generateLevels() {
  const lvls = [];
  for (let i = 0; i < 100; i++) {
    const n = i + 1;
    let enemies, speed, shootRate, rows, boss, bossHp;

    if (n <= 50) {
      // Easy → Medium  (levels 1-50)
      const t  = i / 49;
      enemies   = Math.round(4  + t * 18);       // 4  → 22
      speed     = Math.round(60 + t * 100);       // 60 → 160
      shootRate = Math.round(5000 - t * 3700);    // 5000 → 1300
      rows      = 1 + Math.min(2, Math.floor(t * 3));
      boss      = n % 10 === 0;
      bossHp    = 8 + Math.floor(n / 10) * 4;    // 8, 12, 16, 20, 24
    } else {
      // Hard → Extreme  (levels 51-100) — starts where level 5 used to be
      const t  = (i - 50) / 49;
      enemies   = Math.round(10 + t * 26);        // 10 → 36
      speed     = Math.round(160 + t * 165);      // 160 → 325
      shootRate = Math.round(1200 - t * 810);     // 1200 → 390
      rows      = 2 + Math.min(3, Math.floor(t * 4));
      boss      = n % 5 === 0;
      bossHp    = 25 + Math.floor((n - 50) / 5) * 5; // 25 → 75
    }

    // Level 100 — FINAL BOSS
    if (n === 100) { enemies = 12; speed = 340; shootRate = 370; rows = 3; boss = true; bossHp = 80; }

    lvls.push({ enemies, speed, shootRate, rows, boss, bossHp });
  }
  return lvls;
}
const LEVELS = generateLevels();

const GUNS = [
  { key: 'basicBlaster',   name: 'Basic Blaster',    price: 0,   desc: 'Standard single shot',       bulletColor: 0x00eaff, bw: 4,  bh: 14, fireRate: 500  },
  { key: 'rapidBlaster',   name: 'Rapid Blaster',    price: 30,  desc: 'Fires 2× faster',            bulletColor: 0xffff00, bw: 3,  bh: 10, fireRate: 250  },
  { key: 'doubleShot',     name: 'Double Shot',       price: 40,  desc: 'Two side-by-side bullets',   bulletColor: 0x00ff88, bw: 4,  bh: 14, fireRate: 480  },
  { key: 'spreadShot',     name: 'Spread Shot',       price: 60,  desc: '3-bullet fan pattern',       bulletColor: 0x88ff00, bw: 4,  bh: 12, fireRate: 600  },
  { key: 'machineGun',     name: 'Machine Gun',       price: 80,  desc: 'Blazing fast fire rate',     bulletColor: 0xff8800, bw: 3,  bh: 8,  fireRate: 110  },
  { key: 'shotgun',        name: 'Shotgun',           price: 90,  desc: '5-bullet wide spread',       bulletColor: 0xff5500, bw: 6,  bh: 8,  fireRate: 900  },
  { key: 'laserCannon',    name: 'Laser Cannon',      price: 110, desc: 'Piercing laser beam',        bulletColor: 0xcc00ff, bw: 3,  bh: 28, fireRate: 300  },
  { key: 'rocketLauncher', name: 'Rocket Launcher',  price: 130, desc: 'Slow shot, huge explosion',  bulletColor: 0xff3300, bw: 12, bh: 18, fireRate: 1200 },
  { key: 'plasmaGun',      name: 'Plasma Gun',        price: 150, desc: '3-way diagonal plasma bolts',bulletColor: 0x6600ff, bw: 5,  bh: 16, fireRate: 580  },
  { key: 'railgun',        name: 'Railgun',           price: 200, desc: 'Pierces ALL enemies instantly',bulletColor: 0xffd700, bw: 2, bh: 40, fireRate: 1500 },
];

// ─── Wave difficulty scaling ──────────────────────────────────────────────────
function getScaledConfig(levelIdx, wave) {
  const base = LEVELS[levelIdx];
  const w = wave - 1;
  return {
    enemies:   Math.min(32, Math.round(base.enemies   * (1 + w * 0.35))),
    speed:     Math.round(base.speed     * (1 + w * 0.20)),
    shootRate: Math.max(380, Math.round(base.shootRate / (1 + w * 0.28))),
    rows:      Math.min(4, base.rows + Math.floor(w / 2)),
    boss:      base.boss,
    bossHp:    Math.round((base.bossHp || 20) * (1 + w * 0.3)),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTokens()  { return parseInt(localStorage.getItem('tokens') || '0'); }
function setTokens(n) { localStorage.setItem('tokens', n); }
function addTokens(n) { setTokens(getTokens() + n); }
function getUnlockedCount() { return parseInt(localStorage.getItem('unlockedLevels') || '1'); }
function unlockNextLevel(idx) {
  const cur = getUnlockedCount();
  if (idx + 1 >= cur) localStorage.setItem('unlockedLevels', idx + 2);
}
function isLevelUnlocked(idx) { return idx < getUnlockedCount(); }

function getOwnedGuns() {
  try { return JSON.parse(localStorage.getItem('ownedGuns') || '["basicBlaster"]'); }
  catch { return ['basicBlaster']; }
}
function ownGun(key) {
  const owned = getOwnedGuns();
  if (!owned.includes(key)) { owned.push(key); localStorage.setItem('ownedGuns', JSON.stringify(owned)); }
}
function getEquippedGun() { return localStorage.getItem('equippedGun') || 'basicBlaster'; }
function setEquippedGun(key) { localStorage.setItem('equippedGun', key); }

// ─── MenuScene ───────────────────────────────────────────────────────────────
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    makeStars(this);
    this.add.text(W/2, 100, 'SPACE', { fontSize: '44px', fill: '#00eaff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
    this.add.text(W/2, 150, 'SHOOTER', { fontSize: '48px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
    this.add.text(W/2, 200, `Tokens: ${getTokens()}`, { fontSize: '19px', fill: '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5);

    const gun = GUNS.find(g => g.key === getEquippedGun()) || GUNS[0];
    this.add.text(W/2, 224, `Gun: ${gun.name}`, { fontSize: '13px', fill: '#aaaaaa', fontFamily: 'Arial' }).setOrigin(0.5);
    this.add.text(W/2, 244, `Progress: ${getUnlockedCount()} / 100 levels`, { fontSize: '13px', fill: '#556677', fontFamily: 'Arial' }).setOrigin(0.5);

    makeBtn(this, W/2, 310, 'PLAY',         '#00cc44', () => this.scene.start('Game', { level: 0 }));
    makeBtn(this, W/2, 385, 'SELECT LEVEL', '#0088ff', () => this.scene.start('LevelSelect'));
    makeBtn(this, W/2, 460, 'GUN SHOP',     '#cc00ff', () => this.scene.start('GunShop'));
    makeBtn(this, W/2, 535, 'UPGRADES',     '#336699', () => this.scene.start('Shop'));
  }
}

// ─── LevelSelectScene ────────────────────────────────────────────────────────
class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelect'); }

  create() {
    makeStars(this);
    this.page = 0;
    // 20 per page (5 cols × 4 rows)
    this.cols = 5; this.rows = 4; this.perPage = 20;

    this.add.text(W/2, 28, 'SELECT LEVEL', { fontSize: '26px', fill: '#00eaff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
    this.unlockedTxt = this.add.text(W/2, 56, `Unlocked: ${getUnlockedCount()} / 100`, { fontSize: '14px', fill: '#aaaaaa', fontFamily: 'Arial' }).setOrigin(0.5);

    this.grid = this.add.container(0, 0);
    this._renderGrid();

    // Navigation
    this.prevBtnBg = this.add.rectangle(44, 600, 72, 38, 0x333366).setInteractive({ useHandCursor: true });
    this.add.text(44, 600, '◀', { fontSize: '20px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);
    this.prevBtnBg.on('pointerdown', () => { if (this.page > 0) { this.page--; this._renderGrid(); } });

    this.nextBtnBg = this.add.rectangle(W - 44, 600, 72, 38, 0x333366).setInteractive({ useHandCursor: true });
    this.add.text(W - 44, 600, '▶', { fontSize: '20px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);
    this.nextBtnBg.on('pointerdown', () => { if ((this.page + 1) * this.perPage < LEVELS.length) { this.page++; this._renderGrid(); } });

    makeBtn(this, W/2, 600, 'MENU', '#444444', () => this.scene.start('Menu'), 140);

    // Locked flash message
    this.lockedMsg = this.add.text(W/2, 570, '', { fontSize: '14px', fill: '#ff4444', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(10);
  }

  _renderGrid() {
    this.grid.removeAll(true);
    this.unlockedTxt.setText(`Unlocked: ${getUnlockedCount()} / 100`);

    const cellW = 62, cellH = 58, gapX = 4, gapY = 5;
    const gridW = this.cols * cellW + (this.cols - 1) * gapX;
    const startX = (W - gridW) / 2 + cellW / 2;
    const startY = 82;
    const unlocked = getUnlockedCount();
    const start = this.page * this.perPage;

    for (let i = 0; i < this.perPage; i++) {
      const idx = start + i;
      if (idx >= LEVELS.length) break;
      const lvl = LEVELS[idx];
      const n   = idx + 1;
      const col = i % this.cols;
      const row = Math.floor(i / this.cols);
      const cx  = startX + col * (cellW + gapX);
      const cy  = startY + row * (cellH + gapY);
      const locked = !isLevelUnlocked(idx);

      // Difficulty tier colour
      let bgColor;
      if (locked)     bgColor = 0x1a1a1a;
      else if (n <= 25)  bgColor = 0x0a2a0a;  // green  (easy)
      else if (n <= 50)  bgColor = 0x2a2a00;  // yellow (medium)
      else if (n <= 75)  bgColor = 0x2a1200;  // orange (hard)
      else               bgColor = 0x2a0000;  // red    (extreme)

      const borderColor = locked ? 0x333333
        : lvl.boss ? 0xff4444
        : n <= 25  ? 0x00cc44
        : n <= 50  ? 0xddcc00
        : n <= 75  ? 0xff8800
        :            0xff2222;

      const cell = this.add.rectangle(cx, cy, cellW - 2, cellH - 2, bgColor).setStrokeStyle(locked ? 1 : 2, borderColor);

      const numStyle = { fontSize: '15px', fill: locked ? '#444' : '#fff', fontStyle: 'bold', fontFamily: 'Arial' };
      const numTxt = this.add.text(cx, cy - 8, String(n), numStyle).setOrigin(0.5);

      let iconTxt;
      if (locked) {
        iconTxt = this.add.text(cx, cy + 11, '🔒', { fontSize: '14px', fontFamily: 'Arial' }).setOrigin(0.5);
      } else if (lvl.boss) {
        iconTxt = this.add.text(cx, cy + 11, '👑', { fontSize: '14px', fontFamily: 'Arial' }).setOrigin(0.5);
      } else {
        // Tiny difficulty bar
        const barW = Math.round((n / 100) * (cellW - 14));
        const bar  = this.add.rectangle(cx - (cellW - 14) / 2 + barW / 2, cy + 16, barW, 4, borderColor);
        this.grid.add(bar);
      }

      if (!locked) {
        cell.setInteractive({ useHandCursor: true });
        cell.on('pointerover', () => cell.setAlpha(0.75));
        cell.on('pointerout',  () => cell.setAlpha(1));
        cell.on('pointerdown', () => this.scene.start('Game', { level: idx, wave: 1 }));
      } else {
        cell.setInteractive({ useHandCursor: true });
        cell.on('pointerdown', () => {
          this.lockedMsg.setText(`Complete Level ${idx} first! 🔒`);
          this.time.delayedCall(2000, () => this.lockedMsg.setText(''));
        });
      }

      this.grid.add([cell, numTxt]);
      if (iconTxt) this.grid.add(iconTxt);
    }

    // Page indicator
    const totalPages = Math.ceil(LEVELS.length / this.perPage);
    this.grid.add(
      this.add.text(W/2, startY + this.rows * (cellH + gapY) + 10,
        `Page ${this.page + 1} / ${totalPages}  (Levels ${this.page * this.perPage + 1}–${Math.min(100, (this.page + 1) * this.perPage)})`,
        { fontSize: '13px', fill: '#555', fontFamily: 'Arial' }).setOrigin(0.5)
    );
  }
}

// ─── GunShopScene ─────────────────────────────────────────────────────────────
class GunShopScene extends Phaser.Scene {
  constructor() { super('GunShop'); }

  create() {
    makeStars(this);
    this.page = 0;
    this.perPage = 4;

    this.add.text(W/2, 32, 'GUN SHOP', { fontSize: '28px', fill: '#cc00ff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
    this.tokenTxt = this.add.text(W/2, 62, `Tokens: ${getTokens()}`, { fontSize: '17px', fill: '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5);

    this.cardContainer = this.add.container(0, 0);
    this._renderPage();

    // Nav buttons
    this.prevBtn = makeBtn(this, 70, 600, '◀ PREV', '#333366', () => { if (this.page > 0) { this.page--; this._renderPage(); } });
    this.nextBtn = makeBtn(this, W - 70, 600, 'NEXT ▶', '#333366', () => { if ((this.page + 1) * this.perPage < GUNS.length) { this.page++; this._renderPage(); } });
    makeBtn(this, W/2, 600, 'MENU', '#444444', () => this.scene.start('Menu'));
  }

  _renderPage() {
    this.cardContainer.removeAll(true);
    const owned = getOwnedGuns();
    const equipped = getEquippedGun();
    const start = this.page * this.perPage;
    const pageGuns = GUNS.slice(start, start + this.perPage);

    pageGuns.forEach((gun, i) => {
      const y = 100 + i * 118;
      const isOwned    = owned.includes(gun.key);
      const isEquipped = equipped === gun.key;
      const bgColor = isEquipped ? 0x2a0066 : isOwned ? 0x1a3322 : 0x1a1a2e;
      const borderColor = isEquipped ? 0xcc00ff : isOwned ? 0x00cc44 : 0x334466;

      // Card bg
      const bg = this.add.rectangle(W/2, y, 320, 108, bgColor).setStrokeStyle(2, borderColor);

      // Bullet preview dot
      const dot = this.add.circle(42, y - 14, 7, gun.bulletColor);

      // Text
      const nameT = this.add.text(70, y - 30, gun.name, { fontSize: '17px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial' });
      const descT = this.add.text(70, y - 8,  gun.desc, { fontSize: '13px', fill: '#aaaaaa', fontFamily: 'Arial' });
      const rateT = this.add.text(70, y + 12, `Fire rate: ${gun.fireRate <= 200 ? '⚡⚡⚡' : gun.fireRate <= 500 ? '⚡⚡' : '⚡'}`, { fontSize: '12px', fill: '#888888', fontFamily: 'Arial' });

      // Action button
      let btnLabel, btnColor;
      if (isEquipped)     { btnLabel = '✓ EQUIPPED'; btnColor = '#cc00ff'; }
      else if (isOwned)   { btnLabel = 'EQUIP';       btnColor = '#00aa33'; }
      else                { btnLabel = `BUY  ${gun.price} 🪙`; btnColor = gun.price === 0 ? '#00aa33' : '#884400'; }

      const actionBg = this.add.rectangle(W - 60, y + 10, 86, 32, Phaser.Display.Color.HexStringToColor(btnColor).color).setInteractive({ useHandCursor: true });
      const actionTx = this.add.text(W - 60, y + 10, btnLabel, { fontSize: '12px', fill: '#fff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);

      actionBg.on('pointerdown', () => {
        if (isEquipped) return;
        if (isOwned) {
          setEquippedGun(gun.key);
          this._renderPage();
          this.tokenTxt.setText(`Tokens: ${getTokens()}`);
        } else {
          if (getTokens() >= gun.price) {
            setTokens(getTokens() - gun.price);
            ownGun(gun.key);
            setEquippedGun(gun.key);
            this._renderPage();
            this.tokenTxt.setText(`Tokens: ${getTokens()}`);
          } else {
            this.cameras.main.shake(200, 0.012);
            actionTx.setText('Need more 🪙');
            this.time.delayedCall(1000, () => actionTx.setText(btnLabel));
          }
        }
      });

      this.cardContainer.add([bg, dot, nameT, descT, rateT, actionBg, actionTx]);
    });

    // Page indicator
    const total = Math.ceil(GUNS.length / this.perPage);
    const existing = this.cardContainer.getByName('pageInd');
    if (existing) existing.destroy();
    this.add.text(W/2, 566, `Page ${this.page + 1} / ${total}`, { fontSize: '13px', fill: '#666666', fontFamily: 'Arial' }).setOrigin(0.5).setName('pageInd');
  }
}

// ─── ShopScene (Upgrades) ────────────────────────────────────────────────────
class ShopScene extends Phaser.Scene {
  constructor() { super('Shop'); }
  create() {
    makeStars(this);
    this.add.text(W/2, 50, 'UPGRADES', { fontSize: '30px', fill: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
    this.tokenTxt = this.add.text(W/2, 88, `Tokens: ${getTokens()}`, { fontSize: '19px', fill: '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5);

    const items = [
      { name: 'Shield',      key: 'shield',     cost: 50, desc: '+1 extra hit point' },
      { name: 'Speed Boost', key: 'speedBoost', cost: 20, desc: 'Move 30% faster'    },
      { name: 'Auto Shield', key: 'autoShield', cost: 70, desc: 'Brief invincibility after hit' },
      { name: 'Magnet',      key: 'magnet',     cost: 35, desc: 'Auto-aim at nearest enemy' },
    ];

    items.forEach((item, i) => {
      const y = 185 + i * 108;
      const owned = localStorage.getItem(item.key) === '1';
      const bg = this.add.rectangle(W/2, y, 310, 90, owned ? 0x1a3322 : 0x1a1a2e).setStrokeStyle(2, owned ? 0x00cc44 : 0x334466).setInteractive({ useHandCursor: true });
      this.add.text(W/2, y - 20, item.name, { fontSize: '18px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
      this.add.text(W/2, y + 4,  item.desc, { fontSize: '14px', fill: '#aaaaaa', fontFamily: 'Arial' }).setOrigin(0.5);
      const costLbl = this.add.text(W/2, y + 26, owned ? '✓ OWNED' : `${item.cost} tokens`, { fontSize: '14px', fill: owned ? '#00ff88' : '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5);

      if (!owned) {
        bg.on('pointerdown', () => {
          if (getTokens() >= item.cost) {
            setTokens(getTokens() - item.cost);
            localStorage.setItem(item.key, '1');
            costLbl.setText('✓ OWNED'); costLbl.setStyle({ fill: '#00ff88' });
            bg.setFillStyle(0x1a3322); bg.setStrokeStyle(2, 0x00cc44);
            this.tokenTxt.setText(`Tokens: ${getTokens()}`);
          } else {
            this.cameras.main.shake(200, 0.012);
          }
        });
        bg.on('pointerover', () => bg.setAlpha(0.8));
        bg.on('pointerout',  () => bg.setAlpha(1));
      }
    });

    makeBtn(this, W/2, 618, '← BACK', '#555555', () => this.scene.start('Menu'));
  }
}

// ─── OnlineScene ─────────────────────────────────────────────────────────────
class OnlineScene extends Phaser.Scene {
  constructor() { super('Online'); }
  create() {
    makeStars(this);
    this.add.text(W/2, 115, 'PLAY ONLINE', { fontSize: '30px', fill: '#ff6600', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
    this.statusText = this.add.text(W/2, 255, 'Finding a match...', { fontSize: '20px', fill: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);
    this.ring = this.add.graphics();
    this.add.text(W/2, 365, 'Players online: 1,284', { fontSize: '15px', fill: '#aaaaaa', fontFamily: 'Arial' }).setOrigin(0.5);
    this.add.text(W/2, 390, 'Avg wait: ~12 sec',     { fontSize: '15px', fill: '#aaaaaa', fontFamily: 'Arial' }).setOrigin(0.5);
    makeBtn(this, W/2, 490, 'CANCEL', '#555555', () => this.scene.start('Menu'));
    this.time.delayedCall(5000, () => {
      this.statusText.setText('Match found!');
      this.statusText.setStyle({ fill: '#00ff88' });
      this.time.delayedCall(1000, () => this.scene.start('Game', { level: 0, wave: 1, online: true }));
    });
    this.angle = 0; this.dots = 0; this.dotsTimer = 0;
  }
  update(_, delta) {
    this.angle += delta * 0.003;
    this.ring.clear();
    for (let i = 0; i < 12; i++) {
      const a = this.angle + (i / 12) * Math.PI * 2;
      this.ring.fillStyle(0xff6600, i / 12);
      this.ring.fillCircle(W/2 + Math.cos(a) * 50, 300 + Math.sin(a) * 50, 6);
    }
    this.dotsTimer += delta;
    if (this.dotsTimer > 500) {
      this.dotsTimer = 0; this.dots = (this.dots + 1) % 4;
      if (this.statusText.text.startsWith('Finding')) this.statusText.setText('Finding a match' + '.'.repeat(this.dots));
    }
  }
}

// ─── GameScene ───────────────────────────────────────────────────────────────
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.currentLevel  = data.level  || 0;
    this.wave          = data.wave   || 1;
    this.isOnline      = data.online || false;
    this.lives         = 3 + (localStorage.getItem('shield') === '1' ? 1 : 0);
    this.score         = 0;
    this.sessionTokens = 0;
    this._cleared      = false;
    this._over         = false;
    this.playerInvincible = false;

    // Gun setup
    this.gunKey = getEquippedGun();
    this.gunDef = GUNS.find(g => g.key === this.gunKey) || GUNS[0];
  }

  create() {
    // Scrolling star field
    this.stars = Array.from({ length: 100 }, () => ({
      x: Phaser.Math.Between(0, W), y: Phaser.Math.Between(0, H),
      speed: Math.random() * 1.5 + 0.5, r: Math.random() * 1.5 + 0.3,
    }));
    this.starGfx = this.add.graphics();

    const cfg = getScaledConfig(this.currentLevel, this.wave);

    this._buildPlayer();
    this.bullets  = this.add.group();
    this.eBullets = this.add.group();
    this.enemies  = this.add.group();
    this._spawnEnemies(cfg);
    this.boss = null;
    if (cfg.boss) this._spawnBoss();

    this._buildHUD();

    // Touch/drag movement
    this.input.on('pointermove', p => { if (p.isDown && this.player) this.player.x = Phaser.Math.Clamp(p.x, 22, W - 22); });
    this.input.on('pointerdown', p => { if (this.player) this.player.x = Phaser.Math.Clamp(p.x, 22, W - 22); });

    // Pause shortcuts
    this.input.keyboard.on('keydown-ESC', () => this._togglePause());
    this.input.keyboard.on('keydown-P',   () => this._togglePause());
    this.isPaused = false;

    // Auto fire at gun's fire rate
    this.fireTimer = this.time.addEvent({ delay: this.gunDef.fireRate, callback: this._fireGun, callbackScope: this, loop: true });

    // Enemy shoot
    this.eFireTimer = this.time.addEvent({ delay: cfg.shootRate, callback: this._enemyFire, callbackScope: this, loop: true });

    if (this.isOnline) {
      this.add.rectangle(W - 55, 20, 90, 26, 0xff6600).setDepth(10);
      this.add.text(W - 55, 20, 'ONLINE', { fontSize: '13px', fill: '#fff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(11);
    }
  }

  update(_, delta) {
    if (this.isPaused) return;

    // Scroll stars
    this.starGfx.clear();
    this.stars.forEach(s => {
      s.y += s.speed;
      if (s.y > H) s.y = 0;
      this.starGfx.fillStyle(0xffffff, 0.6);
      this.starGfx.fillCircle(s.x, s.y, s.r);
    });

    // Shield ring follows player
    if (this.shieldRing && this.player) {
      this.shieldRing.x = this.player.x;
      this.shieldRing.y = this.player.y;
    }

    // Player bullet vs enemies
    this.bullets.getChildren().slice().forEach(b => {
      if (!b.active) return;
      this.enemies.getChildren().slice().forEach(e => {
        if (!e.active) return;
        if (Phaser.Geom.Intersects.RectangleToRectangle(b.getBounds(), e.getBounds())) {
          if (b.isRocket)  this._hitRocket(b, e);
          else if (b.pierce) this._hitEnemyPierce(b, e);
          else               this._hitEnemy(b, e);
        }
      });
      if (this.boss && b.active && Phaser.Geom.Intersects.RectangleToRectangle(b.getBounds(), this.boss.getBounds())) {
        if (b.isRocket) this._hitBossRocket(b);
        else            this._hitBoss(b);
      }
    });

    // Enemy bullets vs player
    this.eBullets.getChildren().slice().forEach(b => {
      if (!b.active || !this.player) return;
      if (Phaser.Geom.Intersects.RectangleToRectangle(b.getBounds(), this.player.getBounds())) {
        this._playerHit(b);
      }
    });

    // Enemies reach bottom
    this.enemies.getChildren().slice().forEach(e => {
      if (e.active && e.y > H - 55) { this._playerHit(null); if (e.active) e.destroy(); }
    });

    // Clean off-screen bullets
    [...this.bullets.getChildren(), ...this.eBullets.getChildren()].forEach(b => {
      if (b.active && (b.y < -50 || b.y > H + 50)) b.destroy();
    });

    // Boss sway
    if (this.boss && this.boss.active) {
      this.boss.x += this.bossDir * 1.6;
      if (this.boss.x > W - 45 || this.boss.x < 45) this.bossDir *= -1;
    }

    // Level clear check
    if (!this._cleared && !this._over && this.enemies.getLength() === 0 && !this.boss) {
      this._levelCleared();
    }
  }

  // ── Build helpers ──────────────────────────────────────────────────────────
  _buildPlayer() {
    if (!this.textures.exists('player')) {
      const g = this.add.graphics();
      g.fillStyle(0x00aaff); g.fillTriangle(0, 30, 20, -10, 40, 30);
      g.fillStyle(0x0055ff); g.fillRect(10, 20, 20, 12);
      g.generateTexture('player', 40, 40); g.destroy();
    }
    this.player = this.add.image(W/2, H - 70, 'player').setDepth(5);

    if (localStorage.getItem('shield') === '1') {
      const sg = this.add.graphics();
      sg.lineStyle(2, 0x00ffff, 0.8); sg.strokeCircle(22, 22, 22);
      sg.generateTexture('shieldRing', 44, 44); sg.destroy();
      this.shieldRing = this.add.image(this.player.x, this.player.y, 'shieldRing').setDepth(6);
    }
  }

  _spawnEnemies(cfg) {
    if (!this.textures.exists('enemy')) {
      const g = this.add.graphics();
      const cx = 20, cy = 20;

      // Saucer bottom shadow
      g.fillStyle(0x445566);
      g.fillEllipse(cx, cy + 10, 42, 10);

      // Saucer main body (metallic grey-blue disc)
      g.fillStyle(0x8899bb);
      g.fillEllipse(cx, cy + 8, 40, 12);

      // Saucer top ridge (lighter)
      g.fillStyle(0xaabbcc);
      g.fillEllipse(cx, cy + 5, 30, 8);

      // Yellow lights along rim
      g.fillStyle(0xffdd00);
      [-13, -7, 0, 7, 13].forEach(dx => g.fillCircle(cx + dx, cy + 7, 2.5));

      // Glass dome (dark blue)
      g.fillStyle(0x1144aa);
      g.fillEllipse(cx, cy - 2, 24, 18);

      // Dome glass shine (lighter blue highlight)
      g.fillStyle(0x44aaff);
      g.fillEllipse(cx - 4, cy - 8, 8, 6);

      // Alien head (green)
      g.fillStyle(0x33cc44);
      g.fillCircle(cx, cy - 2, 8);

      // Alien big oval eyes (black)
      g.fillStyle(0x111111);
      g.fillEllipse(cx - 4, cy - 3, 5, 7);
      g.fillEllipse(cx + 4, cy - 3, 5, 7);

      // Eye shine
      g.fillStyle(0x555566);
      g.fillCircle(cx - 3, cy - 5, 1.5);
      g.fillCircle(cx + 5, cy - 5, 1.5);

      g.generateTexture('enemy', 40, 40); g.destroy();
    }
    const cols = Math.ceil(cfg.enemies / cfg.rows);
    let count = 0;
    for (let row = 0; row < cfg.rows && count < cfg.enemies; row++) {
      for (let col = 0; col < cols && count < cfg.enemies; col++) {
        const x = 40 + col * ((W - 80) / Math.max(cols - 1, 1));
        const y = 80 + row * 60;
        const e = this.add.image(x, y, 'enemy').setDepth(4);
        e.hp = 1;
        this.enemies.add(e);
        count++;
      }
    }
    this._enemyDir = 1;
    this.time.addEvent({ delay: 1200, callback: this._moveEnemies, callbackScope: this, loop: true });
  }

  _spawnBoss() {
    if (!this.textures.exists('boss')) {
      const g = this.add.graphics();
      g.fillStyle(0xff0000); g.fillRect(10, 20, 80, 40); g.fillTriangle(50, 0, 10, 25, 90, 25);
      g.fillStyle(0xff8800); g.fillCircle(50, 40, 18);
      g.fillStyle(0xffff00); g.fillCircle(50, 40, 8);
      g.generateTexture('boss', 100, 70); g.destroy();
    }
    this.boss = this.add.image(W/2, 100, 'boss').setDepth(4);
    this.boss.hp = getScaledConfig(this.currentLevel, this.wave).bossHp;
    this.boss.maxHp = this.boss.hp;
    this.bossDir = 1;
    this.bossHpBg  = this.add.rectangle(W/2, 28, 200, 14, 0x440000).setDepth(9);
    this.bossHpBar = this.add.rectangle(W/2, 28, 200, 14, 0xff0000).setDepth(10);
    this.add.text(W/2, 28, 'BOSS', { fontSize: '10px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(11);
    this.time.addEvent({ delay: 600, callback: this._bossFire, callbackScope: this, loop: true });
  }

  _buildHUD() {
    this.add.rectangle(0, 0, W, 44, 0x000000, 0.7).setOrigin(0, 0).setDepth(8);
    this.scoreTxt = this.add.text(10, 8, 'Score: 0', { fontSize: '15px', fill: '#fff', fontFamily: 'Arial' }).setDepth(9);
    this.tokenTxt = this.add.text(W/2, 8, `Tokens: ${getTokens()}`, { fontSize: '15px', fill: '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5, 0).setDepth(9);
    this.levelTxt = this.add.text(W - 42, 8, `W${this.wave} L${this.currentLevel + 1}`, { fontSize: '15px', fill: '#00eaff', fontFamily: 'Arial' }).setOrigin(1, 0).setDepth(9);
    this.livesTxt = this.add.text(10, H - 30, '❤'.repeat(this.lives), { fontSize: '18px', fontFamily: 'Arial' }).setDepth(9);
    this.add.text(W - 8, H - 28, this.gunDef.name, { fontSize: '13px', fill: '#cc00ff', fontFamily: 'Arial' }).setOrigin(1, 0).setDepth(9);

    // Pause button (top-right corner)
    const pauseBtn = this.add.rectangle(W - 18, 22, 28, 28, 0x333333)
      .setDepth(12).setInteractive({ useHandCursor: true });
    this.add.text(W - 18, 22, '⏸', { fontSize: '16px', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(13);
    pauseBtn.on('pointerdown', () => this._togglePause());
    pauseBtn.on('pointerover', () => pauseBtn.setFillStyle(0x555555));
    pauseBtn.on('pointerout',  () => pauseBtn.setFillStyle(0x333333));
  }

  // ── Firing ─────────────────────────────────────────────────────────────────
  _fireGun() {
    if (!this.player || !this.player.active) return;
    const px = this.player.x, py = this.player.y - 22;
    const g = this.gunDef;

    switch (this.gunKey) {
      case 'basicBlaster':
      case 'rapidBlaster':
        this._spawnBullet(px, py, -700, 0, g.bulletColor, g.bw, g.bh);
        break;

      case 'doubleShot':
        this._spawnBullet(px - 12, py, -700, 0, g.bulletColor, g.bw, g.bh);
        this._spawnBullet(px + 12, py, -700, 0, g.bulletColor, g.bw, g.bh);
        break;

      case 'spreadShot':
        this._spawnBullet(px,      py, -700,  0,    g.bulletColor, g.bw, g.bh);
        this._spawnBullet(px - 10, py, -650, -130,  g.bulletColor, g.bw, g.bh);
        this._spawnBullet(px + 10, py, -650,  130,  g.bulletColor, g.bw, g.bh);
        break;

      case 'machineGun':
        this._spawnBullet(px + Phaser.Math.Between(-4, 4), py, -900, 0, g.bulletColor, g.bw, g.bh);
        break;

      case 'shotgun':
        for (let i = -2; i <= 2; i++) {
          this._spawnBullet(px + i * 9, py, -480, i * 220, g.bulletColor, g.bw, g.bh);
        }
        break;

      case 'laserCannon': {
        const b = this._spawnBullet(px, py, -820, 0, g.bulletColor, g.bw, g.bh);
        b.pierce = true;
        break;
      }

      case 'rocketLauncher': {
        const r = this._spawnBullet(px, py, -280, 0, g.bulletColor, g.bw, g.bh);
        r.isRocket = true;
        break;
      }

      case 'plasmaGun':
        this._spawnBullet(px,      py, -650,  0,    g.bulletColor, g.bw, g.bh);
        this._spawnBullet(px - 12, py, -580, -160,  g.bulletColor, g.bw, g.bh);
        this._spawnBullet(px + 12, py, -580,  160,  g.bulletColor, g.bw, g.bh);
        break;

      case 'railgun': {
        const rail = this._spawnBullet(px, py, -1600, 0, g.bulletColor, g.bw, g.bh);
        rail.pierce = true;
        this._railgunFlash(px, py);
        break;
      }
    }
  }

  _spawnBullet(x, y, vy, vx, color, bw, bh) {
    const key = `b_${color}_${bw}_${bh}`;
    if (!this.textures.exists(key)) {
      const g = this.add.graphics();
      g.fillStyle(color); g.fillRect(0, 0, bw, bh);
      g.generateTexture(key, bw, bh); g.destroy();
    }
    const b = this.add.image(x, y, key).setDepth(3);
    this.bullets.add(b);
    const dur = Math.abs(H + 60) / Math.abs(vy) * 1000;
    this.tweens.add({ targets: b, y: y - H - 60, x: x + vx * dur / 1000, duration: dur, onComplete: () => { if (b.active) b.destroy(); } });
    return b;
  }

  _railgunFlash(x, y) {
    const g = this.add.graphics();
    g.lineStyle(4, 0xffd700, 1); g.lineBetween(x, y, x, 0);
    g.lineStyle(2, 0xffffff, 0.7); g.lineBetween(x, y, x, 0);
    this.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
  }

  _enemyFire() {
    const alive = this.enemies.getChildren();
    if (!alive.length) return;
    const e = alive[Phaser.Math.Between(0, alive.length - 1)];
    this._spawnEBullet(e.x, e.y + 18, 300, 0);
  }

  _bossFire() {
    if (!this.boss || !this.boss.active) return;
    this._spawnEBullet(this.boss.x,      this.boss.y + 36, 260, 0);
    this._spawnEBullet(this.boss.x - 22, this.boss.y + 30, 240, -80);
    this._spawnEBullet(this.boss.x + 22, this.boss.y + 30, 240,  80);
  }

  _spawnEBullet(x, y, vy, vx) {
    const key = 'eb_4_12';
    if (!this.textures.exists(key)) {
      const g = this.add.graphics(); g.fillStyle(0xff4444); g.fillRect(0, 0, 4, 12); g.generateTexture(key, 4, 12); g.destroy();
    }
    const b = this.add.image(x, y, key).setDepth(3);
    this.eBullets.add(b);
    const dur = Math.abs(H + 60) / Math.abs(vy) * 1000;
    this.tweens.add({ targets: b, y: y + H + 60, x: x + vx * dur / 1000, duration: dur, onComplete: () => { if (b.active) b.destroy(); } });
  }

  // ── Hit handlers ───────────────────────────────────────────────────────────
  _hitEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy(); enemy.destroy();
    this._onKill(enemy.x, enemy.y, 0xff8800);
  }

  _hitEnemyPierce(bullet, enemy) {
    if (!enemy.active) return;
    if (!bullet.hitSet) bullet.hitSet = new Set();
    if (bullet.hitSet.has(enemy)) return;
    bullet.hitSet.add(enemy);
    enemy.destroy();
    this._onKill(enemy.x, enemy.y, this.gunDef.bulletColor);
  }

  _hitRocket(bullet, firstEnemy) {
    if (!bullet.active || bullet._exploded) return;
    bullet._exploded = true;
    const rx = firstEnemy.x, ry = firstEnemy.y;
    bullet.destroy();
    this.enemies.getChildren().slice().forEach(e => {
      if (!e.active) return;
      const dx = e.x - rx, dy = e.y - ry;
      if (Math.sqrt(dx * dx + dy * dy) < 75) { e.destroy(); this._onKill(e.x, e.y, 0xff4400); }
    });
    if (this.boss && this.boss.active) {
      const dx = this.boss.x - rx, dy = this.boss.y - ry;
      if (Math.sqrt(dx * dx + dy * dy) < 75) { this.boss.hp -= 3; this._updateBossHP(); }
    }
    this._bigExplode(rx, ry);
  }

  _hitBoss(bullet) {
    if (!bullet.active) return;
    if (!bullet.pierce) bullet.destroy();
    this.score += 5;
    this.boss.hp--;
    this._updateBossHP();
    this._explode(this.boss.x + Phaser.Math.Between(-25, 25), this.boss.y + Phaser.Math.Between(-15, 15), 0xff4400);
    this.scoreTxt.setText('Score: ' + this.score);
  }

  _hitBossRocket(bullet) {
    if (!bullet.active || bullet._exploded) return;
    bullet._exploded = true; bullet.destroy();
    this.boss.hp -= 4;
    this._updateBossHP();
    this._bigExplode(this.boss.x, this.boss.y);
  }

  _updateBossHP() {
    if (!this.boss) return;
    if (this.boss.hp <= 0) {
      this._bigExplode(this.boss.x, this.boss.y);
      this.boss.destroy(); this.boss = null;
      this.bossHpBar.destroy(); this.bossHpBg.destroy();
      this.score += 200; this.sessionTokens += 50;
      this.scoreTxt.setText('Score: ' + this.score);
      this.tokenTxt.setText(`Tokens: ${getTokens() + this.sessionTokens}`);
    } else {
      this.bossHpBar.width = 200 * (this.boss.hp / this.boss.maxHp);
    }
  }

  _onKill(x, y, color) {
    this.score += 10; this.sessionTokens += 2;
    this._explode(x, y, color);
    this.scoreTxt.setText('Score: ' + this.score);
    this.tokenTxt.setText(`Tokens: ${getTokens() + this.sessionTokens}`);
  }

  _playerHit(bullet) {
    if (bullet && bullet.active) bullet.destroy();
    if (this.playerInvincible) return;
    this.lives--;
    this.livesTxt.setText('❤'.repeat(Math.max(0, this.lives)));
    this.cameras.main.shake(300, 0.015);
    this.playerInvincible = true;
    const dur = localStorage.getItem('autoShield') === '1' ? 2500 : 1400;
    this.time.delayedCall(dur, () => { this.playerInvincible = false; });
    if (this.lives <= 0) this._gameOver();
  }

  _explode(x, y, color) {
    const g = this.add.graphics();
    g.fillStyle(color, 0.9); g.fillCircle(x, y, 16);
    this.tweens.add({ targets: g, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 320, onComplete: () => g.destroy() });
  }

  _bigExplode(x, y) {
    const g = this.add.graphics();
    g.fillStyle(0xff4400, 0.9); g.fillCircle(x, y, 52);
    g.fillStyle(0xff8800, 0.8); g.fillCircle(x, y, 32);
    g.fillStyle(0xffff00, 0.9); g.fillCircle(x, y, 16);
    this.tweens.add({ targets: g, alpha: 0, scaleX: 3, scaleY: 3, duration: 520, onComplete: () => g.destroy() });
    this.cameras.main.shake(250, 0.018);
  }

  _moveEnemies() {
    const alive = this.enemies.getChildren();
    if (!alive.length) return;
    let hitEdge = false;
    alive.forEach(e => { e.x += this._enemyDir * 18; if (e.x > W - 20 || e.x < 20) hitEdge = true; });
    if (hitEdge) { this._enemyDir *= -1; alive.forEach(e => e.y += 22); }
  }

  // ── Pause ──────────────────────────────────────────────────────────────────
  _togglePause() {
    if (this._cleared || this._over) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.time.paused = true;
      this.tweens.pauseAll();
      this._showPauseOverlay();
    } else {
      this._hidePauseOverlay();
      this.tweens.resumeAll();
      this.time.paused = false;
    }
  }

  _showPauseOverlay() {
    this.pauseGroup = this.add.container(0, 0).setDepth(40);
    const bg    = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.72);
    const title = this.add.text(W/2, H/2 - 120, '⏸  PAUSED', { fontSize: '40px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);

    // Wave/level info
    const info = this.add.text(W/2, H/2 - 62, `Wave ${this.wave}  ·  Level ${this.currentLevel + 1}  ·  Score ${this.score}`,
      { fontSize: '16px', fill: '#aaaaaa', fontFamily: 'Arial' }).setOrigin(0.5);

    // Resume
    const rBg = this.add.rectangle(W/2, H/2 + 10, 230, 52, 0x00cc44).setInteractive({ useHandCursor: true });
    const rTx = this.add.text(W/2, H/2 + 10, '▶  RESUME', { fontSize: '22px', fill: '#fff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
    rBg.on('pointerdown', () => this._togglePause());
    rBg.on('pointerover', () => rBg.setAlpha(0.8));
    rBg.on('pointerout',  () => rBg.setAlpha(1));

    // Restart level
    const stBg = this.add.rectangle(W/2, H/2 + 80, 230, 52, 0xff8800).setInteractive({ useHandCursor: true });
    const stTx = this.add.text(W/2, H/2 + 80, '↺  RESTART LEVEL', { fontSize: '18px', fill: '#fff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
    stBg.on('pointerdown', () => { this.time.paused = false; this.tweens.resumeAll(); this.scene.start('Game', { level: this.currentLevel, wave: this.wave, online: this.isOnline }); });
    stBg.on('pointerover', () => stBg.setAlpha(0.8));
    stBg.on('pointerout',  () => stBg.setAlpha(1));

    // Main menu
    const mBg = this.add.rectangle(W/2, H/2 + 152, 230, 52, 0x0088ff).setInteractive({ useHandCursor: true });
    const mTx = this.add.text(W/2, H/2 + 152, '⌂  MAIN MENU', { fontSize: '20px', fill: '#fff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
    mBg.on('pointerdown', () => { this.time.paused = false; this.tweens.resumeAll(); addTokens(this.sessionTokens); this.scene.start('Menu'); });
    mBg.on('pointerover', () => mBg.setAlpha(0.8));
    mBg.on('pointerout',  () => mBg.setAlpha(1));

    this.pauseGroup.add([bg, title, info, rBg, rTx, stBg, stTx, mBg, mTx]);
  }

  _hidePauseOverlay() {
    if (this.pauseGroup) { this.pauseGroup.destroy(); this.pauseGroup = null; }
  }

  // ── Level flow ─────────────────────────────────────────────────────────────
  _levelCleared() {
    this._cleared = true;
    addTokens(this.sessionTokens);
    unlockNextLevel(this.currentLevel);  // unlock next level
    const isLastLevel = this.currentLevel >= LEVELS.length - 1;

    if (isLastLevel) {
      // Wave complete — start next wave (harder)
      const nextWave = this.wave + 1;
      const waveBonus = this.wave * 25;
      addTokens(waveBonus);
      this.add.text(W/2, H/2 - 30, `WAVE ${this.wave} COMPLETE!`,
        { fontSize: '34px', fill: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(20);
      this.add.text(W/2, H/2 + 18, `WAVE ${nextWave} INCOMING!`,
        { fontSize: '22px', fill: '#ff4444', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(20);
      this.add.text(W/2, H/2 + 52, `+${this.sessionTokens + waveBonus} tokens`, { fontSize: '19px', fill: '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(20);
      this.time.delayedCall(2800, () => this.scene.start('Game', { level: 0, wave: nextWave, online: this.isOnline }));
    } else {
      this.add.text(W/2, H/2, `LEVEL ${this.currentLevel + 1} CLEAR!`,
        { fontSize: '36px', fill: '#00ff88', fontStyle: 'bold', fontFamily: 'Arial', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(20);
      this.add.text(W/2, H/2 + 52, `+${this.sessionTokens} tokens`, { fontSize: '22px', fill: '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(20);
      this.time.delayedCall(2200, () => this.scene.start('Game', { level: this.currentLevel + 1, wave: this.wave, online: this.isOnline }));
    }
  }

  _gameOver() {
    if (this._over) return;
    this._over = true;
    addTokens(this.sessionTokens);
    this.time.delayedCall(400, () => this.scene.start('GameOver', { win: false, score: this.score }));
  }
}

// ─── GameOverScene ────────────────────────────────────────────────────────────
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  init(data) { this.win = data.win; this.score = data.score; }
  create() {
    makeStars(this);
    this.add.text(W/2, 128, this.win ? 'YOU WIN!' : 'GAME OVER',
      { fontSize: '44px', fill: this.win ? '#00ff88' : '#ff3333', fontStyle: 'bold', fontFamily: 'Arial', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
    this.add.text(W/2, 210, `Score: ${this.score}`,      { fontSize: '26px', fill: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);
    this.add.text(W/2, 255, `Tokens: ${getTokens()}`,    { fontSize: '22px', fill: '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5);
    makeBtn(this, W/2, 360, 'PLAY AGAIN', '#00cc44', () => this.scene.start('Game',    { level: 0 }));
    makeBtn(this, W/2, 440, 'MAIN MENU',  '#0088ff', () => this.scene.start('Menu'));
    makeBtn(this, W/2, 520, 'GUN SHOP',   '#cc00ff', () => this.scene.start('GunShop'));
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function makeStars(scene) {
  const g = scene.add.graphics();
  for (let i = 0; i < 80; i++) {
    g.fillStyle(0xffffff, Math.random() * 0.7 + 0.2);
    g.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Math.random() * 2 + 0.4);
  }
}

function makeBtn(scene, x, y, label, color, cb, w = 220) {
  const bg = scene.add.rectangle(x, y, w, 48, Phaser.Display.Color.HexStringToColor(color).color).setInteractive({ useHandCursor: true });
  scene.add.text(x, y, label, { fontSize: '18px', fill: '#fff', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
  bg.on('pointerdown', cb);
  bg.on('pointerover', () => bg.setAlpha(0.8));
  bg.on('pointerout',  () => bg.setAlpha(1.0));
  return bg;
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
new Phaser.Game({
  type: Phaser.AUTO,
  width: W, height: H,
  backgroundColor: '#000011',
  scene: [MenuScene, LevelSelectScene, GunShopScene, ShopScene, GameScene, GameOverScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  parent: document.body,
});
