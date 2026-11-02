// Disegno e animazione dell'albero su <canvas>.
// Tutto è disegnato con un solo colore ("inchiostro"): nero col tema chiaro, bianco col tema scuro.
//
// Tre sistemi di coordinate:
// - schermo: unità logiche del canvas (WORLD.width × WORLD.height); qui stanno annaffiatoio, gocce, linea del terreno
// - mondo:   misure reali (1 unità ≈ SCALE.unitCm cm), origine alla base del tronco; qui stanno seme e ambiente
// - modello: coordinate dell'albero finito (treeModel.js), scalate in base alla crescita
import { MAX_GROWTH, SCALE, WORLD, buildTree } from './treeModel.js'

const CAN = {
  x: 350,
  y: 50,
  paths: [
    'M-22 -18 L 22 -18 L 18 30 L -18 30 Z',
    'M-26 -18 L 26 -18',
    'M22 -10 C 44 -10, 44 22, 18 22',
    'M-19 20 L -56 -12',
    'M-21 8 L -58 -18',
    'M-64 -8 L -52 -24',
    'M-12 -4 L 12 -4',
  ],
  spout: { x: -58, y: -16 },
}

// Tempi di un'annaffiatura (secondi dal click)
const TILT_IN = 0.4
const POUR_FROM = 0.35
const POUR_TO = 1.15
const TILT_OUT_FROM = 1.2
const TILT_OUT_TO = 1.8
const GROW_FROM = 0.9
const GROW_DURATION = 3.2
const POUR_ANGLE = -0.8
const GRAVITY = 900

// Durata totale dal click alla fine della crescita (serve anche ai cerchi di avanzamento)
export function wateringDuration(reducedMotion) {
  return GROW_FROM + (reducedMotion ? 0.4 : GROW_DURATION)
}

const SEED = { y: 0.13, size: 2 } // seme di ~3 cm, poco sotto terra

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (t) => t * t * (3 - 2 * t)
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const easeOutCubic = (t) => 1 - (1 - t) ** 3
const easeOutBack = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2

// Visibilità in base alla dimensione a schermo: compare quando è abbastanza grande, sparisce se troppo grande
function sizeFade(px, appear, full, tooBig, gone) {
  return smoothstep(clamp01((px - appear) / (full - appear))) * (1 - smoothstep(clamp01((px - tooBig) / (gone - tooBig))))
}

function bezierPoint(g, u) {
  const m = 1 - u
  return {
    x: m * m * g.p0.x + 2 * m * u * g.c.x + u * u * g.p1.x,
    y: m * m * g.p0.y + 2 * m * u * g.c.y + u * u * g.p1.y,
  }
}

function bezierAngle(g, u) {
  const dx = 2 * (1 - u) * (g.c.x - g.p0.x) + 2 * u * (g.p1.x - g.c.x)
  const dy = 2 * (1 - u) * (g.c.y - g.p0.y) + 2 * u * (g.p1.y - g.c.y)
  return Math.atan2(dy, dx)
}

// Le radici puntano sempre verso il basso (angolo tra 0 e PI, con un margine)
function keepUnderground(angle) {
  const a = Math.atan2(Math.sin(angle), Math.cos(angle))
  const margin = 0.14
  if (a >= margin && a <= Math.PI - margin) return a
  if (a > Math.PI - margin || a < -Math.PI / 2) return Math.PI - margin
  return margin
}

