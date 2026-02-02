// Bebop Puzzle Maker - Application JavaScript

// ============================================
// CENTRALIZED STATE
// ============================================
const state = {
    elements: [],
    savedLibrary: [],
    history: [],
    redoStack: [],
    selectedIndices: [],
    clipboard: [],
    activeTool: 'select',
    canvasSize: 600,
    isDrawing: false,
    isMarquee: false,
    marqueeStart: { x: 0, y: 0 },
    currentSnapLines: { x: null, y: null },
    selectedIntervals: {
        int1: new Set(),
        int2: new Set(),
        int3: new Set()
    },
    currentColor: '#5d4037'
};

// Constants
const INTERVALS = [
    "Uni", "m2", "M2", "m3", "M3",
    "P4", "Trit", "P5", "m6", "M6",
    "m7", "M7"
];

const COLORS = [
    { name: 'Brown', value: '#5d4037' },
    { name: 'Black', value: '#1f2937' },
    { name: 'Blue', value: '#1d4ed8' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Orange', value: '#ea580c' }
];

const toolDefaults = {
    line: { width: 8 },
    dotted: { width: 8, segments: 4 },
    dot: { width: 30 }
};

// DOM References
let canvas, ctx, container;
let masterLock, selectionPanel, handlesLayer, snapLayer, marquee, libraryList, emptyLibrary, libCountDisplay;

// Cached wood grain pattern
let woodGrainPattern = null;

// ============================================
// INITIALIZATION
// ============================================
function init() {
    canvas = document.getElementById('woodCanvas');
    ctx = canvas.getContext('2d');
    container = document.getElementById('canvas-container');
    masterLock = document.getElementById('masterLock');
    selectionPanel = document.getElementById('selection-panel');
    handlesLayer = document.getElementById('handles-layer');
    snapLayer = document.getElementById('snap-points-layer');
    marquee = document.getElementById('marquee');
    libraryList = document.getElementById('library-list');
    emptyLibrary = document.getElementById('empty-library');
    libCountDisplay = document.getElementById('library-count');

    // Create Interval Choice Boxes
    ['int1', 'int2', 'int3'].forEach(id => {
        const grid = document.getElementById(`grid-${id}`);
        if (grid) {
            INTERVALS.forEach(intName => {
                const box = document.createElement('div');
                box.className = 'int-box';
                box.innerText = intName;
                box.onclick = () => toggleInterval(id, intName, box);
                grid.appendChild(box);
            });
        }
    });

    // Create Color Picker
    createColorPicker();

    // Load from localStorage
    loadFromStorage();

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Enhanced keyboard shortcuts
    window.addEventListener('keydown', handleKeyboard);

    createSnapMarkers();
    updateUI();
    draw();
}

// ============================================
// LOCAL STORAGE PERSISTENCE
// ============================================
function saveToStorage() {
    try {
        const data = {
            library: state.savedLibrary,
            elements: state.elements,
            intervals: {
                int1: Array.from(state.selectedIntervals.int1),
                int2: Array.from(state.selectedIntervals.int2),
                int3: Array.from(state.selectedIntervals.int3)
            }
        };
        localStorage.setItem('bebopPuzzleMaker', JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save to localStorage:', e);
    }
}

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem('bebopPuzzleMaker'));
        if (data) {
            if (data.library) state.savedLibrary = data.library;
            if (data.elements) state.elements = data.elements;
            if (data.intervals) {
                ['int1', 'int2', 'int3'].forEach(id => {
                    const arr = data.intervals[id] || [];
                    arr.forEach(intName => {
                        state.selectedIntervals[id].add(intName);
                        const boxes = document.querySelectorAll(`#grid-${id} .int-box`);
                        boxes.forEach(b => {
                            if (b.innerText === intName) b.classList.add('selected');
                        });
                    });
                });
                updateIntervalCounts();
            }
            renderLibrary();
        }
    } catch (e) {
        console.warn('Failed to load from localStorage:', e);
    }
}

function exportLibraryJSON() {
    const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        library: state.savedLibrary
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'bebop-library.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
}

function importLibraryJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.library && Array.isArray(data.library)) {
                    state.savedLibrary = [...state.savedLibrary, ...data.library];
                    renderLibrary();
                    saveToStorage();
                    showToast(`Imported ${data.library.length} pieces`);
                }
            } catch (err) {
                showToast('Failed to import: invalid JSON');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
function handleKeyboard(e) {
    const isInput = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT';
    
    // Undo: Cmd/Ctrl+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
    }
    
    // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
    }
    
    if (isInput) return;
    
    // Delete/Backspace: Delete selected
    if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
        return;
    }
    
    // Cmd/Ctrl+A: Select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
        return;
    }
    
    // Cmd/Ctrl+D: Duplicate
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
    }
    
    // Cmd/Ctrl+C: Copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copySelected();
        return;
    }
    
    // Cmd/Ctrl+V: Paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        paste();
        return;
    }
    
    // Cmd/Ctrl+S: Save to library
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToLibrary();
        return;
    }
    
    // Tool switching: 1-4
    if (e.key === '1') { setActiveTool('select'); return; }
    if (e.key === '2') { setActiveTool('line'); return; }
    if (e.key === '3') { setActiveTool('dotted'); return; }
    if (e.key === '4') { setActiveTool('dot'); return; }
    
    // Arrow keys: Nudge selected elements
    const nudgeAmount = e.shiftKey ? 0.05 : 0.01;
    if (e.key === 'ArrowLeft') { e.preventDefault(); nudgeSelected(-nudgeAmount, 0); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); nudgeSelected(nudgeAmount, 0); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); nudgeSelected(0, -nudgeAmount); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); nudgeSelected(0, nudgeAmount); return; }
    
    // [ and ]: Layer ordering
    if (e.key === '[') { sendBackward(); return; }
    if (e.key === ']') { bringForward(); return; }
}

