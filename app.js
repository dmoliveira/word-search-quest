const STORAGE_KEY = "word-search-quest-state";
const LEGACY_STORAGE_KEYS = ["word-quest-search-state"];
const COACH_DISMISSED_KEY = "word-search-quest-coach-dismissed";
const DAILY_MS = 24 * 60 * 60 * 1000;

const THEMES = {
  tech: ["ALGORITHM", "BROWSER", "CACHE", "CODING", "COMPILER", "DEBUG", "DEPLOY", "GITHUB", "JAVASCRIPT", "KEYBOARD", "NETWORK", "PACKAGE", "PIXEL", "PROMPT", "PYTHON", "REACT", "SERVER", "STATIC", "SYSTEM", "TERMINAL", "TYPESCRIPT", "VECTOR", "VIRTUAL", "WIDGET"],
  nature: ["AURORA", "BLIZZARD", "BROOK", "CANYON", "CORAL", "DUNE", "FOREST", "GLACIER", "HARBOR", "ISLAND", "JUNGLE", "LAGOON", "MEADOW", "MONSOON", "OCEAN", "ORCHID", "RIVER", "SAVANNA", "SEQUOIA", "SUMMIT", "THUNDER", "TUNDRA", "VOLCANO", "WILLOW"],
  animals: ["BADGER", "BEAVER", "BISON", "BUTTERFLY", "COUGAR", "DOLPHIN", "EAGLE", "FALCON", "FERRET", "JAGUAR", "KOALA", "LEMUR", "LYNX", "OTTER", "PANTHER", "PUFFIN", "RABBIT", "SALMON", "SPARROW", "TORTOISE", "WALRUS", "WOMBAT", "ZEBRA", "GECKO"],
  world: ["AMAZON", "ANDES", "BERLIN", "CAIRO", "DELTA", "DUBLIN", "EVEREST", "FIORD", "HAVANA", "KYOTO", "LISBON", "MADRID", "NILE", "OSAKA", "PRAGUE", "SAHARA", "SEOUL", "SYDNEY", "TAIGA", "TOKYO", "TUNDRA", "VENICE", "YUKON", "ZURICH"],
  food: ["APPLE", "BAGEL", "BASIL", "BERRY", "BISCUIT", "BURGER", "CARROT", "CEREAL", "CHEESE", "CHILI", "COCOA", "COOKIE", "GARLIC", "GRAPES", "HONEY", "LEMON", "MUFFIN", "NOODLE", "OMELET", "PANCAKE", "PASTA", "PEPPER", "SALAD", "TACO"],
  space: ["ASTEROID", "COMET", "COSMOS", "CRATER", "ECLIPSE", "GALAXY", "GRAVITY", "HELIUM", "JUPITER", "LANDER", "MERCURY", "METEOR", "NEBULA", "NEPTUNE", "ORBIT", "PLANET", "PLASMA", "ROCKET", "SATURN", "SHUTTLE", "SOLAR", "STAR", "VENUS", "VOYAGER"],
  sports: ["ARCHERY", "BADMINTON", "BASEBALL", "BASKET", "BOXING", "CRICKET", "CYCLING", "FENCING", "FOOTBALL", "GOLF", "HANDBALL", "HOCKEY", "JUDO", "KARATE", "MARATHON", "RUGBY", "SKATING", "SKIING", "SOCCER", "SURFING", "SWIMMING", "TENNIS", "VOLLEY", "WRESTLING"]
};

const PRESETS = {
  relaxed: { label: "Relaxed", size: 8, wordCount: 6, diagonal: false, reverse: false, timer: false, hints: true, mystery: false, funMode: "Sunday stroll" },
  balanced: { label: "Balanced", size: 12, wordCount: 8, diagonal: true, reverse: true, timer: true, hints: true, mystery: false, funMode: "Daily spark" },
  diagonalDash: { label: "Diagonal Dash", size: 10, wordCount: 8, diagonal: true, diagonalOnly: true, reverse: false, timer: true, hints: false, mystery: false, funMode: "Diagonal dash" },
  sprint: { label: "Sprint", size: 10, wordCount: 7, diagonal: true, reverse: false, timer: true, hints: true, mystery: false, funMode: "Quick streak" },
  reverseRush: { label: "Reverse Rush", size: 10, wordCount: 8, diagonal: true, reverse: true, reverseOnly: true, timer: true, hints: false, mystery: false, funMode: "Reverse rush" },
  veteran: { label: "Veteran", size: 15, wordCount: 12, diagonal: true, reverse: true, timer: true, hints: false, mystery: false, funMode: "Dense overlap" }
};

const DAILY_CHALLENGE_SETTINGS = Object.freeze({
  ...PRESETS.balanced,
  preset: "balanced",
  theme: "tech",
  mystery: false
});

const ACHIEVEMENTS = [
  { id: "first-win", label: "First clear", icon: "✨", hint: "Win your first board.", test: (stats) => stats.gamesWon >= 1 },
  { id: "speed-runner", label: "Speed runner", icon: "⚡", hint: "Finish a timed board in 2 minutes.", test: (stats) => stats.bestTimeSeconds !== null && stats.bestTimeSeconds <= 120 },
  { id: "daily-keeper", label: "Daily keeper", icon: "🔥", hint: "Reach a 3-day daily streak.", test: (stats) => stats.bestDailyStreak >= 3 },
  { id: "veteran-hunter", label: "Veteran hunter", icon: "🏆", hint: "Clear a veteran challenge.", test: (stats) => stats.veteranWins >= 1 }
];

const QUEST_RANKS = [
  { label: "Rookie seeker", minWins: 0 },
  { label: "Daily explorer", minWins: 3 },
  { label: "Puzzle tracker", minWins: 8 },
  { label: "Veteran hunter", minWins: 15 }
];

const SPECIAL_MODE_UNLOCKS = [
  { id: "sprint", label: "Sprint", icon: "⚡", hint: "Win 1 board", current: (stats) => stats.gamesWon, target: 1 },
  { id: "reverseRush", label: "Reverse Rush", icon: "🔁", hint: "Reach a 3-day best streak", current: (stats) => stats.bestDailyStreak, target: 3 },
  { id: "diagonalDash", label: "Diagonal Dash", icon: "⬘", hint: "Clear 1 veteran board", current: (stats) => stats.veteranWins, target: 1 }
];

const MODE_GALLERY_ITEMS = [
  { id: "sprint", icon: "⚡", trait: "Fast" },
  { id: "reverseRush", icon: "🔁", trait: "Reverse only" },
  { id: "diagonalDash", icon: "⬘", trait: "Diagonal only" },
  { id: "veteran", icon: "🏆", trait: "Dense" }
];