export function createTreeScene(canvas, { onComplete, reducedMotion = false }) {
  const ctx = canvas.getContext('2d')
  const tree = buildTree()
  const env = tree.environment
  const canPaths = CAN.paths.map((d) => new Path2D(d))
  const growDuration = reducedMotion ? 0.4 : GROW_DURATION
  const groundWobble = Array.from({ length: 68 }, (_, i) => Math.sin(i * 1.7) * 0.5 + Math.sin(i * 0.43) * 0.6)

  let ink = '#000'
  let paper = '#fff'
  let scale = 1
  let frame = 0
  let lastTime = performance.now()
  const startTime = lastTime

  let growth = 0
  let growthTween = null // { from, to, start }
  let target = 0
  let waterStart = null
  let completedAt = null
  let hover = 0
  let hovering = false
  let idle = 0 // 0 → 1 quando non si sta annaffiando: fa comparire farfalla e uccelli
  const drops = []
  const splashes = []

  // camera (aggiornata a ogni frame)
  let zoom = 1 // unità logiche per unità di mondo
  let treeScale = 1 // unità logiche per unità di modello
  const anchor = { x: WORLD.trunkX, y: WORLD.groundY } // base del tronco sullo schermo

  // ---------- colori e dimensioni ----------
  const readColors = () => {
    const style = getComputedStyle(canvas)
    ink = style.color
    paper = style.getPropertyValue('--color-bg').trim() || '#fff'
  }
  readColors()
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
  darkQuery.addEventListener('change', readColors)

  const resize = () => {
    const width = canvas.clientWidth
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round((width * WORLD.height * dpr) / WORLD.width)
    scale = canvas.width / WORLD.width
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  resize()

  // ---------- camera ----------
  function updateCamera() {
    const remaining = MAX_GROWTH - growth
    zoom = SCALE.cameraBase ** remaining
    treeScale = (SCALE.cameraBase / SCALE.treeBase) ** remaining
    // all'inizio il terreno sta più in alto, per vedere bene il seme sotto terra
    anchor.y = lerp(230, WORLD.groundY, smoothstep(clamp01(growth / 1.3)))
  }

  const setScreen = () => ctx.setTransform(scale, 0, 0, scale, 0, 0)
  const setWorld = () => ctx.setTransform(scale * zoom, 0, 0, scale * zoom, scale * anchor.x, scale * anchor.y)
  const setModel = () =>
    ctx.setTransform(
      scale * treeScale,
      0,
      0,
      scale * treeScale,
      scale * (anchor.x - WORLD.trunkX * treeScale),
      scale * (anchor.y - WORLD.groundY * treeScale),
    )
  const px = (n) => n / zoom // n unità di schermo espresse in unità di mondo

  function inView(x, y, margin) {
    const sx = anchor.x + x * zoom
    const sy = anchor.y + y * zoom
    return sx > -margin && sx < WORLD.width + margin && sy > -margin && sy < WORLD.height + margin
  }

  // ---------- albero (coordinate modello) ----------
  function layout(parts, time, wind) {
    const maturity = 0.3 + 0.7 * smoothstep(clamp01(growth / MAX_GROWTH))
    for (const b of parts) {
      const progress = clamp01((growth - b.born) / b.dur)
      let start
      let angle
      if (b.parent) {
        const pg = b.parent.geom
        start = bezierPoint(pg, b.t)
        angle = bezierAngle(pg, b.t) + b.rel
      } else {
        start = b.start
        angle = b.angle
      }
      if (b.kind === 'branch') {
        angle += Math.sin(time * 0.9 + b.phase) * wind * 0.011 * (b.depth + 0.25)
      } else {
        angle = keepUnderground(angle)
      }
      const p1 = { x: start.x + Math.cos(angle) * b.length, y: start.y + Math.sin(angle) * b.length }
      const c = {
        x: (start.x + p1.x) / 2 - Math.sin(angle) * b.bend * b.length,
        y: (start.y + p1.y) / 2 + Math.cos(angle) * b.bend * b.length,
      }
      const g = { p0: start, c, p1, progress }

      // spessore: cresce con l'età dell'albero e del ramo; mai più largo del genitore nel punto di attacco
      let wBase = b.wBase * maturity * (0.35 + 0.65 * progress)
      if (b.parent) {
        const pg = b.parent.geom
        const parentWidth = lerp(pg.wBase, pg.wTip, pg.progress > 0 ? Math.min(1, b.t / pg.progress) : 0)
        wBase = Math.min(wBase, parentWidth * 0.82)
      }
      g.wBase = Math.max(wBase, 0.5)
      g.wTip = Math.max(b.wTip * Math.min(1, maturity * 1.4), 0.35)
      b.geom = g
    }
  }

  function widthAt(b, s) {
    const g = b.geom
    let w = lerp(g.wBase, g.wTip, s)
    if (b.flare) w *= 1 + b.flare * Math.max(0, 1 - (s * g.progress) / 0.07)
    return w
  }

  // Ramo/radice come linea affusolata (larga alla base, sottile in punta)
  function drawTapered(b) {
    const g = b.geom
    if (g.progress <= 0) return
    const steps = Math.max(4, Math.round(14 * g.progress))
    const left = []
    const right = []
    for (let i = 0; i <= steps; i++) {
      const s = i / steps
      const u = g.progress * s
      const p = bezierPoint(g, u)
      const a = bezierAngle(g, u)
      const half = widthAt(b, s) / 2
      left.push([p.x - Math.sin(a) * half, p.y + Math.cos(a) * half])
      right.push([p.x + Math.sin(a) * half, p.y - Math.cos(a) * half])
    }
    ctx.beginPath()
    ctx.moveTo(left[0][0], left[0][1])
    for (const [x, y] of left) ctx.lineTo(x, y)
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1])
    ctx.closePath()
    ctx.fill()
    const tip = bezierPoint(g, g.progress)
    ctx.beginPath()
    ctx.arc(tip.x, tip.y, g.wTip / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Venature della corteccia sulle parti più spesse (linee color carta dentro l'inchiostro)
  function drawBark(b) {
    const g = b.geom
    if (g.progress < 0.2 || g.wBase < 5) return
    ctx.save()
    ctx.strokeStyle = paper
    ctx.lineWidth = 0.55
    ctx.globalAlpha = clamp01((g.wBase - 5) / 4)
    const lines = [
      [-0.26, 0.04, 0.55],
      [0.08, 0.12, 0.8],
      [0.3, 0.02, 0.4],
      [-0.05, 0.5, 0.95],
    ]
    for (const [offset, from, to] of lines) {
      ctx.beginPath()
      for (let i = 0; i <= 10; i++) {
        const s = lerp(from, to, i / 10)
        const u = g.progress * s
        const p = bezierPoint(g, u)
        const a = bezierAngle(g, u)
        const wobble = Math.sin(s * 17 + offset * 9) * 0.06
        const k = (offset + wobble) * widthAt(b, s)
        const x = p.x - Math.sin(a) * k
        const y = p.y + Math.cos(a) * k
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  function drawLeaf(leaf, time, wind) {
    const g = leaf.branch.geom
    if (!g || g.progress < leaf.t) return
    let size = easeOutBack(clamp01((growth - leaf.born) / leaf.dur))
    if (leaf.dies) size *= 1 - smoothstep(clamp01((growth - leaf.dies) / 0.5))
    if (size <= 0.02) return
    const p = bezierPoint(g, leaf.t)
    const angle = bezierAngle(g, leaf.t) + leaf.rel + Math.sin(time * 1.7 + leaf.phase) * 0.12 * wind
    const L = leaf.size
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(angle)
    ctx.scale(size, size)
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(1, 0)
    ctx.bezierCurveTo(L * 0.3, -L * 0.36, L * 0.75, -L * 0.3, L, 0)
    ctx.bezierCurveTo(L * 0.75, L * 0.3, L * 0.3, L * 0.36, 1, 0)
    ctx.stroke()
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(L * 0.45, -L * 0.04, L * 0.82, 0)
    ctx.stroke()
    ctx.restore()
  }

  // ---------- terreno (coordinate schermo) ----------
  function drawGroundLine(intro) {
    const reach = easeOutCubic(intro) * 200
    ctx.lineWidth = 1.4
    ctx.beginPath()
    let started = false
    groundWobble.forEach((wobble, i) => {
      const x = 14 + i * 5.6
      if (Math.abs(x - WORLD.width / 2) > reach) return
      if (!started) ctx.moveTo(x, anchor.y + wobble)
      else ctx.lineTo(x, anchor.y + wobble)
      started = true
    })
    ctx.stroke()
  }

  // ---------- ambiente (coordinate mondo) ----------
  function drawSoil(alpha) {
    ctx.save()
    for (const pebble of env.pebbles) {
      const size = pebble.rx * zoom
      const a = sizeFade(size, 1.2, 2.5, 45, 90) * alpha
      if (a <= 0.01 || !inView(pebble.x, pebble.y, size + 4)) continue
      ctx.globalAlpha = a
      ctx.lineWidth = px(0.8)
      ctx.beginPath()
      ctx.ellipse(pebble.x, pebble.y, pebble.rx, pebble.rx * pebble.ratio, pebble.rotation, 0, Math.PI * 2)
      ctx.stroke()
    }
    for (const speck of env.specks) {
      const size = speck.length * zoom
      const a = sizeFade(size, 1.5, 3, 30, 60) * alpha
      if (a <= 0.01 || !inView(speck.x, speck.y, size + 4)) continue
      ctx.globalAlpha = a
      ctx.lineWidth = px(0.8)
      ctx.beginPath()
      ctx.moveTo(speck.x, speck.y)
      ctx.lineTo(speck.x + speck.length, speck.y)
      ctx.stroke()
    }
    ctx.restore()
  }

  function drawGrass(time, wind, alpha) {
    ctx.save()
    ctx.lineWidth = px(0.75)
    for (const clump of env.grass) {
      const size = clump.height * zoom
      const a = sizeFade(size, 3, 6, 200, 280) * alpha
      if (a <= 0.01 || !inView(clump.x, -clump.height / 2, size)) continue
      ctx.globalAlpha = a
      for (const blade of clump.blades) {
        const x = clump.x + blade.dx
        const h = blade.height
        const lean = blade.lean + Math.sin(time * 1.3 + blade.phase) * 0.1 * wind
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.quadraticCurveTo(x + Math.sin(lean) * h * 0.2, -h * 0.6, x + Math.sin(lean) * h, -Math.cos(lean) * h)
        ctx.stroke()
      }
    }
    ctx.restore()
  }

  function drawFlowers(time, wind, alpha) {
    ctx.save()
    for (const flower of env.flowers) {
      const size = flower.height * zoom
      const a = sizeFade(size, 6, 12, 260, 380) * alpha
      if (a <= 0.01 || !inView(flower.x, -flower.height / 2, size)) continue
      ctx.globalAlpha = a
      const lean = flower.lean + Math.sin(time * 1.1 + flower.phase) * 0.08 * wind
      const hx = flower.x + Math.sin(lean) * flower.height
      const hy = -Math.cos(lean) * flower.height
      ctx.lineWidth = px(0.9)
      ctx.beginPath()
      ctx.moveTo(flower.x, 0)
      ctx.quadraticCurveTo(flower.x, -flower.height * 0.5, hx, hy)
      ctx.stroke()
      // petali
      ctx.lineWidth = px(0.7)
      for (let i = 0; i < 9; i++) {
        const angle = (i / 9) * Math.PI * 2 + flower.phase
        ctx.beginPath()
        ctx.ellipse(
          hx + Math.cos(angle) * flower.head * 0.55,
          hy + Math.sin(angle) * flower.head * 0.55,
          flower.head * 0.42,
          flower.head * 0.14,
          angle,
          0,
          Math.PI * 2,
        )
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.arc(hx, hy, flower.head * 0.2, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
  }

  // Seme sotto terra: pulsa piano e si apre quando inizia a crescere
  function drawSeed(time) {
    const alpha = 1 - smoothstep(clamp01((growth - 1) / 0.8))
    if (alpha <= 0.01) return
    const open = smoothstep(clamp01(growth / 0.45))
    const restless = reducedMotion ? 0 : 1 - open
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(0, SEED.y)
    ctx.rotate(-0.22 + Math.sin(time * 1.3) * 0.035 * restless)
    const pulse = (1 + Math.sin(time * 2.4) * 0.03 * restless) * SEED.size
    ctx.scale(pulse, pulse)
    const line = (n) => px(n) / SEED.size

    // buccia
    ctx.lineWidth = line(1.6)
    ctx.beginPath()
    ctx.moveTo(-0.08, 0)
    ctx.bezierCurveTo(-0.08, -0.064, 0.058, -0.07, 0.08, -0.006)
    ctx.bezierCurveTo(0.092, 0.048, -0.02, 0.062, -0.062, 0.04)
    ctx.bezierCurveTo(-0.08, 0.03, -0.081, 0.012, -0.08, 0)
    ctx.closePath()
    ctx.stroke()

    // cucitura e puntinatura della buccia
    ctx.lineWidth = line(1)
    ctx.beginPath()
    ctx.moveTo(-0.062, -0.004)
    ctx.quadraticCurveTo(-0.004, -0.032, 0.064, -0.012)
    ctx.stroke()
    for (const [dx, dy] of [
      [-0.04, 0.02],
      [-0.01, 0.03],
      [0.02, 0.022],
      [0.045, 0.012],
      [-0.025, 0.006],
      [0.008, 0.008],
    ]) {
      ctx.beginPath()
      ctx.arc(dx, dy, line(0.9), 0, Math.PI * 2)
      ctx.fill()
    }

    // crepa che si apre
    const gap = 0.002 + open * 0.012
    ctx.lineWidth = line(1.2)
    for (const shift of [-gap, gap]) {
      ctx.beginPath()
      ctx.moveTo(-0.004, -0.046 + shift)
      ctx.lineTo(0.008, -0.036 + shift)
      ctx.lineTo(0.02, -0.049 + shift)
      ctx.lineTo(0.033, -0.038 + shift)
      ctx.stroke()
    }

    // germoglio a uncino che spunta dalla crepa
    const breathe = reducedMotion ? 0 : Math.sin(time * 2.4) * 0.004 * restless
    const shoot = 0.018 + breathe + open * 0.05
    ctx.lineWidth = line(1.6)
    ctx.beginPath()
    ctx.moveTo(0.014, -0.044)
    ctx.quadraticCurveTo(0.034, -0.044 - shoot * 0.6, 0.016, -0.044 - shoot)
    ctx.quadraticCurveTo(0.004, -0.044 - shoot * 1.1, 0.0, -0.044 - shoot * 0.82)
    ctx.stroke()

    // radichetta che scende
    const root = 0.016 + breathe + open * 0.045
    ctx.beginPath()
    ctx.moveTo(-0.07, 0.024)
    ctx.quadraticCurveTo(-0.09, 0.024 + root * 0.6, -0.074, 0.024 + root)
    ctx.stroke()
    ctx.restore()
  }

  // ---------- animali: compaiono quando non si annaffia ----------
  function drawButterfly(time, alpha) {
    const span = 0.9
    const a = sizeFade(span * zoom, 6, 12, 220, 320) * alpha
    if (a <= 0.01) return
    const x = 1.2 + Math.sin(time * 0.45) * 1.6 + Math.sin(time * 1.3) * 0.3
    const y = -2.2 + Math.sin(time * 0.8) * 0.7
    const flap = 0.2 + 0.8 * Math.abs(Math.sin(time * 8))
    ctx.save()
    ctx.globalAlpha = a
    ctx.translate(x, y)
    ctx.rotate(Math.sin(time * 0.45) * 0.25)
    ctx.lineWidth = px(1)
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.scale(side * flap, 1)
      ctx.beginPath()
      ctx.moveTo(0, -0.02)
      ctx.bezierCurveTo(0.12, -0.36, 0.46, -0.32, 0.42, -0.06)
      ctx.bezierCurveTo(0.4, 0.0, 0.2, 0.02, 0, 0.0)
      ctx.moveTo(0, 0.01)
      ctx.bezierCurveTo(0.14, 0.04, 0.32, 0.22, 0.17, 0.3)
      ctx.bezierCurveTo(0.08, 0.34, 0.02, 0.2, 0, 0.06)
      ctx.stroke()
      // nervature
      ctx.lineWidth = px(0.6)
      ctx.beginPath()
      ctx.moveTo(0.02, -0.02)
      ctx.quadraticCurveTo(0.2, -0.16, 0.34, -0.2)
      ctx.moveTo(0.02, 0.03)
      ctx.quadraticCurveTo(0.12, 0.12, 0.16, 0.22)
      ctx.stroke()
      ctx.restore()
    }
    ctx.lineWidth = px(1.6)
    ctx.beginPath()
    ctx.moveTo(0, -0.1)
    ctx.lineTo(0, 0.14)
    ctx.stroke()
    ctx.lineWidth = px(0.8)
    ctx.beginPath()
    ctx.moveTo(0, -0.1)
    ctx.quadraticCurveTo(-0.04, -0.2, -0.08, -0.22)
    ctx.moveTo(0, -0.1)
    ctx.quadraticCurveTo(0.04, -0.2, 0.08, -0.22)
    ctx.stroke()
    ctx.restore()
  }

  function drawBirds(time, alpha) {
    const span = 8 // 40 cm
    const a = sizeFade(span * zoom, 5, 9, 160, 240) * alpha
    if (a <= 0.01) return
    ctx.save()
    ctx.globalAlpha = a
    ctx.lineWidth = px(1.1)
    for (const bird of env.birds) {
      const x = ((((bird.x + time * bird.speed + 260) % 520) + 520) % 520) - 260
      const y = bird.y + Math.sin(time * 0.6 + bird.phase) * 4
      const flap = Math.sin(time * 6 + bird.phase)
      ctx.beginPath()
      ctx.moveTo(x - span / 2, y - 1.5 + flap * 2.2)
      ctx.quadraticCurveTo(x - span / 4, y - 2.5 - flap * 0.8, x, y)
      ctx.quadraticCurveTo(x + span / 4, y - 2.5 - flap * 0.8, x + span / 2, y - 1.5 + flap * 2.2)
      ctx.stroke()
    }
    ctx.restore()
  }

  // ---------- annaffiatoio e acqua (coordinate schermo) ----------
  function canTilt(now) {
    let tilt = hover * -0.12
    if (waterStart !== null) {
      const t = (now - waterStart) / 1000
      if (t < TILT_OUT_FROM) tilt = lerp(tilt, POUR_ANGLE, easeOutCubic(clamp01(t / TILT_IN)))
      else tilt = lerp(POUR_ANGLE, tilt, easeInOutCubic(clamp01((t - TILT_OUT_FROM) / (TILT_OUT_TO - TILT_OUT_FROM))))
    }
    return tilt
  }

  function canTransform(now, time, intro) {
    const appear = easeOutCubic(clamp01((intro - 0.5) / 0.5))
    const exit = completedAt === null ? 0 : easeInOutCubic(clamp01((now - completedAt) / 900))
    const bob = reducedMotion ? 0 : Math.sin(time * 1.9) * 2.5
    return {
      x: CAN.x + exit * 50,
      y: CAN.y + bob - (1 - appear) * 12 - exit * 30,
      angle: canTilt(now) + exit * 0.3,
      alpha: appear * (1 - exit),
    }
  }

  function drawCan(transform) {
    if (transform.alpha <= 0) return
    ctx.save()
    ctx.globalAlpha = transform.alpha
    ctx.translate(transform.x, transform.y)
    ctx.rotate(transform.angle)
    ctx.lineWidth = 1.6
    for (const path of canPaths) ctx.stroke(path)
    ctx.restore()
  }

  function updateWater(now, dt, transform) {
    if (waterStart !== null && !reducedMotion) {
      const t = (now - waterStart) / 1000
      if (t > POUR_FROM && t < POUR_TO) {
        const cos = Math.cos(transform.angle)
        const sin = Math.sin(transform.angle)
        const sx = transform.x + CAN.spout.x * cos - CAN.spout.y * sin
        const sy = transform.y + CAN.spout.x * sin + CAN.spout.y * cos
        const count = (Math.random() < dt * 50 ? 1 : 0) + (Math.random() < dt * 20 ? 1 : 0)
        for (let i = 0; i < count; i++) {
          drops.push({
            x: sx + (Math.random() - 0.5) * 8,
            y: sy + (Math.random() - 0.5) * 4,
            vx: -45 + Math.random() * 25,
            vy: 10 + Math.random() * 30,
          })
        }
      }
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]
      d.vy += GRAVITY * dt
      d.x += d.vx * dt
      d.y += d.vy * dt
      if (d.y >= anchor.y - 1) {
        for (let k = 0; k < 2; k++) {
          splashes.push({
            x: d.x,
            y: anchor.y - 1,
            vx: (Math.random() - 0.5) * 70,
            vy: -40 - Math.random() * 50,
            life: 0.3,
          })
        }
        drops.splice(i, 1)
      }
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i]
      s.vy += 600 * dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= dt
      if (s.life <= 0 || s.y > anchor.y) splashes.splice(i, 1)
    }

    ctx.lineWidth = 1.1
    for (const d of drops) {
      ctx.beginPath()
      ctx.moveTo(d.x, d.y)
      ctx.lineTo(d.x - d.vx * 0.018, d.y - d.vy * 0.018)
      ctx.stroke()
    }
    for (const s of splashes) {
      ctx.globalAlpha = clamp01(s.life / 0.3)
      ctx.beginPath()
      ctx.arc(s.x, s.y, 0.75, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  function updateGrowth(now) {
    if (waterStart !== null && (now - waterStart) / 1000 >= GROW_FROM && (!growthTween || growthTween.to !== target)) {
      growthTween = { from: growth, to: target, start: now }
    }
    if (waterStart !== null && (now - waterStart) / 1000 >= TILT_OUT_TO) waterStart = null

    if (growthTween) {
      const t = clamp01((now - growthTween.start) / (growDuration * 1000))
      growth = lerp(growthTween.from, growthTween.to, easeInOutCubic(t))
      if (t >= 1) {
        growthTween = null
        if (growth >= MAX_GROWTH && completedAt === null) {
          completedAt = now
          onComplete?.()
        }
      }
    }
  }

  // ---------- ciclo di disegno ----------
  function render(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000)
    lastTime = now
    const time = (now - startTime) / 1000
    const intro = clamp01((now - startTime) / 1600)
    const details = clamp01((intro - 0.35) / 0.65)
    const wind = reducedMotion ? 0 : 0.75 + 0.25 * Math.sin(time * 0.23)
    const busy = waterStart !== null || growthTween !== null
    hover += ((hovering && waterStart === null ? 1 : 0) - hover) * Math.min(1, dt * 8)
    idle += ((busy ? 0 : 1) - idle) * Math.min(1, dt * (busy ? 5 : 1.2))
    const residents = idle * details

    updateGrowth(now)
    updateCamera()

    setScreen()
    ctx.clearRect(0, 0, WORLD.width, WORLD.height)
    ctx.fillStyle = ink
    ctx.strokeStyle = ink
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // sotto terra
    setWorld()
    drawSoil(details)

    setModel()
    layout(tree.roots, time, 0)
    for (const root of tree.roots) drawTapered(root)
    for (const root of tree.roots) if (!root.parent) drawBark(root)

    setWorld()
    drawSeed(time)

    // superficie
    setScreen()
    drawGroundLine(intro)

    // albero
    setModel()
    layout(tree.branches, time, wind)
    for (let i = tree.branches.length - 1; i >= 0; i--) drawTapered(tree.branches[i])
    drawBark(tree.branches[0])
    for (const leaf of tree.leaves) drawLeaf(leaf, time, wind)

    // davanti all'albero
    setWorld()
    drawGrass(time, wind, details)
    drawFlowers(time, wind, details)
    drawButterfly(time, residents)
    drawBirds(time, residents)

    setScreen()
    const transform = canTransform(now, time, intro)
    drawCan(transform)
    updateWater(now, dt, transform)

    frame = requestAnimationFrame(render)
  }
  frame = requestAnimationFrame(render)

  return {
    // Restituisce true se l'annaffiatura è partita
    water() {
      if (waterStart !== null || target >= MAX_GROWTH) return false
      target += 1
      waterStart = performance.now()
      return true
    },
    setHover(value) {
      hovering = value
    },
    destroy() {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      darkQuery.removeEventListener('change', readColors)
    },
  }
}