// ============================================
// UNDO / REDO
// ============================================
function saveState() {
    state.history.push(JSON.stringify(state.elements));
    if (state.history.length > 50) state.history.shift();
    state.redoStack = []; // Clear redo stack on new action
}

function undo() {
    if (state.history.length === 0) return;
    state.redoStack.push(JSON.stringify(state.elements));
    state.elements = JSON.parse(state.history.pop());
    state.selectedIndices = [];
    updateUI();
    draw();
    saveToStorage();
}

function redo() {
    if (state.redoStack.length === 0) return;
    state.history.push(JSON.stringify(state.elements));
    state.elements = JSON.parse(state.redoStack.pop());
    state.selectedIndices = [];
    updateUI();
    draw();
    saveToStorage();
}

// ============================================
// COPY / PASTE / DUPLICATE
// ============================================
function copySelected() {
    if (state.selectedIndices.length === 0) return;
    state.clipboard = state.selectedIndices.map(i => JSON.parse(JSON.stringify(state.elements[i])));
    showToast(`Copied ${state.clipboard.length} element(s)`);
}

function paste() {
    if (state.clipboard.length === 0) return;
    saveState();
    const offset = 0.05;
    const newIndices = [];
    state.clipboard.forEach(el => {
        const newEl = JSON.parse(JSON.stringify(el));
        newEl.p1.x = Math.min(1, newEl.p1.x + offset);
        newEl.p1.y = Math.min(1, newEl.p1.y + offset);
        if (newEl.p2) {
            newEl.p2.x = Math.min(1, newEl.p2.x + offset);
            newEl.p2.y = Math.min(1, newEl.p2.y + offset);
        }
        state.elements.push(newEl);
        newIndices.push(state.elements.length - 1);
    });
    state.selectedIndices = newIndices;
    updateUI();
    draw();
    saveToStorage();
    showToast(`Pasted ${newIndices.length} element(s)`);
}

function duplicateSelected() {
    if (state.selectedIndices.length === 0) return;
    copySelected();
    paste();
}

// ============================================
// SELECTION
// ============================================
function selectAll() {
    state.selectedIndices = state.elements.map((_, i) => i);
    updateUI();
    draw();
}

function nudgeSelected(dx, dy) {
    if (state.selectedIndices.length === 0) return;
    saveState();
    state.selectedIndices.forEach(i => {
        const el = state.elements[i];
        el.p1.x = Math.max(0, Math.min(1, el.p1.x + dx));
        el.p1.y = Math.max(0, Math.min(1, el.p1.y + dy));
        if (el.p2) {
            el.p2.x = Math.max(0, Math.min(1, el.p2.x + dx));
            el.p2.y = Math.max(0, Math.min(1, el.p2.y + dy));
        }
    });
    updateUI();
    draw();
    saveToStorage();
}

// ============================================
// ELEMENT LAYERING
// ============================================
function bringForward() {
    if (state.selectedIndices.length !== 1) return;
    const idx = state.selectedIndices[0];
    if (idx >= state.elements.length - 1) return;
    saveState();
    [state.elements[idx], state.elements[idx + 1]] = [state.elements[idx + 1], state.elements[idx]];
    state.selectedIndices = [idx + 1];
    draw();
    saveToStorage();
}

function sendBackward() {
    if (state.selectedIndices.length !== 1) return;
    const idx = state.selectedIndices[0];
    if (idx <= 0) return;
    saveState();
    [state.elements[idx], state.elements[idx - 1]] = [state.elements[idx - 1], state.elements[idx]];
    state.selectedIndices = [idx - 1];
    draw();
    saveToStorage();
}

function bringToFront() {
    if (state.selectedIndices.length !== 1) return;
    const idx = state.selectedIndices[0];
    if (idx >= state.elements.length - 1) return;
    saveState();
    const el = state.elements.splice(idx, 1)[0];
    state.elements.push(el);
    state.selectedIndices = [state.elements.length - 1];
    draw();
    saveToStorage();
}

function sendToBack() {
    if (state.selectedIndices.length !== 1) return;
    const idx = state.selectedIndices[0];
    if (idx <= 0) return;
    saveState();
    const el = state.elements.splice(idx, 1)[0];
    state.elements.unshift(el);
    state.selectedIndices = [0];
    draw();
    saveToStorage();
}