const elements = {
  board: document.querySelector("#board"),
  wordList: document.querySelector("#wordList"),
  remainingWords: document.querySelector("#remainingWords"),
  statusMessage: document.querySelector("#statusMessage"),
  currentTargetBar: document.querySelector("#currentTargetBar"),
  currentTargetWord: document.querySelector("#currentTargetWord"),
  currentTargetCount: document.querySelector("#currentTargetCount"),
  foundCount: document.querySelector("#foundCount"),
  timerValue: document.querySelector("#timerValue"),
  statusNote: document.querySelector("#statusNote"),
  themeHelp: document.querySelector("#themeHelp"),
  themePreviewChips: document.querySelector("#themePreviewChips"),
  heroLeadLabel: document.querySelector("#heroLeadLabel"),
  heroLeadValue: document.querySelector("#heroLeadValue"),
  modeBadge: document.querySelector("#modeBadge"),
  setupHeading: document.querySelector("#setupHeading"),
  presetLabelText: document.querySelector("#presetLabelText"),
  presetHelp: document.querySelector("#presetHelp"),
  modeGallery: document.querySelector("#modeGallery"),
  modeDescription: document.querySelector("#modeDescription"),
  boardTitle: document.querySelector("#boardTitle"),
  boardSectionTitle: document.querySelector("#boardSectionTitle"),
  boardHelper: document.querySelector("#boardHelper"),
  activePresetLabel: document.querySelector("#activePresetLabel"),
  activeThemeLabel: document.querySelector("#activeThemeLabel"),
  activeRulesLabel: document.querySelector("#activeRulesLabel"),
  funModeLabel: document.querySelector("#funModeLabel"),
  coachStrip: document.querySelector("#coachStrip"),
  dismissCoach: document.querySelector("#dismissCoach"),
  streakValue: document.querySelector("#streakValue"),
  gamesWonValue: document.querySelector("#gamesWonValue"),
  bestTimeValue: document.querySelector("#bestTimeValue"),
  bestStreakStat: document.querySelector("#bestStreakStat"),
  veteranWinsStat: document.querySelector("#veteranWinsStat"),
  achievementList: document.querySelector("#achievementList"),
  unlockTrackList: document.querySelector("#unlockTrackList"),
  questRank: document.querySelector("#questRank"),
  nextUnlockTitle: document.querySelector("#nextUnlockTitle"),
  nextUnlockProgress: document.querySelector("#nextUnlockProgress"),
  nextUnlockHint: document.querySelector("#nextUnlockHint"),
  snapshotDifficulty: document.querySelector("#snapshotDifficulty"),
  snapshotPace: document.querySelector("#snapshotPace"),
  snapshotLoadout: document.querySelector("#snapshotLoadout"),
  snapshotHint: document.querySelector("#snapshotHint"),
  playNextMeta: document.querySelector("#playNextMeta"),
  playNextTitle: document.querySelector("#playNextTitle"),
  playNextFocus: document.querySelector("#playNextFocus"),
  playNextHint: document.querySelector("#playNextHint"),
  playNextButton: document.querySelector("#playNextButton"),
  winHighlights: document.querySelector("#winHighlights"),
  winDialog: document.querySelector("#winDialog"),
  winSummary: document.querySelector("#winSummary"),
  playAgainButton: document.querySelector("#playAgainButton"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  playDaily: document.querySelector("#playDaily"),
  playCustom: document.querySelector("#playCustom"),
  applySettings: document.querySelector("#applySettings"),
  shareChallenge: document.querySelector("#shareChallenge"),
  hintButton: document.querySelector("#hintButton"),
  resetProgress: document.querySelector("#resetProgress"),
  themeSelect: document.querySelector("#themeSelect"),
  presetSelect: document.querySelector("#presetSelect"),
  wordCountInput: document.querySelector("#wordCountInput"),
  wordCountValue: document.querySelector("#wordCountValue"),
  sizeSelect: document.querySelector("#sizeSelect"),
  diagonalToggle: document.querySelector("#diagonalToggle"),
  reverseToggle: document.querySelector("#reverseToggle"),
  timerToggle: document.querySelector("#timerToggle"),
  hintsToggle: document.querySelector("#hintsToggle"),
  mysteryToggle: document.querySelector("#mysteryToggle"),
  modeGalleryButtons: Array.from(document.querySelectorAll(".mode-gallery-card"))
};

const state = {
  mode: "daily",
  settings: { ...PRESETS.balanced, preset: "balanced", theme: "tech", mystery: false },
  seed: "",
  board: [],
  words: [],
  placements: new Map(),
  foundWords: new Set(),
  foundCells: new Set(),
  previewCells: [],
  hintCells: [],
  anchorCell: null,
  pointerSelecting: false,
  pointerMoved: false,
  pointerStartCell: null,
  pointerHadAnchor: false,
  suppressClickAfterPointer: false,
  focusedCell: { row: 0, col: 0 },
  restoreBoardFocus: false,
  boardBuilt: false,
  startTime: Date.now(),
  timerInterval: null,
  coachDismissed: loadCoachDismissed(),
  stats: loadStats()
};

init();

function init() {
  populateSelectors();
  bindEvents();
  const sharedConfig = readConfigFromUrl();
  if (sharedConfig) {
    state.mode = sharedConfig.mode;
    state.settings = { ...state.settings, ...sharedConfig.settings };
    state.seed = sharedConfig.seed;
  } else {
    state.seed = createDailySeed();
  }
  syncControls();
  normalizeDailyStreak();
  renderAchievements();
  startGame(state.seed, state.mode);
}

function populateSelectors() {
  Object.keys(THEMES).forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = capitalize(key);
    elements.themeSelect.append(option);
  });

  Object.entries(PRESETS).forEach(([key, preset]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = preset.label;
    elements.presetSelect.append(option);
  });
  refreshPresetOptions();
}

function bindEvents() {
  elements.playDaily.addEventListener("click", () => {
    applyPreset("balanced");
    startGame(createDailySeed(), "daily");
  });
  elements.playCustom.addEventListener("click", () => {
    state.mode = "custom";
    startGame(randomSeed(), "custom");
  });
  elements.applySettings.addEventListener("click", () => {
    captureSettings();
    startGame(state.mode === "daily" ? createDailySeed() : randomSeed(), state.mode);
  });
  elements.shareChallenge.addEventListener("click", shareChallenge);
  elements.hintButton.addEventListener("click", revealHint);
  elements.resetProgress.addEventListener("click", () => startGame(state.seed, state.mode));
  elements.dismissCoach.addEventListener("click", dismissCoachStrip);
  elements.wordCountInput.addEventListener("input", () => {
    elements.wordCountValue.textContent = elements.wordCountInput.value;
    refreshSetupSnapshot();
  });
  elements.themeSelect.addEventListener("change", () => {
    refreshThemeHelp(elements.themeSelect.value);
    refreshSetupSnapshot();
  });
  elements.presetSelect.addEventListener("change", () => {
    applyPreset(elements.presetSelect.value);
  });
  elements.modeGalleryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const presetKey = sanitizePreset(button.dataset.preset);
      if (state.mode === "daily" || !isPresetUnlocked(presetKey)) {
        renderModeGallery();
        return;
      }
      applyPreset(presetKey);
    });
  });
  [
    elements.sizeSelect,
    elements.diagonalToggle,
    elements.reverseToggle,
    elements.timerToggle,
    elements.hintsToggle,
    elements.mysteryToggle
  ].forEach((control) => {
    control.addEventListener("change", refreshSetupSnapshot);
  });
  elements.playAgainButton.addEventListener("click", () => {
    elements.winDialog.close();
    startGame(state.mode === "daily" ? createDailySeed() : randomSeed(), state.mode);
  });
  elements.closeDialogButton.addEventListener("click", () => elements.winDialog.close());
  elements.playNextButton.addEventListener("click", playRecommendedChallenge);
  window.addEventListener("pointerup", handleGlobalPointerUp);
}

