// Modello dell'albero: genera (sempre uguali, grazie al seme fisso) fusto, rami,
// foglie, radici e dettagli del terreno, con i tempi di crescita di ogni parte.
// La crescita è un numero G da 0 a MAX_GROWTH: ogni annaffiatura aggiunge 1.

// Dimensioni del canvas (unità logiche) e punto del modello da cui parte il tronco
export const WORLD = { width: 400, height: 550, groundY: 360, trunkX: 182 }
export const MAX_GROWTH = 5

// Crescita esponenziale:
// - l'albero vero diventa treeBase volte più grande a ogni annaffiatura
// - l'inquadratura si allarga di cameraBase volte a ogni annaffiatura
// Con treeBase > cameraBase l'albero cresce anche sullo schermo, mentre l'ambiente rimpicciolisce.
export const SCALE = {
  treeBase: 3.5,
  cameraBase: 3.2,
  unitCm: 4.8, // 1 unità di mondo ≈ 4,8 cm (l'albero finito è alto ~15 m)
}
const LAST_GROWTH = MAX_GROWTH - 0.12 // tutto è cresciuto un attimo prima della fine

export function createRandom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function between(rand, min, max) {
  return min + rand() * (max - min)
}

// Riscala i tempi così che l'ultima parte finisca di crescere a LAST_GROWTH
function normalizeTimes(items) {
  const end = Math.max(...items.map((item) => item.born + item.dur))
  const k = LAST_GROWTH / end
  for (const item of items) {
    item.born *= k
    item.dur *= k
    if (item.dies) item.dies *= k
  }
}

// ---------- Chioma ----------
function buildCanopy(rand) {
  const branches = []
  const leaves = []

  const trunk = {
    kind: 'branch',
    parent: null,
    start: { x: WORLD.trunkX, y: WORLD.groundY + 5 },
    angle: -Math.PI / 2 + 0.035,
    length: 178,
    bend: 0.05,
    wBase: 17,
    wTip: 3.2,
    flare: 0.8,
    born: 0,
    dur: 3.4,
    depth: 0,
    phase: rand() * 6.28,
  }
  branches.push(trunk)

  // Foglioline del germoglio: cadono quando l'albero diventa grande
  for (const [t, side] of [
    [0.16, -1],
    [0.19, 1],
    [0.22, -1],
    [0.25, 1],
  ]) {
    leaves.push({
      branch: trunk,
      t,
      rel: side * between(rand, 0.75, 1.05),
      size: between(rand, 10, 12),
      born: trunk.dur * t + 0.05,
      dur: 0.5,
      dies: 3.1,
      phase: rand() * 6.28,
    })
  }

  function addBranch(parent, t, rel, length, depth) {
    const branch = {
      kind: 'branch',
      parent,
      t,
      rel,
      length,
      depth,
      bend: between(rand, -0.14, 0.14),
      wBase: parent.wBase * (depth === 1 ? 0.5 : 0.6),
      wTip: 0.45,
      born: parent.born + parent.dur * t,
      dur: depth === 1 ? 1.3 : depth === 2 ? 0.85 : 0.55,
      phase: rand() * 6.28,
    }
    branches.push(branch)

    if (depth < 3) {
      const count = depth === 1 ? 3 + (rand() < 0.5 ? 1 : 0) : 2 + (rand() < 0.6 ? 1 : 0)
      let side = rand() < 0.5 ? -1 : 1
      for (let i = 0; i < count; i++) {
        const childT = Math.min(0.97, between(rand, 0.3, 0.5) + i * (0.55 / count))
        // i rami tendono verso l'alto (verso la luce)
        const towardSky = Math.sin(rel) * -0.12
        addBranch(branch, childT, side * between(rand, 0.32, 0.72) + towardSky, length * between(rand, 0.55, 0.72), depth + 1)
        side *= -1
      }
    }

    if (depth >= 1) {
      const count = depth === 3 ? 7 : depth === 2 ? 4 : 3
      for (let i = 0; i < count; i++) {
        const lt = i === count - 1 ? 1 : between(rand, depth === 1 ? 0.6 : 0.2, 0.98)
        leaves.push({
          branch,
          t: lt,
          rel: (i % 2 ? 1 : -1) * between(rand, 0.45, 1.15),
          size: between(rand, 6.5, 10),
          born: branch.born + branch.dur * lt + 0.08,
          dur: 0.5,
          phase: rand() * 6.28,
        })
      }
    }
    return branch
  }

  // Rami principali, alternati a destra e sinistra, più aperti in basso
  const mains = 6
  for (let i = 0; i < mains; i++) {
    const t = 0.38 + i * (0.56 / (mains - 1))
    const side = i % 2 === 0 ? -1 : 1
    const rel = side * between(rand, 0.62, 0.9) * (1.25 - t * 0.6)
    const length = trunk.length * between(rand, 0.62, 0.74) * (1.32 - t * 0.62)
    addBranch(trunk, t, rel, length, 1)
  }
  // Cima
  addBranch(trunk, 0.99, between(rand, -0.12, 0.12), 52, 1)

  normalizeTimes([...branches, ...leaves])
  return { branches, leaves }
}