// ============================================
// COLOR PICKER
// ============================================
function createColorPicker() {
    const colorContainer = document.getElementById('color-picker');
    if (!colorContainer) return;
    
    COLORS.forEach(color => {
        const div = document.createElement('div');
        div.className = 'color-option' + (color.value === state.currentColor ? ' selected' : '');
        div.style.backgroundColor = color.value;
        div.title = color.name;
        div.onclick = () => selectColor(color.value, div);
        colorContainer.appendChild(div);
    });
}

function selectColor(colorValue, element) {
    state.currentColor = colorValue;
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    
    // Apply to selected elements
    if (state.selectedIndices.length > 0) {
        saveState();
        state.selectedIndices.forEach(i => {
            state.elements[i].color = colorValue;
        });
        draw();
        saveToStorage();
    }
}

// ============================================
// INTERVALS
// ============================================
function toggleInterval(stepId, intervalName, element) {
    if (state.selectedIntervals[stepId].has(intervalName)) {
        state.selectedIntervals[stepId].delete(intervalName);
        element.classList.remove('selected');
    } else {
        state.selectedIntervals[stepId].add(intervalName);
        element.classList.add('selected');
    }
    updateIntervalCounts();
    saveToStorage();
}

function updateIntervalCounts() {
    ['int1', 'int2', 'int3'].forEach(id => {
        const countDisplay = document.getElementById(`count-${id}`);
        if (countDisplay) {
            const count = state.selectedIntervals[id].size;
            countDisplay.innerText = `${count} selected`;
        }
    });
}

function clearIntervalSelections() {
    ['int1', 'int2', 'int3'].forEach(id => {
        state.selectedIntervals[id].clear();
        const boxes = document.querySelectorAll(`#grid-${id} .int-box`);
        boxes.forEach(b => b.classList.remove('selected'));
    });
    updateIntervalCounts();
}

// ============================================
// LIBRARY MANAGEMENT
// ============================================
function saveToLibrary() {
    if (state.elements.length === 0) {
        showToast('Nothing to save');
        return;
    }

    const name = document.getElementById('piece-name').value.trim() || "Untitled Chunk";
    const label = document.getElementById('piece-label').value.trim() || "";
    
    // Check for duplicate
    const existingIndex = state.savedLibrary.findIndex(p => p.name === name && p.label === label);
    
    if (existingIndex !== -1) {
        showDuplicateDialog(name, label, existingIndex);
    } else {
        doSaveToLibrary(name, label);
    }
}

function showDuplicateDialog(name, label, existingIndex) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.id = 'duplicate-modal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 class="text-lg font-black text-gray-800 uppercase mb-2">Duplicate Found</h3>
            <p class="text-sm text-gray-600 mb-4">A piece named "<strong>${name}</strong>" with label "<strong>${label || 'none'}</strong>" already exists.</p>
            <div class="space-y-3">
                <button onclick="doOverwrite(${existingIndex})" class="w-full py-3 px-4 bg-orange-500 text-white rounded-xl font-bold text-sm uppercase hover:bg-orange-600 transition">
                    Overwrite Existing
                </button>
                <button onclick="doSaveAsNew()" class="w-full py-3 px-4 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm uppercase hover:bg-gray-50 transition">
                    Save as New Copy
                </button>
                <button onclick="closeDuplicateDialog()" class="w-full py-2 text-gray-400 text-sm font-bold uppercase hover:text-gray-600 transition">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeDuplicateDialog() {
    const modal = document.getElementById('duplicate-modal');
    if (modal) modal.remove();
}

function doOverwrite(existingIndex) {
    closeDuplicateDialog();
    const name = document.getElementById('piece-name').value.trim() || "Untitled Chunk";
    const label = document.getElementById('piece-label').value.trim() || "";
    
    // Remove existing
    state.savedLibrary.splice(existingIndex, 1);
    
    // Save new
    doSaveToLibrary(name, label);
    showToast('Piece overwritten!');
}

function doSaveAsNew() {
    closeDuplicateDialog();
    const name = document.getElementById('piece-name').value.trim() || "Untitled Chunk";
    const label = document.getElementById('piece-label').value.trim() || "";
    
    // Find a unique name by adding a number
    let newName = name;
    let counter = 2;
    while (state.savedLibrary.some(p => p.name === newName && p.label === label)) {
        newName = `${name} (${counter})`;
        counter++;
    }
    
    document.getElementById('piece-name').value = newName;
    doSaveToLibrary(newName, label);
}

function doSaveToLibrary(name, label) {
    const allowInversions = document.getElementById('allow-inversions')?.checked || false;

    // Clear selection before capturing thumbnail to avoid glow
    const oldSelection = [...state.selectedIndices];
    state.selectedIndices = [];
    updateUI();
    draw();

    const piece = {
        id: Date.now(),
        name,
        label,
        allowInversions,
        intervals: {
            int1: Array.from(state.selectedIntervals.int1),
            int2: Array.from(state.selectedIntervals.int2),
            int3: Array.from(state.selectedIntervals.int3)
        },
        elements: JSON.parse(JSON.stringify(state.elements)),
        thumbnail: canvas.toDataURL('image/png', 0.5)
    };

    // Restore selection
    state.selectedIndices = oldSelection;
    updateUI();
    draw();

    state.savedLibrary.unshift(piece);
    renderLibrary();
    saveToStorage();
    showToast('Saved to library!');
}