function applyPreset(presetKey) {
  if (!isPresetUnlocked(presetKey)) {
    return;
  }
  const preset = PRESETS[sanitizePreset(presetKey)];
  state.settings = {
    ...state.settings,
    mystery: false,
    diagonalOnly: false,
    reverseOnly: false,
    ...preset,
    preset: presetKey
  };
  syncControls();
}

function captureSettings() {
  const selectedPreset = sanitizeUnlockedPreset(elements.presetSelect.value);
  state.settings = {
    ...state.settings,
    theme: elements.themeSelect.value,
    size: Number(elements.sizeSelect.value),
    wordCount: Number(elements.wordCountInput.value),
    preset: selectedPreset,
    diagonal: elements.diagonalToggle.checked,
    reverse: elements.reverseToggle.checked,
    timer: elements.timerToggle.checked,
    hints: elements.hintsToggle.checked,
    mystery: elements.mysteryToggle.checked,
    diagonalOnly: Boolean(PRESETS[selectedPreset].diagonalOnly),
    reverseOnly: Boolean(PRESETS[selectedPreset].reverseOnly),
    funMode: PRESETS[selectedPreset].funMode
  };
  if (state.settings.diagonalOnly) {
    state.settings.diagonal = true;
  }
  if (state.settings.reverseOnly) {
    state.settings.reverse = true;
  }
}

function syncControls() {
  refreshPresetOptions();
  refreshPresetHelp();
  renderModeGallery();
  elements.themeSelect.value = state.settings.theme;
  elements.sizeSelect.value = String(state.settings.size);
  elements.wordCountInput.value = String(state.settings.wordCount);
  elements.wordCountValue.textContent = String(state.settings.wordCount);
  elements.presetSelect.value = sanitizeUnlockedPreset(state.settings.preset);
  elements.diagonalToggle.checked = state.settings.diagonal;
  elements.reverseToggle.checked = state.settings.reverse;
  elements.timerToggle.checked = state.settings.timer;
  elements.hintsToggle.checked = state.settings.hints;
  elements.mysteryToggle.checked = Boolean(state.settings.mystery);
  updatePresetSpecificLocks();
  refreshThemeHelp();
  refreshSetupSnapshot();
}

function getPreviewSettings() {
  if (state.mode === "daily") {
    return {
      ...state.settings,
      ...DAILY_CHALLENGE_SETTINGS,
      diagonalOnly: false,
      reverseOnly: false,
      funMode: PRESETS[DAILY_CHALLENGE_SETTINGS.preset].funMode
    };
  }

  const presetKey = sanitizeUnlockedPreset(elements.presetSelect.value || state.settings.preset);
  const preset = PRESETS[presetKey];
  const preview = {
    ...state.settings,
    theme: sanitizeTheme(elements.themeSelect.value),
    size: sanitizeSize(elements.sizeSelect.value, state.settings.size),
    wordCount: sanitizeWordCount(elements.wordCountInput.value, state.settings.wordCount),
    preset: presetKey,
    diagonal: elements.diagonalToggle.checked,
    reverse: elements.reverseToggle.checked,
    timer: elements.timerToggle.checked,
    hints: elements.hintsToggle.checked,
    mystery: elements.mysteryToggle.checked,
    diagonalOnly: Boolean(preset.diagonalOnly),
    reverseOnly: Boolean(preset.reverseOnly),
    funMode: preset.funMode
  };

  if (preview.diagonalOnly) {
    preview.diagonal = true;
  }
  if (preview.reverseOnly) {
    preview.reverse = true;
  }

  return preview;
}

function refreshSetupSnapshot() {
  const preview = getPreviewSettings();
  const difficulty = state.mode === "daily" ? PRESETS[DAILY_CHALLENGE_SETTINGS.preset].label : getSnapshotDifficulty(preview);
  const pace = getSnapshotPace(preview);
  const modeLabels = [];

  if (preview.mystery) {
    modeLabels.push("Mystery");
  }
  if (preview.reverseOnly) {
    modeLabels.push("Reverse Rush");
  }
  if (preview.diagonalOnly) {
    modeLabels.push("Diagonal Dash");
  }
  if (preview.preset === "sprint") {
    modeLabels.push("Sprint");
  }

  const loadout = [`${preview.size}x${preview.size}`, `${preview.wordCount} words`, ...modeLabels];
  elements.snapshotDifficulty.textContent = difficulty;
  elements.snapshotPace.textContent = pace;
  elements.snapshotLoadout.textContent = loadout.join(" • ");
  elements.snapshotHint.textContent = buildSnapshotHint(preview, difficulty, pace);
}

function buildSnapshotHint(preview, difficulty, pace) {
  if (state.mode === "daily") {
    return "Today's shared board locks in the balanced daily setup, so everyone gets the same steady challenge.";
  }
  if (difficulty === "Balanced" && pace === "Steady" && !preview.mystery && !preview.diagonalOnly && !preview.reverseOnly) {
    return "A balanced board with enough overlap to stay interesting without feeling punishing.";
  }

  const intensity = difficulty === "Relaxed"
    ? "keeps things light"
    : difficulty === "Balanced"
      ? "stays approachable"
      : difficulty === "Challenging"
        ? "leans into trickier overlap"
        : "pushes into veteran territory";
  const flow = pace === "Relaxed"
    ? "with a slower, low-pressure rhythm"
    : pace === "Steady"
      ? "with a measured solving rhythm"
      : pace === "Quick"
        ? "with quicker reads and faster scans"
        : "with tight reads that reward sharp scanning";
  const twist = preview.mystery
    ? " Mystery mode hides the full list until you uncover each word."
    : preview.reverseOnly
      ? " Reverse Rush turns every target backward."
      : preview.diagonalOnly
        ? " Diagonal Dash keeps every word on slanted lines."
        : !preview.hints
          ? " Hints stay off, so every find is earned."
          : "";

  return `This ${difficulty.toLowerCase()} board ${intensity} ${flow}.${twist}`;
}

function getSnapshotDifficulty(preview) {
  let score = 0;
  score += preview.size >= 15 ? 3 : preview.size >= 12 ? 2 : preview.size >= 10 ? 1 : 0;
  score += preview.wordCount >= 12 ? 3 : preview.wordCount >= 9 ? 2 : preview.wordCount >= 7 ? 1 : 0;
  score += preview.diagonal ? 1 : 0;
  score += preview.reverse ? 1 : 0;
  score += preview.timer ? 1 : 0;
  score += preview.hints ? 0 : 2;
  score += preview.mystery ? 2 : 0;
  score += preview.diagonalOnly ? 2 : 0;
  score += preview.reverseOnly ? 2 : 0;

  if (score <= 2) {
    return "Relaxed";
  }
  if (score <= 6) {
    return "Balanced";
  }
  if (score <= 10) {
    return "Challenging";
  }
  return "Veteran";
}

function getSnapshotPace(preview) {
  let score = 0;
  score += preview.timer ? 2 : -1;
  score += preview.size >= 15 ? 2 : preview.size >= 12 ? 1 : 0;
  score += preview.wordCount >= 10 ? 2 : preview.wordCount >= 8 ? 1 : 0;
  score += preview.diagonalOnly || preview.reverseOnly ? 2 : 0;
  score += preview.mystery ? 1 : 0;
  score += preview.hints ? 0 : 1;

  if (score <= 0) {
    return "Relaxed";
  }
  if (score <= 3) {
    return "Steady";
  }
  if (score <= 6) {
    return "Quick";
  }
  return "Sharp";
}