// ---------- Radici ----------
function buildRoots(rand) {
  const roots = []
  const base = { x: WORLD.trunkX, y: WORLD.groundY + 3 }

  function addRoot(parent, t, rel, length, wBase, depth) {
    const root = {
      kind: 'root',
      parent,
      t,
      rel,
      length,
      depth,
      bend: between(rand, -0.22, 0.22),
      wBase,
      wTip: 0.35,
      born: parent.born + parent.dur * t,
      dur: depth === 1 ? 1.4 : 0.9,
      phase: 0,
    }
    roots.push(root)
    if (depth < 2) {
      const count = 2
      let side = rand() < 0.5 ? -1 : 1
      for (let i = 0; i < count; i++) {
        addRoot(
          root,
          between(rand, 0.25, 0.55) + i * (0.4 / count),
          side * between(rand, 0.3, 0.75),
          length * between(rand, 0.4, 0.6),
          wBase * 0.45,
          depth + 1,
        )
        side *= -1
      }
    }
  }

  // [angolo (0 = destra, PI/2 = giù), lunghezza, spessore]
  const mains = [
    [Math.PI / 2 + 0.06, 100, 13],
    [0.36, 124, 11],
    [Math.PI - 0.34, 118, 11],
    [0.98, 104, 9.5],
    [Math.PI - 0.95, 100, 9.5],
    [0.18, 78, 7],
    [Math.PI - 0.17, 84, 7],
  ]
  for (const [angle, length, wBase] of mains) {
    const main = {
      kind: 'root',
      parent: null,
      start: { x: base.x + Math.cos(angle) * 4, y: base.y },
      angle,
      length,
      // la curva delle radici principali piega sempre verso il basso
      bend: between(rand, 0.04, 0.18) * Math.sign(Math.cos(angle)),
      wBase,
      wTip: 0.4,
      born: between(rand, 0, 0.5),
      dur: 3.6,
      depth: 0,
      phase: 0,
    }
    roots.push(main)
    let side = rand() < 0.5 ? -1 : 1
    for (let i = 0; i < 3; i++) {
      addRoot(main, 0.22 + i * 0.22 + between(rand, 0, 0.1), side * between(rand, 0.35, 0.7), length * between(rand, 0.42, 0.6), wBase * 0.5, 1)
      side *= -1
    }
  }

  normalizeTimes(roots)
  return roots
}

// ---------- Ambiente (in unità di mondo: 1 unità ≈ SCALE.unitCm centimetri) ----------
// Gli oggetti hanno misure reali: guardandoli si capisce quanto è grande l'albero.
function logUniform(rand, min, max) {
  return Math.exp(between(rand, Math.log(min), Math.log(max)))
}

function buildEnvironment(rand) {
  const side = () => (rand() < 0.5 ? -1 : 1)

  // Sassolini e granelli: distribuiti su tutte le scale, così ogni inquadratura ne ha alcuni
  const pebbles = Array.from({ length: 170 }, () => {
    const level = logUniform(rand, 0.4, 230)
    return {
      x: side() * level * between(rand, 0.04, 1),
      y: level * between(rand, 0.05, 0.85),
      rx: level * between(rand, 0.008, 0.03),
      ratio: between(rand, 0.5, 0.8),
      rotation: between(rand, -0.7, 0.7),
    }
  })
  const specks = Array.from({ length: 200 }, () => {
    const level = logUniform(rand, 0.4, 230)
    return {
      x: side() * level * between(rand, 0.02, 1),
      y: level * between(rand, 0.03, 0.9),
      length: level * between(rand, 0.006, 0.016),
    }
  })

  // Erba: fili alti 2–20 cm
  const grass = Array.from({ length: 95 }, () => {
    const x = side() * logUniform(rand, 0.7, 230)
    const height = between(rand, 0.5, 4)
    return {
      x,
      height,
      blades: Array.from({ length: 2 + Math.floor(rand() * 3) }, () => ({
        dx: between(rand, -0.15, 0.15) * height,
        height: height * between(rand, 0.6, 1),
        lean: between(rand, -0.45, 0.45),
        phase: rand() * 6.28,
      })),
    }
  })

  // Margherite: 12–25 cm
  const flowers = Array.from({ length: 14 }, () => ({
    x: side() * logUniform(rand, 2, 110),
    height: between(rand, 2.5, 5),
    head: between(rand, 0.35, 0.6),
    lean: between(rand, -0.3, 0.3),
    phase: rand() * 6.28,
  }))

  // Uccelli in volo
  const birds = Array.from({ length: 4 }, () => ({
    x: between(rand, -250, 250),
    y: -between(rand, 140, 300),
    speed: between(rand, 10, 18),
    phase: rand() * 6.28,
  }))

  return { pebbles, specks, grass, flowers, birds }
}

export function buildTree(seed = 20261102) {
  const rand = createRandom(seed)
  const { branches, leaves } = buildCanopy(rand)
  const roots = buildRoots(rand)
  const environment = buildEnvironment(rand)
  return { branches, leaves, roots, environment }
}