function renderLibrary() {
    if (!libraryList) return;
    libraryList.innerHTML = '';
    if (state.savedLibrary.length === 0) {
        if (emptyLibrary) libraryList.appendChild(emptyLibrary);
        if (libCountDisplay) libCountDisplay.innerText = "0 Pieces";
        return;
    }

    if (libCountDisplay) libCountDisplay.innerText = `${state.savedLibrary.length} Pieces`;
    state.savedLibrary.forEach((piece, index) => {
        const div = document.createElement('div');
        div.className = "library-item bg-white border border-gray-200 rounded-xl p-3 flex gap-3 items-center group cursor-pointer hover:border-blue-400 transition-all shadow-sm active:scale-[0.98]";
        div.onclick = () => loadPiece(index);

        const i1 = piece.intervals.int1.length > 0 ? piece.intervals.int1[0] + (piece.intervals.int1.length > 1 ? '..' : '') : '-';
        const i2 = piece.intervals.int2.length > 0 ? piece.intervals.int2[0] + (piece.intervals.int2.length > 1 ? '..' : '') : '-';
        const i3 = piece.intervals.int3.length > 0 ? piece.intervals.int3[0] + (piece.intervals.int3.length > 1 ? '..' : '') : '-';

        const invBadge = piece.allowInversions ? '<span class="text-[7px] bg-purple-100 text-purple-600 px-1 rounded font-bold">INV</span>' : '';
        
        // Color-code label based on text
        let labelColor = 'text-blue-500';
        if (piece.label === 'Ascending') labelColor = 'text-green-600';
        else if (piece.label === 'Descending') labelColor = 'text-red-600';
        else if (piece.label === 'From Above') labelColor = 'text-purple-600';
        else if (piece.label === 'From Below') labelColor = 'text-amber-600';
        
        div.innerHTML = `
            <div class="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                <img src="${piece.thumbnail}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-bold text-gray-800 text-xs truncate uppercase flex items-center gap-1">${piece.name} ${invBadge}</h3>
                <p class="text-[9px] ${labelColor} font-bold uppercase truncate">${piece.label}</p>
                <p class="text-[8px] text-gray-400 mt-1 truncate font-medium italic">${i1} / ${i2} / ${i3}</p>
            </div>
            <button class="delete-item opacity-0 transition text-gray-300 hover:text-red-400 p-1" onclick="event.stopPropagation(); removeLibraryItem(${index})">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        `;
        libraryList.appendChild(div);
    });
}

function loadPiece(index) {
    saveState();
    const piece = state.savedLibrary[index];
    state.elements = JSON.parse(JSON.stringify(piece.elements));
    state.selectedIndices = [];

    document.getElementById('piece-name').value = piece.name;
    document.getElementById('piece-label').value = piece.label;
    const invCheckbox = document.getElementById('allow-inversions');
    if (invCheckbox) invCheckbox.checked = piece.allowInversions || false;

    clearIntervalSelections();
    ['int1', 'int2', 'int3'].forEach(id => {
        const savedArr = piece.intervals[id] || [];
        savedArr.forEach(intName => {
            state.selectedIntervals[id].add(intName);
            const boxes = document.querySelectorAll(`#grid-${id} .int-box`);
            boxes.forEach(b => {
                if (b.innerText === intName) b.classList.add('selected');
            });
        });
    });

    updateIntervalCounts();
    updateUI();
    draw();
    saveToStorage();
}

function removeLibraryItem(index) {
    state.savedLibrary.splice(index, 1);
    renderLibrary();
    saveToStorage();
}

// ============================================
// CANVAS RESIZE & SETUP
// ============================================
function resize() {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    state.canvasSize = rect.width;
    canvas.width = state.canvasSize;
    canvas.height = state.canvasSize;
    woodGrainPattern = null; // Invalidate cached pattern
    draw();
}

function createSnapMarkers() {
    if (!snapLayer) return;
    snapLayer.innerHTML = '';
    const points = [
        { x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 1, y: 0 },
        { x: 0, y: 0.5 }, { x: 1, y: 0.5 },
        { x: 0, y: 1 }, { x: 0.5, y: 1 }, { x: 1, y: 1 }
    ];
    points.forEach(p => {
        const div = document.createElement('div');
        div.className = 'snap-marker';
        div.style.left = `${p.x * 100}%`;
        div.style.top = `${p.y * 100}%`;
        snapLayer.appendChild(div);
    });
}

// ============================================
// TOOLS
// ============================================
function setActiveTool(tool) {
    state.activeTool = tool;
    state.selectedIndices = [];
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.toggle('active', btn.id === `tool-${tool}`));
    updateUI();
    draw();
}