function startGame(seed, mode) {
  captureSettings();
  state.mode = mode;
  if (mode === "daily") {
    state.settings = { ...state.settings, ...DAILY_CHALLENGE_SETTINGS };
    syncControls();
  } else if (!isPresetUnlocked(state.settings.preset)) {
    applyPreset("balanced");
    captureSettings();
  }
  state.seed = seed;
  normalizeDailyStreak();
  const puzzle = generatePuzzle({ ...state.settings, seed });
  state.board = puzzle.board;
  state.words = puzzle.words;
  state.placements = puzzle.placements;
  state.foundWords = new Set();
  state.foundCells = new Set();
  state.previewCells = [];
  state.hintCells = [];
  state.anchorCell = null;
  state.pointerSelecting = false;
  state.pointerMoved = false;
  state.pointerStartCell = null;
  state.pointerHadAnchor = false;
  state.suppressClickAfterPointer = false;
  state.restoreBoardFocus = false;
  state.boardBuilt = false;
  state.startTime = Date.now();
  clearInterval(state.timerInterval);
  if (state.settings.timer) {
    tickTimer();
    state.timerInterval = setInterval(tickTimer, 1000);
  } else {
    elements.timerValue.textContent = "Timer off";
  }
  updateSummaryLabels();
  updateModeMessaging();
  renderBoard();
  updateProgress();
  updateCurrentTarget();
  updateCoachStrip();
  updateUrl();
  setStatus(mode === "daily"
    ? `Today's shared board is ready. Find ${state.words.length} words.`
    : `Your custom board is ready. Find ${state.words.length} words.`);
}

function generatePuzzle({ seed, size, wordCount, theme, diagonal, reverse, reverseOnly, diagonalOnly }) {
  const rng = createRng(seed);
  const board = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
  const themeWords = shuffle([...THEMES[theme]], rng).filter((word) => word.length <= size).slice(0, Math.min(wordCount, THEMES[theme].length));
  const placements = new Map();
  const directions = getDirections(diagonal, reverse, reverseOnly, diagonalOnly);

  themeWords.forEach((word) => {
    const placed = placeWord(board, word, directions, rng);
    if (placed) {
      placements.set(word, placed);
    }
  });

  const words = Array.from(placements.keys());
  fillBoard(board, rng);
  return { board, words, placements };
}

function getDirections(diagonal, reverse, reverseOnly = false, diagonalOnly = false) {
  const base = [[0, 1], [1, 0]];
  if (diagonal) {
    base.push([1, 1], [1, -1]);
  }
  if (diagonalOnly) {
    const diagonals = [[1, 1], [1, -1]];
    return reverse ? [...diagonals, ...diagonals.map(([row, col]) => [-row, -col])] : diagonals;
  }
  if (reverseOnly) {
    return base.map(([row, col]) => [-row, -col]);
  }
  return reverse ? [...base, ...base.map(([row, col]) => [-row, -col])] : base;
}

function placeWord(board, word, directions, rng) {
  const size = board.length;
  const shuffledDirections = shuffle([...directions], rng);
  for (let attempt = 0; attempt < 220; attempt += 1) {
    const [rowStep, colStep] = shuffledDirections[attempt % shuffledDirections.length];
    const startRow = randomInt(rng, 0, size - 1);
    const startCol = randomInt(rng, 0, size - 1);
    const path = [];
    let fits = true;
    for (let index = 0; index < word.length; index += 1) {
      const row = startRow + rowStep * index;
      const col = startCol + colStep * index;
      if (row < 0 || row >= size || col < 0 || col >= size) {
        fits = false;
        break;
      }
      const existing = board[row][col];
      if (existing && existing !== word[index]) {
        fits = false;
        break;
      }
      path.push({ row, col });
    }
    if (!fits) {
      continue;
    }
    path.forEach(({ row, col }, index) => {
      board[row][col] = word[index];
    });
    return { path, direction: [rowStep, colStep] };
  }
  return null;
}

function fillBoard(board, rng) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) {
        board[rowIndex][colIndex] = letters[randomInt(rng, 0, letters.length - 1)];
      }
    });
  });
}

function renderBoard() {
  if (!state.boardBuilt) {
    buildBoard();
  }
  refreshBoardState();
}

function buildBoard() {
  const shouldRestoreFocus = state.restoreBoardFocus;
  elements.board.innerHTML = "";
  elements.board.style.gridTemplateColumns = `repeat(${state.board.length}, var(--board-cell-size))`;
  elements.board.dataset.size = String(state.board.length);
  elements.board.classList.remove("is-solved");
  state.board.forEach((row, rowIndex) => {
    row.forEach((letter, colIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "board-cell";
      button.textContent = letter;
      button.dataset.row = String(rowIndex);
      button.dataset.col = String(colIndex);
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `Row ${rowIndex + 1} column ${colIndex + 1}: ${letter}`);
      button.addEventListener("pointerdown", onPointerDownCell);
      button.addEventListener("pointerenter", onPointerEnterCell);
      button.addEventListener("click", onClickCell);
      button.addEventListener("keydown", onBoardKeyDown);
      button.addEventListener("focus", () => {
        state.focusedCell = { row: rowIndex, col: colIndex };
      });
      elements.board.append(button);
    });
  });
  state.boardBuilt = true;
  refreshBoardState();
  if (shouldRestoreFocus) {
    focusCell(state.focusedCell.row, state.focusedCell.col);
  }
}

function refreshBoardState() {
  const previewKeys = new Set(state.previewCells.map((cell) => cellKey(cell.row, cell.col)));
  const hintKeys = new Set(state.hintCells);
  const anchorKey = state.anchorCell ? cellKey(state.anchorCell.row, state.anchorCell.col) : null;
  elements.board.querySelectorAll(".board-cell").forEach((button) => {
    const key = cellKey(Number(button.dataset.row), Number(button.dataset.col));
    button.classList.toggle("found", state.foundCells.has(key));
    button.classList.toggle("preview", previewKeys.has(key));
    button.classList.toggle("hint", hintKeys.has(key));
    button.classList.toggle("anchor", anchorKey === key);
    button.tabIndex = Number(button.dataset.row) === state.focusedCell.row && Number(button.dataset.col) === state.focusedCell.col ? 0 : -1;
  });
}

function renderWordList() {
  elements.wordList.innerHTML = "";
  state.words.forEach((word) => {
    const item = document.createElement("li");
    const found = state.foundWords.has(word);
    item.textContent = state.settings.mystery && !found ? `Hidden word ${state.words.indexOf(word) + 1}` : word;
    if (found) item.classList.add("found");
    if (!found && state.settings.mystery) item.classList.add("mystery");
    elements.wordList.append(item);
  });
  const remaining = state.words.length - state.foundWords.size;
  elements.remainingWords.textContent = state.settings.mystery ? `${remaining} hidden` : `${remaining} left`;
}

function updateCurrentTarget() {
  const nextWord = state.words.find((word) => !state.foundWords.has(word));
  const remaining = Math.max(0, state.words.length - state.foundWords.size);

  if (!nextWord) {
    elements.currentTargetWord.textContent = "Board cleared";
    elements.currentTargetCount.textContent = "0 left";
    return;
  }

  elements.currentTargetWord.textContent = state.settings.mystery
    ? `Hidden word ${state.words.indexOf(nextWord) + 1}`
    : nextWord;
  elements.currentTargetCount.textContent = `${remaining} left`;
}

