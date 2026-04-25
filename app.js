const STORAGE_KEY = "word-search-quest-state";
const LEGACY_STORAGE_KEYS = ["word-quest-search-state"];
const DAILY_MS = 24 * 60 * 60 * 1000;

const THEMES = {
  tech: ["ALGORITHM", "BROWSER", "CACHE", "CODING", "COMPILER", "DEBUG", "DEPLOY", "GITHUB", "JAVASCRIPT", "KEYBOARD", "NETWORK", "PACKAGE", "PIXEL", "PROMPT", "PYTHON", "REACT", "SERVER", "STATIC", "SYSTEM", "TERMINAL", "TYPESCRIPT", "VECTOR", "VIRTUAL", "WIDGET"],
  nature: ["AURORA", "BLIZZARD", "BROOK", "CANYON", "CORAL", "DUNE", "FOREST", "GLACIER", "HARBOR", "ISLAND", "JUNGLE", "LAGOON", "MEADOW", "MONSOON", "OCEAN", "ORCHID", "RIVER", "SAVANNA", "SEQUOIA", "SUMMIT", "THUNDER", "TUNDRA", "VOLCANO", "WILLOW"],
  animals: ["BADGER", "BEAVER", "BISON", "BUTTERFLY", "COUGAR", "DOLPHIN", "EAGLE", "FALCON", "FERRET", "JAGUAR", "KOALA", "LEMUR", "LYNX", "OTTER", "PANTHER", "PUFFIN", "RABBIT", "SALMON", "SPARROW", "TORTOISE", "WALRUS", "WOMBAT", "ZEBRA", "GECKO"],
  world: ["AMAZON", "ANDES", "BERLIN", "CAIRO", "DELTA", "DUBLIN", "EVEREST", "FIORD", "HAVANA", "KYOTO", "LISBON", "MADRID", "NILE", "OSAKA", "PRAGUE", "SAHARA", "SEOUL", "SYDNEY", "TAIGA", "TOKYO", "TUNDRA", "VENICE", "YUKON", "ZURICH"]
};

const PRESETS = {
  relaxed: { label: "Relaxed", size: 8, wordCount: 6, diagonal: false, reverse: false, timer: false, hints: true, funMode: "Sunday stroll" },
  balanced: { label: "Balanced", size: 12, wordCount: 8, diagonal: true, reverse: true, timer: true, hints: true, funMode: "Daily spark" },
  sprint: { label: "Sprint", size: 10, wordCount: 7, diagonal: true, reverse: false, timer: true, hints: true, funMode: "Quick streak" },
  veteran: { label: "Veteran", size: 15, wordCount: 12, diagonal: true, reverse: true, timer: true, hints: false, funMode: "Dense overlap" }
};

const ACHIEVEMENTS = [
  { id: "first-win", label: "First clear", test: (stats) => stats.gamesWon >= 1 },
  { id: "speed-runner", label: "Speed runner", test: (stats) => stats.bestTimeSeconds !== null && stats.bestTimeSeconds <= 120 },
  { id: "daily-keeper", label: "Daily keeper", test: (stats) => stats.bestDailyStreak >= 3 },
  { id: "veteran-hunter", label: "Veteran hunter", test: (stats) => stats.veteranWins >= 1 }
];

const elements = {
  board: document.querySelector("#board"),
  wordList: document.querySelector("#wordList"),
  remainingWords: document.querySelector("#remainingWords"),
  statusMessage: document.querySelector("#statusMessage"),
  foundCount: document.querySelector("#foundCount"),
  timerValue: document.querySelector("#timerValue"),
  heroLeadLabel: document.querySelector("#heroLeadLabel"),
  heroLeadValue: document.querySelector("#heroLeadValue"),
  modeBadge: document.querySelector("#modeBadge"),
  setupHeading: document.querySelector("#setupHeading"),
  presetLabelText: document.querySelector("#presetLabelText"),
  modeDescription: document.querySelector("#modeDescription"),
  boardTitle: document.querySelector("#boardTitle"),
  boardSectionTitle: document.querySelector("#boardSectionTitle"),
  boardHelper: document.querySelector("#boardHelper"),
  activePresetLabel: document.querySelector("#activePresetLabel"),
  activeThemeLabel: document.querySelector("#activeThemeLabel"),
  activeRulesLabel: document.querySelector("#activeRulesLabel"),
  funModeLabel: document.querySelector("#funModeLabel"),
  streakValue: document.querySelector("#streakValue"),
  gamesWonValue: document.querySelector("#gamesWonValue"),
  bestTimeValue: document.querySelector("#bestTimeValue"),
  bestStreakStat: document.querySelector("#bestStreakStat"),
  veteranWinsStat: document.querySelector("#veteranWinsStat"),
  achievementList: document.querySelector("#achievementList"),
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
  hintsToggle: document.querySelector("#hintsToggle")
};