// ============================================
// POINTER EVENTS
// ============================================
function handlePointerDown(e) {
    if (e.target !== canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / state.canvasSize;
    const mouseY = (e.clientY - rect.top) / state.canvasSize;

    if (state.activeTool === 'select') {
        const found = findElementAt(mouseX, mouseY);
        if (found !== -1) {
            if (!e.shiftKey) state.selectedIndices = [found];
            else {
                const idx = state.selectedIndices.indexOf(found);
                if (idx === -1) state.selectedIndices.push(found);
                else state.selectedIndices.splice(idx, 1);
            }
        } else {
            state.isMarquee = true;
            state.marqueeStart = { x: e.clientX, y: e.clientY };
            if (marquee) {
                marquee.style.display = 'block';
                marquee.style.left = `${e.clientX - rect.left}px`;
                marquee.style.top = `${e.clientY - rect.top}px`;
                marquee.style.width = '0px';
                marquee.style.height = '0px';
            }
            if (!e.shiftKey) state.selectedIndices = [];
        }
        updateUI();
        draw();
        return;
    }

    saveState();
    state.isDrawing = true;
    const startPoint = snapPoint({ x: mouseX, y: mouseY });
    const config = toolDefaults[state.activeTool === 'line' ? 'line' : state.activeTool === 'dotted' ? 'dotted' : 'dot'];
    const newEl = {
        type: state.activeTool,
        p1: { ...startPoint },
        p2: { ...startPoint },
        width: config.width,
        segments: config.segments || 4,
        color: state.currentColor
    };
    state.elements.push(newEl);
    state.selectedIndices = [state.elements.length - 1];
    updateUI();
    draw();
}

function handlePointerMove(e) {
    if (!container) return;
    const rect = canvas.getBoundingClientRect();
    if (state.isDrawing) {
        let x = Math.max(0, Math.min(1, (e.clientX - rect.left) / state.canvasSize));
        let y = Math.max(0, Math.min(1, (e.clientY - rect.top) / state.canvasSize));
        const el = state.elements[state.selectedIndices[0]];
        const snapped = snapPoint({ x, y }, state.selectedIndices[0]);
        if (el.type === 'dot') el.p1 = snapped;
        else el.p2 = snapped;
        draw();
    } else if (state.isMarquee && marquee) {
        const curX = e.clientX;
        const curY = e.clientY;
        const left = Math.min(state.marqueeStart.x, curX);
        const top = Math.min(state.marqueeStart.y, curY);
        const width = Math.abs(state.marqueeStart.x - curX);
        const height = Math.abs(state.marqueeStart.y - curY);
        marquee.style.left = `${left - rect.left}px`;
        marquee.style.top = `${top - rect.top}px`;
        marquee.style.width = `${width}px`;
        marquee.style.height = `${height}px`;
    }
}

function handlePointerUp(e) {
    if (state.isDrawing) {
        state.isDrawing = false;
        state.currentSnapLines = { x: null, y: null };
        updateUI();
        draw();
        saveToStorage();
    } else if (state.isMarquee) {
        if (marquee) {
            const x1 = parseInt(marquee.style.left) / state.canvasSize;
            const y1 = parseInt(marquee.style.top) / state.canvasSize;
            const x2 = x1 + parseInt(marquee.style.width) / state.canvasSize;
            const y2 = y1 + parseInt(marquee.style.height) / state.canvasSize;

            state.elements.forEach((el, i) => {
                if (isInside(el, x1, y1, x2, y2)) {
                    if (!state.selectedIndices.includes(i)) state.selectedIndices.push(i);
                }
            });

            marquee.style.display = 'none';
        }
        state.isMarquee = false;
        updateUI();
        draw();
    }
}

function isInside(el, x1, y1, x2, y2) {
    const check = (pt) => pt.x >= x1 && pt.x <= x2 && pt.y >= y1 && pt.y <= y2;
    if (el.type === 'dot') return check(el.p1);
    return check(el.p1) || check(el.p2);
}

function findElementAt(x, y) {
    let found = -1;
    for (let i = state.elements.length - 1; i >= 0; i--) {
        const el = state.elements[i];
        const threshold = el.type === 'dot' ? Math.max(0.06, (el.width / state.canvasSize) * 0.5 + 0.01) : 0.04;
        if (el.type === 'dot') {
            if (Math.hypot(x - el.p1.x, y - el.p1.y) < threshold) { found = i; break; }
        } else {
            if (Math.hypot(x - el.p1.x, y - el.p1.y) < 0.05 || Math.hypot(x - el.p2.x, y - el.p2.y) < 0.05) { found = i; break; }
            if (distToSegment({ x, y }, el.p1, el.p2) < 0.03) { found = i; break; }
        }
    }
    return found;
}

function distToSegment(p, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

// ============================================
// ELEMENT OPERATIONS
// ============================================
function deleteSelected() {
    if (state.selectedIndices.length === 0) return;
    saveState();
    state.selectedIndices.sort((a, b) => b - a).forEach(i => state.elements.splice(i, 1));
    state.selectedIndices = [];
    updateUI();
    draw();
    saveToStorage();
}

function clearAll() {
    if (state.elements.length === 0) return;
    showConfirm('Clear all elements from canvas?', () => {
        saveState();
        state.elements = [];
        state.selectedIndices = [];
        updateUI();
        draw();
        saveToStorage();
    });
}

function newCanvas() {
    const doNewCanvas = () => {
        saveState();
        state.elements = [];
        state.selectedIndices = [];
        state.selectedIntervals.int1.clear();
        state.selectedIntervals.int2.clear();
        state.selectedIntervals.int3.clear();
        
        // Clear form fields
        document.getElementById('piece-name').value = '';
        document.getElementById('piece-label').value = '';
        const invCheckbox = document.getElementById('allow-inversions');
        if (invCheckbox) invCheckbox.checked = false;
        
        // Clear interval UI
        document.querySelectorAll('.int-box').forEach(b => b.classList.remove('selected'));
        updateIntervalCounts();
        updateUI();
        draw();
        saveToStorage();
        showToast('New canvas ready');
    };
    
    if (state.elements.length > 0) {
        showConfirm('Start a new canvas? Current work will be cleared.', doNewCanvas);
    } else {
        doNewCanvas();
    }
}

function updateProperty(prop, val) {
    const v = parseInt(val);
    if (state.selectedIndices.length > 0) {
        state.selectedIndices.forEach(i => state.elements[i][prop] = v);
    } else {
        if (state.activeTool === 'line') toolDefaults.line[prop] = v;
        if (state.activeTool === 'dotted') toolDefaults.dotted[prop] = v;
        if (state.activeTool === 'dot') toolDefaults.dot[prop] = v;
    }
    const segText = document.getElementById('segValue');
    const widText = document.getElementById('widthValue');
    if (prop === 'segments' && segText) segText.innerText = v;
    if (prop === 'width' && widText) widText.innerText = v;
    draw();
    saveToStorage();
}

function flipAction(axis) {
    if (state.elements.length === 0) return;
    saveState();
    const targets = state.selectedIndices.length > 0 ? state.selectedIndices : Array.from(state.elements.keys());
    for (let i of targets) {
        const el = state.elements[i];
        if (axis === 'h') {
            el.p1.x = 1 - el.p1.x;
            if (el.type !== 'dot') el.p2.x = 1 - el.p2.x;
        } else {
            el.p1.y = 1 - el.p1.y;
            if (el.type !== 'dot') el.p2.y = 1 - el.p2.y;
        }
    }
    if (container) {
        const animClass = axis === 'h' ? 'animate-flip-h' : 'animate-flip-v';
        container.classList.remove('animate-flip-h', 'animate-flip-v');
        void container.offsetWidth;
        container.classList.add(animClass);
        setTimeout(() => container.classList.remove(animClass), 400);
    }
    draw();
    saveToStorage();
}

function snapPoint(pt, excludeIndex = -1) {
    state.currentSnapLines = { x: null, y: null };
    if (!masterLock || !masterLock.checked) return pt;
    const targets = [0, 0.25, 0.5, 0.75, 1.0];
    let bestX = pt.x, bestY = pt.y, minDistX = 0.03, minDistY = 0.03;
    targets.forEach(val => {
        const dx = Math.abs(pt.x - val);
        if (dx < minDistX) { minDistX = dx; bestX = val; state.currentSnapLines.x = val; }
        const dy = Math.abs(pt.y - val);
        if (dy < minDistY) { minDistY = dy; bestY = val; state.currentSnapLines.y = val; }
    });
    state.elements.forEach((el, idx) => {
        if (idx === excludeIndex) return;
        const pts = el.type === 'dot' ? [el.p1] : [el.p1, el.p2];
        pts.forEach(p => {
            const dist = Math.hypot(pt.x - p.x, pt.y - p.y);
            if (dist < 0.035) {
                bestX = p.x; bestY = p.y;
                state.currentSnapLines.x = p.x; state.currentSnapLines.y = p.y;
            }
        });
    });
    return { x: bestX, y: bestY };
}

// ============================================
// UI UPDATE
// ============================================
function updateUI() {
    if (!handlesLayer) return;
    handlesLayer.innerHTML = '';

    const panelTitle = document.getElementById('panel-title');
    const segControl = document.getElementById('segment-control');
    const widthControl = document.getElementById('width-control');
    const widthLabel = document.getElementById('width-label');
    const deleteBtn = document.getElementById('delete-btn');
    const flipLabel = document.getElementById('flip-label');
    const flipHint = document.getElementById('flip-hint');
    const layerControls = document.getElementById('layer-controls');
    const noSelectionHint = document.getElementById('no-selection-hint');

    let type, width, segments;

    if (state.selectedIndices.length > 0) {
        const el = state.elements[state.selectedIndices[0]];
        type = el.type;
        width = el.width;
        segments = el.segments;
        if (deleteBtn) deleteBtn.classList.remove('hidden');
        if (panelTitle) panelTitle.innerText = state.selectedIndices.length > 1 ? `Selected (${state.selectedIndices.length})` : "Musical Element Config";
        if (flipLabel) flipLabel.innerText = "Flip Selection";
        if (flipHint) flipHint.innerText = `Flipping ${state.selectedIndices.length} item(s)`;
        if (layerControls) layerControls.classList.remove('hidden');
        if (noSelectionHint) noSelectionHint.classList.add('hidden');
        if (widthControl) widthControl.classList.remove('hidden');
    } else {
        type = state.activeTool === 'select' ? 'line' : state.activeTool;
        const config = toolDefaults[type === 'line' ? 'line' : type === 'dotted' ? 'dotted' : 'dot'];
        width = config.width;
        segments = config.segments || 4;
        if (deleteBtn) deleteBtn.classList.add('hidden');
        if (panelTitle) panelTitle.innerText = state.activeTool === 'select' ? "Puzzle Metadata" : "New " + type.toUpperCase();
        if (flipLabel) flipLabel.innerText = "Flip Everything";
        if (flipHint) flipHint.innerText = "No selection: affects all items";
        if (layerControls) layerControls.classList.add('hidden');
        if (noSelectionHint) noSelectionHint.classList.remove('hidden');
        if (widthControl) widthControl.classList.add('hidden');
    }

    const isDot = type === 'dot';
    const isDashed = type === 'dotted';

    const segInput = document.getElementById('segments');
    const segText = document.getElementById('segValue');
    const widInput = document.getElementById('pathWidth');
    const widText = document.getElementById('widthValue');

    if (segInput) segInput.value = segments;
    if (segText) segText.innerText = segments;
    if (widInput) widInput.value = width;
    if (widText) widText.innerText = width;

    // Show segment control only for dashed lines when selected
    if (segControl) {
        if (state.selectedIndices.length > 0 && isDashed) {
            segControl.classList.remove('hidden');
        } else {
            segControl.classList.add('hidden');
        }
    }

    if (isDot) {
        if (widthLabel) widthLabel.innerText = "Dot Size";
        if (widInput) { widInput.min = "15"; widInput.max = "120"; }
    } else {
        if (widthLabel) widthLabel.innerText = "Thickness";
        if (widInput) { widInput.min = "2"; widInput.max = "40"; }
    }

    if (state.activeTool === 'select' && state.selectedIndices.length === 1) {
        const el = state.elements[state.selectedIndices[0]];
        createHandle(el.p1, 'p1');
        if (el.type !== 'dot') createHandle(el.p2, 'p2');
    }
}

function createHandle(pointObj, key) {
    const h = document.createElement('div');
    h.className = 'handle';
    h.style.left = `${pointObj.x * 100}%`;
    h.style.top = `${pointObj.y * 100}%`;
    h.onpointerdown = (e) => {
        e.stopPropagation();
        saveState();
        h.setPointerCapture(e.pointerId);
        h.classList.add('active');
        const onMove = (em) => {
            const rect = container.getBoundingClientRect();
            let x = Math.max(0, Math.min(1, (em.clientX - rect.left) / state.canvasSize));
            let y = Math.max(0, Math.min(1, (em.clientY - rect.top) / state.canvasSize));
            const snapped = snapPoint({ x, y }, state.selectedIndices[0]);
            pointObj.x = snapped.x;
            pointObj.y = snapped.y;
            h.style.left = `${pointObj.x * 100}%`;
            h.style.top = `${pointObj.y * 100}%`;
            draw();
        };
        const onUp = () => {
            h.classList.remove('active');
            state.currentSnapLines = { x: null, y: null };
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            updateUI();
            draw();
            saveToStorage();
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };
    handlesLayer.appendChild(h);
}

// ============================================
// DRAWING
// ============================================
function createWoodGrainPattern() {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = canvas.width;
    patternCanvas.height = canvas.height;
    const pctx = patternCanvas.getContext('2d');
    
    pctx.fillStyle = '#e3c191';
    pctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
    
    pctx.globalAlpha = 0.35;
    for (let i = 0; i < patternCanvas.width; i += 4) {
        pctx.beginPath();
        pctx.lineWidth = 1;
        pctx.strokeStyle = i % 12 === 0 ? '#b98d5c' : '#d4a373';
        pctx.moveTo(i, 0);
        pctx.lineTo(i + (Math.random() * 2 - 1), patternCanvas.height);
        pctx.stroke();
    }
    
    return patternCanvas;
}

function draw() {
    if (!ctx) return;
    
    // Draw cached wood grain pattern
    if (!woodGrainPattern) {
        woodGrainPattern = createWoodGrainPattern();
    }
    ctx.drawImage(woodGrainPattern, 0, 0);

    // Draw snap lines
    if (state.currentSnapLines.x !== null || state.currentSnapLines.y !== null) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.lineWidth = 1;
        if (state.currentSnapLines.x !== null) {
            ctx.beginPath();
            ctx.moveTo(state.currentSnapLines.x * canvas.width, 0);
            ctx.lineTo(state.currentSnapLines.x * canvas.width, canvas.height);
            ctx.stroke();
        }
        if (state.currentSnapLines.y !== null) {
            ctx.beginPath();
            ctx.moveTo(0, state.currentSnapLines.y * canvas.height);
            ctx.lineTo(canvas.width, state.currentSnapLines.y * canvas.height);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Draw border shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    // Draw elements
    state.elements.forEach((el, idx) => {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const color = el.color || '#5d4037';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = el.width;

        if (state.selectedIndices.includes(idx)) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'rgba(37, 99, 235, 0.8)';
        }

        const x1 = el.p1.x * canvas.width, y1 = el.p1.y * canvas.height;
        const x2 = el.p2?.x * canvas.width, y2 = el.p2?.y * canvas.height;

        if (el.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        } else if (el.type === 'dotted') {
            const totalLen = Math.hypot(x2 - x1, y2 - y1);
            if (totalLen > 0) {
                const unit = totalLen / (2 * el.segments - 1);
                ctx.setLineDash([unit, unit]);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        } else if (el.type === 'dot') {
            ctx.beginPath();
            ctx.arc(x1, y1, el.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });
}

// ============================================
// EXPORT
// ============================================
function getExportFilename(name, label) {
    const parts = [name || 'untitled'];
    if (label) parts.push(label);
    return parts.join('_').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

function showExportDialog(format) {
    const hasLibrary = state.savedLibrary.length > 0;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.id = 'export-modal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 class="text-lg font-black text-gray-800 uppercase mb-4">Export ${format.toUpperCase()}</h3>
            <div class="space-y-3">
                <button onclick="doExport('${format}', 'current')" class="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm uppercase hover:bg-blue-700 transition">
                    Current Piece
                </button>
                <button onclick="doExport('${format}', 'library')" class="w-full py-3 px-4 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm uppercase hover:bg-gray-50 transition ${hasLibrary ? '' : 'opacity-50 cursor-not-allowed'}" ${hasLibrary ? '' : 'disabled'}>
                    All Library Pieces (${state.savedLibrary.length})
                </button>
                <button onclick="closeExportDialog()" class="w-full py-2 text-gray-400 text-sm font-bold uppercase hover:text-gray-600 transition">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) closeExportDialog(); };
}

function closeExportDialog() {
    const modal = document.getElementById('export-modal');
    if (modal) modal.remove();
}

function doExport(format, scope) {
    closeExportDialog();
    
    if (scope === 'current') {
        const name = document.getElementById('piece-name').value.trim() || 'bebop-puzzle';
        const label = document.getElementById('piece-label').value.trim();
        const filename = getExportFilename(name, label);
        
        if (format === 'png') {
            exportCurrentPNG(filename);
        } else {
            exportCurrentSVG(filename);
        }
    } else {
        exportAllLibrary(format);
    }
}

function exportCurrentPNG(filename) {
    const oldIdx = [...state.selectedIndices];
    state.selectedIndices = [];
    updateUI();
    draw();
    setTimeout(() => {
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL();
        link.click();
        state.selectedIndices = oldIdx;
        updateUI();
        draw();
    }, 50);
}

function exportCurrentSVG(filename) {
    const oldIdx = [...state.selectedIndices];
    state.selectedIndices = [];
    
    const svg = generateSVG(state.elements);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `${filename}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    
    state.selectedIndices = oldIdx;
    updateUI();
    draw();
}

function generateSVG(elements) {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`;
    svg += `<rect width="100%" height="100%" fill="#e3c191"/>`;
    
    elements.forEach(el => {
        const color = el.color || '#5d4037';
        const x1 = el.p1.x * canvas.width, y1 = el.p1.y * canvas.height;
        const x2 = el.p2?.x * canvas.width, y2 = el.p2?.y * canvas.height;
        
        if (el.type === 'line') {
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${el.width}" stroke-linecap="round"/>`;
        } else if (el.type === 'dotted') {
            const totalLen = Math.hypot(x2 - x1, y2 - y1);
            if (totalLen > 0) {
                const unit = totalLen / (2 * el.segments - 1);
                svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${el.width}" stroke-linecap="round" stroke-dasharray="${unit} ${unit}"/>`;
            }
        } else if (el.type === 'dot') {
            svg += `<circle cx="${x1}" cy="${y1}" r="${el.width / 2}" fill="${color}"/>`;
        }
    });
    
    svg += '</svg>';
    return svg;
}

async function exportAllLibrary(format) {
    if (state.savedLibrary.length === 0) {
        showToast('Library is empty');
        return;
    }
    
    showToast(`Creating zip with ${state.savedLibrary.length} pieces...`);
    
    const zip = new JSZip();
    
    for (let i = 0; i < state.savedLibrary.length; i++) {
        const piece = state.savedLibrary[i];
        const filename = getExportFilename(piece.name, piece.label);
        
        if (format === 'png') {
            // Convert base64 data URL to binary
            const base64Data = piece.thumbnail.split(',')[1];
            zip.file(`${filename}.png`, base64Data, { base64: true });
        } else {
            // SVG as text
            const svg = generateSVG(piece.elements);
            zip.file(`${filename}.svg`, svg);
        }
    }
    
    // Generate and download zip
    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = `bebop-library-${format}.zip`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    
    showToast(`Exported ${state.savedLibrary.length} pieces as zip!`);
}

function downloadImage() {
    showExportDialog('png');
}

function downloadSVG() {
    showExportDialog('svg');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-50';
    toast.innerText = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ============================================
// STYLED CONFIRM DIALOG
// ============================================
function showConfirm(message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.id = 'confirm-modal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 class="text-lg font-black text-gray-800 uppercase mb-3">Confirm</h3>
            <p class="text-sm text-gray-600 mb-5">${message}</p>
            <div class="flex gap-3">
                <button id="confirm-cancel" class="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm uppercase hover:bg-gray-50 transition">
                    Cancel
                </button>
                <button id="confirm-ok" class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm uppercase hover:bg-blue-700 transition">
                    Confirm
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#confirm-ok').onclick = () => {
        modal.remove();
        if (onConfirm) onConfirm();
    };
    
    modal.querySelector('#confirm-cancel').onclick = () => {
        modal.remove();
        if (onCancel) onCancel();
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
            if (onCancel) onCancel();
        }
    };
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