function renderAchievements() {
  elements.achievementList.innerHTML = "";
  ACHIEVEMENTS.forEach((achievement) => {
    const item = document.createElement("li");
    const unlocked = achievement.test(state.stats);
    item.innerHTML = `<span class="achievement-badge" aria-hidden="true">${achievement.icon}</span><span class="achievement-copy"><span class="achievement-title">${achievement.label}</span><span class="achievement-meta">${unlocked ? "Unlocked" : achievement.hint}</span></span>`;
    if (unlocked) item.classList.add("unlocked");
    elements.achievementList.append(item);
  });
  elements.bestStreakStat.textContent = String(state.stats.bestDailyStreak);
  elements.veteranWinsStat.textContent = String(state.stats.veteranWins);
  renderProgressionPanel();
}

function updateProgress() {
  normalizeDailyStreak();
  elements.foundCount.textContent = `${state.foundWords.size} / ${state.words.length}`;
  elements.streakValue.textContent = String(state.stats.dailyStreak);
  elements.gamesWonValue.textContent = String(state.stats.gamesWon);
  elements.bestTimeValue.textContent = formatBestTime(state.stats.bestTimeSeconds);
  renderProgressionPanel();
  renderWordList();
  updateCurrentTarget();
  updateCoachStrip();
}

function updateCoachStrip() {
  const shouldHide = state.coachDismissed || state.foundWords.size > 0;
  elements.coachStrip.hidden = shouldHide;
}

function dismissCoachStrip() {
  state.coachDismissed = true;
  updateCoachStrip();
  saveCoachDismissed();
}

function renderProgressionPanel() {
  const nextUnlock = getNextUnlock();
  const rank = [...QUEST_RANKS].reverse().find((item) => state.stats.gamesWon >= item.minWins) || QUEST_RANKS[0];
  const recommendation = getRecommendedChallenge();
  elements.questRank.textContent = rank.label;
  elements.nextUnlockTitle.textContent = nextUnlock.label;
  elements.nextUnlockProgress.textContent = `${nextUnlock.current} / ${nextUnlock.target}`;
  elements.nextUnlockHint.textContent = nextUnlock.hint;
  elements.playNextMeta.textContent = `${recommendation.modeLabel} • ${recommendation.presetLabel}`;
  elements.playNextTitle.textContent = recommendation.title;
  elements.playNextFocus.textContent = recommendation.focus;
  elements.playNextHint.textContent = recommendation.hint;
  renderUnlockTrack();
  refreshPresetOptions();
  refreshPresetHelp();
  renderModeGallery();
}

function renderModeGallery() {
  elements.modeGalleryButtons.forEach((button) => {
    const presetKey = sanitizePreset(button.dataset.preset);
    const unlock = getPresetUnlock(presetKey);
    const unlocked = isPresetUnlocked(presetKey);
    const active = state.mode !== "daily" && state.settings.preset === presetKey;
    const badge = button.querySelector(".mode-gallery-badge");
    const icon = button.querySelector(".mode-gallery-icon");
    const name = button.querySelector(".mode-gallery-name");
    const meta = button.querySelector(".mode-gallery-meta");
    const item = MODE_GALLERY_ITEMS.find((galleryItem) => galleryItem.id === presetKey);

    if (icon && item) {
      icon.textContent = item.icon;
    }
    if (name) {
      name.textContent = PRESETS[presetKey].label;
    }
    if (meta && item) {
      meta.textContent = item.trait;
    }

    button.disabled = state.mode === "daily" || !unlocked;
    button.setAttribute("aria-disabled", String(button.disabled));
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("active", active);
    button.classList.toggle("locked", !unlocked);

    if (!badge) {
      return;
    }

    if (unlock && !unlocked) {
      const current = Math.min(unlock.current(state.stats), unlock.target);
      badge.hidden = false;
      badge.textContent = `${current}/${unlock.target}`;
      badge.title = unlock.hint;
    } else {
      badge.hidden = true;
      badge.textContent = "";
      badge.removeAttribute("title");
    }
  });
}

function refreshThemeHelp(themeKey = state.settings.theme) {
  const themeWords = THEMES[themeKey] || [];
  const samples = themeWords.slice(0, 3).join(", ");
  elements.themeHelp.textContent = `Theme picks the word pack only. ${capitalize(themeKey)} sample: ${samples}.`;
  elements.themePreviewChips.innerHTML = themeWords.slice(0, 4).map((word) => `<span>${word}</span>`).join("");
}

function renderUnlockTrack() {
  elements.unlockTrackList.innerHTML = "";
  SPECIAL_MODE_UNLOCKS.forEach((unlock) => {
    const current = Math.min(unlock.current(state.stats), unlock.target);
    const unlocked = current >= unlock.target;
    const item = document.createElement("li");
    item.className = `unlock-track-item${unlocked ? " unlocked" : ""}`;
    item.innerHTML = `<span class="unlock-track-icon" aria-hidden="true">${unlock.icon}</span><span class="unlock-track-copy"><span class="unlock-track-title">${unlock.label}</span><span class="unlock-track-meta">${unlocked ? "Unlocked" : unlock.hint}</span></span><span class="unlock-track-progress">${current} / ${unlock.target}</span>`;
    elements.unlockTrackList.append(item);
  });
}

function refreshPresetOptions() {
  Array.from(elements.presetSelect.options).forEach((option) => {
    const presetKey = option.value;
    const unlocked = isPresetUnlocked(presetKey);
    option.disabled = !unlocked;
    option.textContent = unlocked ? PRESETS[presetKey].label : `${PRESETS[presetKey].label} (Locked)`;
  });
}

function refreshPresetHelp() {
  if (state.mode === "daily") {
    elements.presetHelp.textContent = "Daily mode uses one shared preset so everyone plays the same challenge.";
    return;
  }
  const nextLockedPreset = SPECIAL_MODE_UNLOCKS.find((unlock) => !isPresetUnlocked(unlock.id));
  if (!nextLockedPreset) {
    elements.presetHelp.textContent = "All special presets are unlocked. Mix in Mystery Mode, Reverse Rush, or Diagonal Dash for extra variety.";
    return;
  }
  elements.presetHelp.textContent = `${nextLockedPreset.label} unlocks after ${nextLockedPreset.hint.toLowerCase()} • ${Math.min(nextLockedPreset.current(state.stats), nextLockedPreset.target)}/${nextLockedPreset.target}`;
}

function isPresetUnlocked(presetKey) {
  const unlock = getPresetUnlock(presetKey);
  if (!unlock) {
    return true;
  }
  return unlock.current(state.stats) >= unlock.target;
}

function getPresetUnlock(presetKey) {
  return SPECIAL_MODE_UNLOCKS.find((item) => item.id === presetKey);
}

function sanitizeUnlockedPreset(presetKey) {
  const safePreset = sanitizePreset(presetKey);
  return isPresetUnlocked(safePreset) ? safePreset : "balanced";
}