const state = {
  mode: "daily",
  settings: { ...PRESETS.balanced, preset: "balanced", theme: "tech" },
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
  startTime: Date.now(),
  timerInterval: null,
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
  elements.wordCountInput.addEventListener("input", () => {
    elements.wordCountValue.textContent = elements.wordCountInput.value;
  });
  elements.presetSelect.addEventListener("change", () => {
    applyPreset(elements.presetSelect.value);
  });
  elements.playAgainButton.addEventListener("click", () => {
    elements.winDialog.close();
    startGame(state.mode === "daily" ? createDailySeed() : randomSeed(), state.mode);
  });
  elements.closeDialogButton.addEventListener("click", () => elements.winDialog.close());
  window.addEventListener("pointerup", handleGlobalPointerUp);
}

function applyPreset(presetKey) {
  const preset = PRESETS[sanitizePreset(presetKey)];
  state.settings = { ...state.settings, ...preset, preset: presetKey };
  syncControls();
}

function captureSettings() {
  state.settings = {
    ...state.settings,
    theme: elements.themeSelect.value,
    size: Number(elements.sizeSelect.value),
    wordCount: Number(elements.wordCountInput.value),
    preset: sanitizePreset(elements.presetSelect.value),
    diagonal: elements.diagonalToggle.checked,
    reverse: elements.reverseToggle.checked,
    timer: elements.timerToggle.checked,
    hints: elements.hintsToggle.checked,
    funMode: PRESETS[sanitizePreset(elements.presetSelect.value)].funMode
  };
}

function syncControls() {
  elements.themeSelect.value = state.settings.theme;
  elements.sizeSelect.value = String(state.settings.size);
  elements.wordCountInput.value = String(state.settings.wordCount);
  elements.wordCountValue.textContent = String(state.settings.wordCount);
  elements.presetSelect.value = state.settings.preset;
  elements.diagonalToggle.checked = state.settings.diagonal;
  elements.reverseToggle.checked = state.settings.reverse;
  elements.timerToggle.checked = state.settings.timer;
  elements.hintsToggle.checked = state.settings.hints;
}

function startGame(seed, mode) {
  captureSettings();
  state.mode = mode;
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
  updateUrl();
  setStatus(mode === "daily"
    ? `Today's shared board is ready. Find ${state.words.length} words.`
    : `Your custom board is ready. Find ${state.words.length} words.`);
}

