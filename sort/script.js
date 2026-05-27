const barsEl = document.getElementById("bars");
const messageEl = document.getElementById("message");
const comparisonsEl = document.getElementById("comparisons");
const swapsEl = document.getElementById("swaps");
const randomizeBtn = document.getElementById("randomizeBtn");
const sortBtn = document.getElementById("sortBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");
const sizeInput = document.getElementById("sizeInput");
const speedInput = document.getElementById("speedInput");

let values = [];
let originalValues = [];
let actions = [];
let actionIndex = 0;
let running = false;
let paused = false;
let comparisons = 0;
let swaps = 0;
let highlight = {};
let sortedIndices = new Set();
let timerId = null;

function randomValue() {
  return Math.floor(Math.random() * 86) + 10;
}

function generateArray() {
  values = Array.from({ length: Number(sizeInput.value) }, randomValue);
  originalValues = [...values];
  resetState("Generate an array, then start the quick sort animation.");
}

function resetState(message) {
  clearTimeout(timerId);
  actions = buildActions([...values]);
  actionIndex = 0;
  running = false;
  paused = false;
  comparisons = 0;
  swaps = 0;
  highlight = {};
  sortedIndices = new Set();
  messageEl.textContent = message;
  updateControls();
  render();
}

function buildActions(input) {
  const simulated = [...input];
  const steps = [];

  function quickSort(low, high) {
    if (low > high) {
      return;
    }

    if (low === high) {
      steps.push({ type: "mark-sorted", indices: [low], message: `Single item at index ${low} is already sorted.` });
      return;
    }

    steps.push({ type: "range", low, high, message: `Sorting the range from index ${low} to ${high}.` });
    const pivotIndex = high;
    const pivotValue = simulated[pivotIndex];
    let i = low - 1;
    steps.push({ type: "pivot", pivotIndex, message: `Choose ${pivotValue} as the pivot.` });

    for (let j = low; j < high; j++) {
      steps.push({ type: "compare", left: j, pivotIndex, message: `Compare ${simulated[j]} with pivot ${pivotValue}.` });
      if (simulated[j] < pivotValue) {
        i++;
        if (i !== j) {
          steps.push({ type: "swap", left: i, right: j, message: `${simulated[j]} is smaller than the pivot, so swap it left.` });
          [simulated[i], simulated[j]] = [simulated[j], simulated[i]];
        } else {
          steps.push({ type: "keep", index: j, pivotIndex, message: `${simulated[j]} is already in the left partition.` });
        }
      }
    }

    const finalPivotIndex = i + 1;
    if (finalPivotIndex !== high) {
      steps.push({ type: "swap", left: finalPivotIndex, right: high, message: `Move pivot ${pivotValue} into its final sorted position.` });
      [simulated[finalPivotIndex], simulated[high]] = [simulated[high], simulated[finalPivotIndex]];
    }

    steps.push({ type: "mark-sorted", indices: [finalPivotIndex], message: `Pivot ${pivotValue} is now fixed at index ${finalPivotIndex}.` });
    quickSort(low, finalPivotIndex - 1);
    quickSort(finalPivotIndex + 1, high);
  }

  quickSort(0, simulated.length - 1);
  steps.push({ type: "done", message: "The array is sorted." });
  return steps;
}

function render() {
  barsEl.innerHTML = "";
  const max = Math.max(...values);

  values.forEach((value, index) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.dataset.value = value;
    bar.style.setProperty("--value", String((value / max) * 100));

    if (sortedIndices.has(index)) {
      bar.classList.add("sorted");
    }
    if (highlight.pivotIndex === index) {
      bar.classList.add("pivot");
    }
    if (highlight.compare?.includes(index)) {
      bar.classList.add("compare");
    }
    if (highlight.swap?.includes(index)) {
      bar.classList.add("swap");
    }

    barsEl.appendChild(bar);
  });

  comparisonsEl.textContent = comparisons;
  swapsEl.textContent = swaps;
}

function delay() {
  return 920 - Number(speedInput.value) * 8;
}

function applyAction(action) {
  highlight = {};

  if (action.type === "pivot") {
    highlight.pivotIndex = action.pivotIndex;
  }

  if (action.type === "compare") {
    comparisons++;
    highlight.pivotIndex = action.pivotIndex;
    highlight.compare = [action.left, action.pivotIndex];
  }

  if (action.type === "keep") {
    highlight.pivotIndex = action.pivotIndex;
    highlight.compare = [action.index];
  }

  if (action.type === "swap") {
    swaps++;
    highlight.swap = [action.left, action.right];
    [values[action.left], values[action.right]] = [values[action.right], values[action.left]];
  }

  if (action.type === "mark-sorted") {
    action.indices.forEach((index) => sortedIndices.add(index));
  }

  if (action.type === "done") {
    values.forEach((_, index) => sortedIndices.add(index));
    running = false;
    paused = false;
    highlight = {};
  }

  messageEl.textContent = action.message;
  render();
  updateControls();
}

function step() {
  if (actionIndex >= actions.length) {
    return;
  }

  running = true;
  applyAction(actions[actionIndex]);
  actionIndex++;

  if (actionIndex >= actions.length) {
    running = false;
    paused = false;
    updateControls();
  }
}

function run() {
  if (!running || paused) {
    return;
  }

  step();

  if (running && !paused) {
    timerId = setTimeout(run, delay());
  }
}

function startSort() {
  if (actionIndex >= actions.length) {
    values = [...originalValues];
    resetState("Restarting quick sort from the original array.");
  }

  running = true;
  paused = false;
  updateControls();
  run();
}

function pauseSort() {
  paused = true;
  clearTimeout(timerId);
  updateControls();
}

function resumeSort() {
  running = true;
  paused = false;
  updateControls();
  run();
}

function updateControls() {
  sortBtn.textContent = paused ? "Resume" : "Start";
  pauseBtn.disabled = !running || paused;
  randomizeBtn.disabled = running && !paused;
  sizeInput.disabled = running && !paused;
}

randomizeBtn.addEventListener("click", generateArray);

sortBtn.addEventListener("click", () => {
  if (paused) {
    resumeSort();
  } else {
    startSort();
  }
});

pauseBtn.addEventListener("click", pauseSort);

stepBtn.addEventListener("click", () => {
  if (!running || paused) {
    paused = true;
    step();
    paused = true;
    updateControls();
  }
});

resetBtn.addEventListener("click", () => {
  values = [...originalValues];
  resetState("Reset to the original unsorted array.");
});

sizeInput.addEventListener("input", generateArray);

generateArray();