function getNextUnlock() {
  if (state.stats.gamesWon < 1) {
    return { label: "First clear", current: state.stats.gamesWon, target: 1, hint: "Unlocks achievement progress with your first finished board." };
  }
  if (state.stats.bestDailyStreak < 3) {
    return { label: "Daily keeper", current: state.stats.bestDailyStreak, target: 3, hint: "Unlocks achievement progress by extending your daily streak." };
  }
  if (state.stats.veteranWins < 1) {
    return { label: "Veteran hunter", current: state.stats.veteranWins, target: 1, hint: "Unlocks achievement progress by clearing one veteran board." };
  }
  if (state.stats.bestTimeSeconds === null || state.stats.bestTimeSeconds > 120) {
    return {
      label: "Speed runner",
      current: state.stats.bestTimeSeconds === null ? "—" : formatSeconds(state.stats.bestTimeSeconds),
      target: "02:00",
      hint: "Unlocks achievement progress by finishing a timed board in 2 minutes or less."
    };
  }
  return { label: "Quest board complete", current: ACHIEVEMENTS.length, target: ACHIEVEMENTS.length, hint: "All current achievement goals are unlocked — keep sharpening your times." };
}

function getRecommendedChallenge() {
  if (state.stats.gamesWon < 1) {
    return {
      mode: "custom",
      preset: "relaxed",
      theme: "animals",
      title: "Relaxed starter board",
      focus: "First clear",
      hint: "Best route to land your first win with a smaller, friendlier grid.",
      modeLabel: "Custom",
      presetLabel: PRESETS.relaxed.label
    };
  }
  if (state.stats.bestDailyStreak < 3) {
    return {
      mode: "daily",
      preset: DAILY_CHALLENGE_SETTINGS.preset,
      theme: DAILY_CHALLENGE_SETTINGS.theme,
      title: "Daily shared board",
      focus: "Daily keeper",
      hint: "Best route to extend your streak and unlock the daily progression badge.",
      modeLabel: "Daily",
      presetLabel: PRESETS[DAILY_CHALLENGE_SETTINGS.preset].label
    };
  }
  if (state.stats.veteranWins < 1) {
    return {
      mode: "custom",
      preset: "veteran",
      theme: "tech",
      title: "Veteran challenge",
      focus: "Veteran hunter",
      hint: "Best route to unlock your first veteran clear and prove you can handle dense boards.",
      modeLabel: "Custom",
      presetLabel: PRESETS.veteran.label
    };
  }
  if (state.stats.bestTimeSeconds === null || state.stats.bestTimeSeconds > 120) {
    return {
      mode: "custom",
      preset: "sprint",
      theme: "nature",
      title: "Sprint run",
      focus: "Speed runner",
      hint: "Best route to chase a sub-two-minute clear with a faster board setup.",
      modeLabel: "Custom",
      presetLabel: PRESETS.sprint.label
    };
  }
  return {
    mode: "custom",
    preset: "diagonalDash",
    theme: "world",
    title: "Diagonal Dash",
    focus: "Mastery loop",
    hint: "Push into an all-diagonal hunt when you want a fresh veteran-style challenge.",
    modeLabel: "Custom",
    presetLabel: PRESETS.diagonalDash.label
  };
}

function playRecommendedChallenge() {
  const recommendation = getRecommendedChallenge();
  if (recommendation.mode === "daily") {
    applyPreset(DAILY_CHALLENGE_SETTINGS.preset);
    state.settings = { ...state.settings, ...DAILY_CHALLENGE_SETTINGS, preset: DAILY_CHALLENGE_SETTINGS.preset, theme: DAILY_CHALLENGE_SETTINGS.theme };
    syncControls();
    startGame(createDailySeed(), "daily");
    return;
  }
  applyPreset(recommendation.preset);
  state.settings = {
    ...state.settings,
    ...PRESETS[recommendation.preset],
    preset: recommendation.preset,
    theme: recommendation.theme,
    mystery: recommendation.title === "Mystery challenge"
  };
  syncControls();
  startGame(randomSeed(), "custom");
}

function updateSummaryLabels() {
  elements.activePresetLabel.textContent = PRESETS[state.settings.preset].label;
  elements.activeThemeLabel.textContent = capitalize(state.settings.theme);
  elements.activeRulesLabel.textContent = state.settings.diagonalOnly
    ? `Diagonal only • ${state.settings.reverse ? "Reverse" : "Forward"}`
    : state.settings.reverseOnly
      ? "Diagonal • Reverse only"
      : `${state.settings.diagonal ? "Diagonal" : "Straight"} • ${state.settings.reverse ? "Reverse" : "Forward"}`;
  elements.funModeLabel.textContent = state.settings.mystery ? `${state.settings.funMode} • Mystery` : state.settings.funMode;
}

function updateModeMessaging() {
  const mode = state.mode;
  const isDaily = mode === "daily";
  elements.modeBadge.textContent = isDaily ? "Daily" : "Custom";
  elements.setupHeading.textContent = isDaily ? "Daily challenge details" : "Custom word search setup";
  elements.presetLabelText.textContent = isDaily ? "Daily preset" : "Challenge preset";
  elements.boardTitle.textContent = isDaily ? "Daily puzzle board" : "Custom puzzle board";
  elements.boardSectionTitle.textContent = isDaily ? "Board" : "Custom board";
  elements.boardHelper.textContent = isDaily
    ? "Drag across letters or use click/tap start → finish in today's shared word search."
    : "Build your own board, then drag across letters or use click/tap start → finish to solve it.";
  if (state.settings.mystery) {
    elements.boardHelper.textContent += " Mystery mode hides the full word list until you reveal each word.";
  }
  if (state.settings.diagonalOnly) {
    elements.boardHelper.textContent += " Diagonal Dash places every target on diagonal lines only.";
  }
  if (state.settings.reverseOnly) {
    elements.boardHelper.textContent += " Reverse Rush places every target backwards for a more veteran-friendly hunt.";
  }
  elements.modeDescription.textContent = isDaily
    ? "Everyone gets the same daily word search seed, so you can compare runs and share the challenge."
    : "Generate endless custom boards with your favorite theme, size, and rule mix for a tailored challenge.";
  elements.heroLeadLabel.textContent = isDaily ? "Today's shared seed" : "Custom board";
  elements.heroLeadValue.textContent = isDaily ? state.seed : `${state.settings.size}×${state.settings.size}`;
  elements.statusNote.textContent = isDaily
    ? "Daily challenge settings are fixed so everyone plays the same board and streaks stay fair."
    : "Custom mode lets you tune size, rules, and hints without affecting your daily streak.";
  toggleDailyControls(isDaily);
  renderModeGallery();
}

function onPointerDownCell(event) {
  event.preventDefault();
  const cell = getCellFromElement(event.currentTarget);
  state.pointerSelecting = true;
  state.pointerMoved = false;
  state.pointerStartCell = cell;
  state.pointerHadAnchor = Boolean(state.anchorCell);
  state.suppressClickAfterPointer = false;
  if (!state.pointerHadAnchor) {
    beginSelection(cell);
  }
}

function onPointerEnterCell(event) {
  if (!state.pointerSelecting || !state.anchorCell) return;
  state.pointerMoved = true;
  previewSelection(getCellFromElement(event.currentTarget));
}

function handleGlobalPointerUp() {
  if (!state.pointerSelecting) return;
  const tappedCell = state.pointerStartCell;
  state.pointerSelecting = false;
  state.suppressClickAfterPointer = true;
  if (state.previewCells.length > 1) {
    finalizeSelection(state.previewCells[state.previewCells.length - 1]);
  } else if (!state.pointerHadAnchor && tappedCell) {
    beginSelection(tappedCell);
    setStatus("Anchor locked. Tap another cell on the same line to finish.");
  } else if (tappedCell) {
    finalizeSelection(tappedCell);
  }
  state.pointerStartCell = null;
  state.pointerHadAnchor = false;
}