function generatePuzzle({ seed, size, wordCount, theme, diagonal, reverse }) {
  const rng = createRng(seed);
  const board = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
  const themeWords = shuffle([...THEMES[theme]], rng).filter((word) => word.length <= size).slice(0, Math.min(wordCount, THEMES[theme].length));
  const placements = new Map();
  const directions = getDirections(diagonal, reverse);

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

function getDirections(diagonal, reverse) {
  const base = [[0, 1], [1, 0]];
  if (diagonal) {
    base.push([1, 1], [1, -1]);
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
  const shouldRestoreFocus = state.restoreBoardFocus;
  elements.board.innerHTML = "";
  elements.board.style.gridTemplateColumns = `repeat(${state.board.length}, var(--cell-size))`;
  state.board.forEach((row, rowIndex) => {
    row.forEach((letter, colIndex) => {
      const button = document.createElement("button");
      const key = cellKey(rowIndex, colIndex);
      button.type = "button";
      button.className = "board-cell";
      button.textContent = letter;
      button.dataset.row = String(rowIndex);
      button.dataset.col = String(colIndex);
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `Row ${rowIndex + 1} column ${colIndex + 1}: ${letter}`);
      button.tabIndex = rowIndex === state.focusedCell.row && colIndex === state.focusedCell.col ? 0 : -1;
      if (state.foundCells.has(key)) button.classList.add("found");
      if (state.previewCells.some((cell) => cellKey(cell.row, cell.col) === key)) button.classList.add("preview");
      if (state.hintCells.includes(key)) button.classList.add("hint");
      if (state.anchorCell && cellKey(state.anchorCell.row, state.anchorCell.col) === key) button.classList.add("anchor");
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
  if (shouldRestoreFocus) {
    focusCell(state.focusedCell.row, state.focusedCell.col);
  }
}

function renderWordList() {
  elements.wordList.innerHTML = "";
  state.words.forEach((word) => {
    const item = document.createElement("li");
    item.textContent = word;
    if (state.foundWords.has(word)) item.classList.add("found");
    elements.wordList.append(item);
  });
  elements.remainingWords.textContent = `${state.words.length - state.foundWords.size} left`;
}

function renderAchievements() {
  elements.achievementList.innerHTML = "";
  ACHIEVEMENTS.forEach((achievement) => {
    const item = document.createElement("li");
    item.textContent = achievement.label;
    if (achievement.test(state.stats)) item.classList.add("unlocked");
    elements.achievementList.append(item);
  });
  elements.bestStreakStat.textContent = String(state.stats.bestDailyStreak);
  elements.veteranWinsStat.textContent = String(state.stats.veteranWins);
}

function updateProgress() {
  normalizeDailyStreak();
  elements.foundCount.textContent = `${state.foundWords.size} / ${state.words.length}`;
  elements.streakValue.textContent = String(state.stats.dailyStreak);
  elements.gamesWonValue.textContent = String(state.stats.gamesWon);
  elements.bestTimeValue.textContent = formatBestTime(state.stats.bestTimeSeconds);
  renderWordList();
}

function updateSummaryLabels() {
  elements.activePresetLabel.textContent = PRESETS[state.settings.preset].label;
  elements.activeThemeLabel.textContent = capitalize(state.settings.theme);
  elements.activeRulesLabel.textContent = `${state.settings.diagonal ? "Diagonal" : "Straight"} • ${state.settings.reverse ? "Reverse" : "Forward"}`;
  elements.funModeLabel.textContent = state.settings.funMode;
}

function updateModeMessaging() {
  const mode = state.mode;
  const isDaily = mode === "daily";
  elements.modeBadge.textContent = isDaily ? "Daily" : "Custom";
  elements.setupHeading.textContent = isDaily ? "Daily puzzle controls" : "Custom word search setup";
  elements.presetLabelText.textContent = isDaily ? "Daily preset" : "Challenge preset";
  elements.boardTitle.textContent = isDaily ? "Daily puzzle board" : "Custom puzzle board";
  elements.boardSectionTitle.textContent = isDaily ? "Board" : "Custom board";
  elements.boardHelper.textContent = isDaily
    ? "Drag across letters or use click/tap start → finish in today's shared word search."
    : "Build your own board, then drag across letters or use click/tap start → finish to solve it.";
  elements.modeDescription.textContent = isDaily
    ? "Everyone gets the same daily word search seed, so you can compare runs and share the challenge."
    : "Generate endless custom boards with your favorite theme, size, and rule mix for a tailored challenge.";
  elements.heroLeadLabel.textContent = isDaily ? "Today's shared seed" : "Custom board";
  elements.heroLeadValue.textContent = isDaily ? state.seed : `${state.settings.size}×${state.settings.size}`;
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
    clearSelection();
    return;
  }
  const matchedWord = findMatchedWordForPath(path);
  if (!matchedWord || state.foundWords.has(matchedWord)) {
    setStatus("No match there yet. Try another line.");
    clearSelection();
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
  updateStatsOnWin(elapsedSeconds);
  updateProgress();
  renderAchievements();
  elements.winSummary.textContent = `Solved in ${formatSeconds(elapsedSeconds)} on ${PRESETS[state.settings.preset].label} with the ${capitalize(state.settings.theme)} pack.`;
  if (typeof elements.winDialog.showModal === "function") {
    elements.winDialog.showModal();
  }
}

function updateStatsOnWin(elapsedSeconds) {
  state.stats.gamesWon += 1;
  if (state.mode === "daily") {
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
    return placementKey === pathKey || placementKey === reversedPathKey;
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