function onClickCell(event) {
  state.restoreBoardFocus = false;
  if (state.suppressClickAfterPointer) {
    state.suppressClickAfterPointer = false;
    return;
  }
  if (state.pointerMoved) {
    state.pointerMoved = false;
    return;
  }
  const cell = getCellFromElement(event.currentTarget);
  if (!state.anchorCell) {
    beginSelection(cell);
    setStatus("Start cell selected. Choose an end cell in the same line.");
    return;
  }
  finalizeSelection(cell);
}

function onBoardKeyDown(event) {
  const cell = getCellFromElement(event.currentTarget);
  state.focusedCell = cell;
  state.restoreBoardFocus = true;
  const next = moveFocus(event.key, cell);
  if (next) {
    event.preventDefault();
    focusCell(next.row, next.col);
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (!state.anchorCell) {
      beginSelection(cell);
      setStatus("Keyboard anchor selected. Move and press Enter or Space again to finish.");
    } else {
      finalizeSelection(cell);
    }
  }
}

function beginSelection(cell) {
  state.anchorCell = cell;
  state.previewCells = [cell];
  state.hintCells = [];
  renderBoard();
}

function previewSelection(cell) {
  const path = buildPath(state.anchorCell, cell);
  state.previewCells = path || [state.anchorCell];
  renderBoard();
}

function finalizeSelection(cell) {
  if (!state.anchorCell) return;
  const path = buildPath(state.anchorCell, cell);
  if (!path) {
    setStatus("Selections must stay in a straight line.");
    keepAnchorSelection();
    return;
  }
  const matchedWord = findMatchedWordForPath(path);
  if (!matchedWord || state.foundWords.has(matchedWord)) {
    setStatus("No match there yet. Try another line.");
    keepAnchorSelection();
    return;
  }
  state.foundWords.add(matchedWord);
  path.forEach(({ row, col }) => state.foundCells.add(cellKey(row, col)));
  setStatus(`Nice! You found ${matchedWord}.`);
  clearSelection(false);
  state.anchorCell = null;
  updateProgress();
  renderBoard();
  if (state.foundWords.size === state.words.length) {
    completePuzzle();
  }
}

function clearSelection(clearAnchor = true) {
  state.previewCells = [];
  if (clearAnchor) state.anchorCell = null;
  renderBoard();
}

function keepAnchorSelection() {
  state.previewCells = state.anchorCell ? [state.anchorCell] : [];
  renderBoard();
}

function revealHint() {
  if (!state.settings.hints) {
    setStatus("Hints are disabled for this challenge.");
    return;
  }
  const target = state.words.find((word) => !state.foundWords.has(word));
  if (!target) {
    setStatus("Everything is already found.");
    return;
  }
  const firstCell = state.placements.get(target)?.path?.[0];
  if (!firstCell) return;
  state.hintCells = [cellKey(firstCell.row, firstCell.col)];
  setStatus(`Spark hint: ${target[0]} is glowing on the board.`);
  renderBoard();
}

function completePuzzle() {
  clearInterval(state.timerInterval);
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - state.startTime) / 1000));
  const previousBestTime = state.stats.bestTimeSeconds;
  const previousBestStreak = state.stats.bestDailyStreak;
  updateStatsOnWin(elapsedSeconds);
  updateProgress();
  renderAchievements();
  renderWinHighlights(elapsedSeconds, previousBestTime, previousBestStreak);
  elements.winSummary.textContent = `Solved in ${formatSeconds(elapsedSeconds)} on ${PRESETS[state.settings.preset].label} with the ${capitalize(state.settings.theme)} pack.`;
  elements.board.classList.remove("is-solved");
  void elements.board.offsetWidth;
  elements.board.classList.add("is-solved");
  if (typeof elements.winDialog.showModal === "function") {
    elements.winDialog.showModal();
  }
}

function renderWinHighlights(elapsedSeconds, previousBestTime, previousBestStreak) {
  const cards = [
    { label: "Clear time", value: formatSeconds(elapsedSeconds) },
    { label: "Mode", value: state.mode === "daily" ? "Daily" : "Custom" },
    { label: "Streak", value: state.mode === "daily" ? `${state.stats.dailyStreak} day${state.stats.dailyStreak === 1 ? "" : "s"}` : PRESETS[state.settings.preset].label }
  ];
  if (state.settings.timer && (previousBestTime === null || state.stats.bestTimeSeconds < previousBestTime)) {
    cards.push({ label: "New best", value: "Personal best" });
  } else if (state.mode === "daily" && state.stats.bestDailyStreak > previousBestStreak) {
    cards.push({ label: "Streak high", value: `${state.stats.bestDailyStreak}` });
  } else {
    cards.push({ label: "Theme", value: capitalize(state.settings.theme) });
  }
  if (state.settings.mystery) {
    cards[1] = { label: "Mode", value: "Mystery" };
  }
  elements.winHighlights.innerHTML = cards.map((card) => `<div class="win-chip"><span>${card.label}</span><strong>${card.value}</strong></div>`).join("");
}

function updateStatsOnWin(elapsedSeconds) {
  state.stats.gamesWon += 1;
  if (state.mode === "daily" && isCanonicalDailySetup() && state.seed === createDailySeed()) {
    const todaySeed = createDailySeed();
    if (state.stats.lastDailySeed !== todaySeed) {
      const yesterdaySeed = createDailySeed(Date.now() - DAILY_MS);
      state.stats.dailyStreak = state.stats.lastDailySeed === yesterdaySeed ? state.stats.dailyStreak + 1 : 1;
      state.stats.lastDailySeed = todaySeed;
      state.stats.bestDailyStreak = Math.max(state.stats.bestDailyStreak, state.stats.dailyStreak);
    }
  }
  if (state.settings.preset === "veteran") state.stats.veteranWins += 1;
  if (state.settings.timer && (state.stats.bestTimeSeconds === null || elapsedSeconds < state.stats.bestTimeSeconds)) {
    state.stats.bestTimeSeconds = elapsedSeconds;
  }
  saveStats();
}

function shareChallenge() {
  const url = new URL(window.location.href);
  const text = `Try my Word Search Quest ${state.mode} puzzle: ${url.toString()}`;
  if (navigator.share) {
    navigator.share({ title: "Word Search Quest", text, url: url.toString() }).catch(() => copyToClipboard(url.toString()));
    return;
  }
  copyToClipboard(url.toString());
}

function copyToClipboard(text) {
  const writeText = navigator.clipboard?.writeText;
  if (!writeText) {
    setStatus(`Copy this challenge link: ${text}`);
    return;
  }
  writeText.call(navigator.clipboard, text)
    .then(() => setStatus("Challenge link copied to your clipboard."))
    .catch(() => setStatus(`Copy this challenge link: ${text}`));
}

function updateUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("mode", state.mode);
  url.searchParams.set("seed", state.seed);
  url.searchParams.set("theme", state.settings.theme);
  url.searchParams.set("size", state.settings.size);
  url.searchParams.set("wordCount", state.settings.wordCount);
  url.searchParams.set("preset", state.settings.preset);
  url.searchParams.set("diagonal", state.settings.diagonal);
  url.searchParams.set("reverse", state.settings.reverse);
  url.searchParams.set("timer", state.settings.timer);
  url.searchParams.set("hints", state.settings.hints);
  url.searchParams.set("mystery", state.settings.mystery);
  window.history.replaceState({}, "", url);
}

function readConfigFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("seed")) return null;
  const preset = sanitizePreset(params.get("preset"));
  const theme = sanitizeTheme(params.get("theme"));
  return {
    mode: params.get("mode") || "custom",
    seed: params.get("seed"),
    settings: {
      theme,
      size: sanitizeSize(params.get("size"), PRESETS[preset].size),
      wordCount: sanitizeWordCount(params.get("wordCount"), PRESETS[preset].wordCount),
      preset,
      diagonal: parseBoolean(params.get("diagonal"), PRESETS[preset].diagonal),
      reverse: parseBoolean(params.get("reverse"), PRESETS[preset].reverse),
      timer: parseBoolean(params.get("timer"), PRESETS[preset].timer),
      hints: parseBoolean(params.get("hints"), PRESETS[preset].hints),
      mystery: parseBoolean(params.get("mystery"), false),
      diagonalOnly: Boolean(PRESETS[preset].diagonalOnly),
      reverseOnly: Boolean(PRESETS[preset].reverseOnly),
      funMode: PRESETS[preset].funMode
    }
  };
}

function findMatchedWordForPath(path) {
  const pathKey = path.map(({ row, col }) => cellKey(row, col)).join("|");
  const reversedPathKey = [...path].reverse().map(({ row, col }) => cellKey(row, col)).join("|");
  return state.words.find((word) => {
    const placement = state.placements.get(word);
    if (!placement) {
      return false;
    }
    const placementKey = placement.path.map(({ row, col }) => cellKey(row, col)).join("|");
    return placementKey === pathKey || (state.settings.reverse && placementKey === reversedPathKey);
  });
}

function tickTimer() {
  elements.timerValue.textContent = formatSeconds(Math.round((Date.now() - state.startTime) / 1000));
}

function buildPath(start, end) {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;
  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);
  const rowAbs = Math.abs(rowDelta);
  const colAbs = Math.abs(colDelta);
  const diagonalMove = rowAbs === colAbs && rowAbs !== 0;
  const straightMove = rowAbs === 0 || colAbs === 0;
  if (!diagonalMove && !straightMove) return null;
  if (!state.settings.diagonal && diagonalMove) return null;
  const length = Math.max(rowAbs, colAbs) + 1;
  return Array.from({ length }, (_, index) => ({ row: start.row + rowStep * index, col: start.col + colStep * index }));
}

function moveFocus(key, cell) {
  const deltas = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  const delta = deltas[key];
  if (!delta) return null;
  return { row: clamp(cell.row + delta[0], 0, state.board.length - 1), col: clamp(cell.col + delta[1], 0, state.board.length - 1) };
}

function focusCell(row, col) {
  state.focusedCell = { row, col };
  const cell = elements.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  elements.board.querySelectorAll(".board-cell").forEach((button) => { button.tabIndex = -1; });
  cell.tabIndex = 0;
  cell.focus();
}

function getCellFromElement(element) {
  return { row: Number(element.dataset.row), col: Number(element.dataset.col) };
}

function setStatus(text) {
  elements.statusMessage.textContent = text;
}

function loadCoachDismissed() {
  try {
    return window.localStorage.getItem(COACH_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function saveCoachDismissed() {
  try {
    window.localStorage.setItem(COACH_DISMISSED_KEY, String(state.coachDismissed));
  } catch {
    setStatus("Coach tip was hidden, but this browser blocked local save access.");
  }
}

function loadStats() {
  try {
    const storedKeys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
    for (const key of storedKeys) {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        return { ...defaultStats(), ...JSON.parse(raw) };
      }
    }
    return defaultStats();
  } catch {
    return defaultStats();
  }
}

function saveStats() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats));
  } catch {
    setStatus("Your win counted, but this browser blocked local save access.");
  }
}

function defaultStats() {
  return { gamesWon: 0, dailyStreak: 0, bestDailyStreak: 0, veteranWins: 0, bestTimeSeconds: null, lastDailySeed: null };
}

function normalizeDailyStreak() {
  const todaySeed = createDailySeed();
  const yesterdaySeed = createDailySeed(Date.now() - DAILY_MS);
  if (state.stats.lastDailySeed === todaySeed || state.stats.lastDailySeed === yesterdaySeed) {
    return;
  }
  state.stats.dailyStreak = 0;
}

function toggleDailyControls(isDaily) {
  [
    elements.themeSelect,
    elements.sizeSelect,
    elements.wordCountInput,
    elements.presetSelect,
    elements.diagonalToggle,
    elements.reverseToggle,
    elements.timerToggle,
    elements.hintsToggle,
    elements.mysteryToggle
  ].forEach((control) => {
    control.disabled = isDaily;
    control.setAttribute("aria-disabled", String(isDaily));
  });
  updatePresetSpecificLocks();
}

function updatePresetSpecificLocks() {
  const diagonalLocked = Boolean(state.settings.diagonalOnly);
  const reverseLocked = Boolean(state.settings.reverseOnly);
  const dailyLocked = state.mode === "daily";
  elements.diagonalToggle.disabled = dailyLocked || diagonalLocked;
  elements.diagonalToggle.setAttribute("aria-disabled", String(elements.diagonalToggle.disabled));
  if (diagonalLocked) {
    elements.diagonalToggle.checked = true;
  }
  elements.reverseToggle.disabled = dailyLocked || reverseLocked;
  elements.reverseToggle.setAttribute("aria-disabled", String(elements.reverseToggle.disabled));
  if (reverseLocked) {
    elements.reverseToggle.checked = true;
  }
}

function isCanonicalDailySetup() {
  return state.settings.theme === DAILY_CHALLENGE_SETTINGS.theme
    && state.settings.size === DAILY_CHALLENGE_SETTINGS.size
    && state.settings.wordCount === DAILY_CHALLENGE_SETTINGS.wordCount
    && state.settings.preset === DAILY_CHALLENGE_SETTINGS.preset
    && state.settings.diagonal === DAILY_CHALLENGE_SETTINGS.diagonal
    && state.settings.reverse === DAILY_CHALLENGE_SETTINGS.reverse
    && state.settings.timer === DAILY_CHALLENGE_SETTINGS.timer
    && state.settings.hints === DAILY_CHALLENGE_SETTINGS.hints;
}

function createDailySeed(timestamp = Date.now()) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function createRng(seedText) {
  let seed = 0;
  for (let index = 0; index < seedText.length; index += 1) seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
  return () => {
    seed = (1664525 * seed + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function randomSeed() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function shuffle(items, rng) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function formatSeconds(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatBestTime(seconds) {
  return seconds === null ? "—" : formatSeconds(seconds);
}

function cellKey(row, col) {
  return `${row}:${col}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sanitizePreset(value) {
  return Object.hasOwn(PRESETS, value) ? value : "balanced";
}

function sanitizeTheme(value) {
  return Object.hasOwn(THEMES, value) ? value : "tech";
}

function sanitizeSize(value, fallback) {
  const allowed = new Set([8, 10, 12, 15]);
  const numeric = Number(value);
  return allowed.has(numeric) ? numeric : fallback;
}

function sanitizeWordCount(value, fallback) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 5 && numeric <= 14 ? numeric : fallback;
}

function parseBoolean(value, fallback) {
  if (value === null) {
    return fallback;
  }
  return value !== "false";
}
