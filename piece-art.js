// Piece artwork, drawn as SVG from each piece's vector `elements`.
// Replaces the 400×400 base64 PNG thumbnails that used to be stored in the library
// (~240 KB). Mirrors the maker's canvas renderer: wood background with vertical grain,
// a soft 12px frame, and round-capped strokes in the element colour.
(function (global) {
    const SIZE = 400;
    const cache = new Map();

    function num(v) { return Math.round(v * 100) / 100; }

    function grainLines() {
        // Deterministic version of the maker's random grain (every 4px, darker every 12px).
        let out = '';
        for (let i = 0; i < SIZE; i += 4) {
            const drift = ((i * 37) % 7 - 3) / 3; // pseudo-random −1..1
            const color = i % 12 === 0 ? '#b98d5c' : '#d4a373';
            out += `<line x1="${i}" y1="0" x2="${num(i + drift)}" y2="${SIZE}" stroke="${color}"/>`;
        }
        return `<g stroke-width="1" opacity="0.35">${out}</g>`;
    }
    let grainSvg = null;

    function elementSvg(el) {
        const c = el.color || '#5d4037';
        const w = el.width || 8;
        const x1 = el.p1.x * SIZE, y1 = el.p1.y * SIZE;
        if (el.type === 'dot') {
            return `<circle cx="${num(x1)}" cy="${num(y1)}" r="${num(w / 2)}" fill="${c}"/>`;
        }
        const x2 = el.p2.x * SIZE, y2 = el.p2.y * SIZE;
        let dash = '';
        if (el.type === 'dotted') {
            const len = Math.hypot(x2 - x1, y2 - y1);
            if (!(len > 0)) return '';
            const u = len / (2 * (el.segments || 4) - 1);
            dash = ` stroke-dasharray="${num(u)} ${num(u)}"`;
        }
        return `<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${dash}/>`;
    }

    function pieceSvg(piece) {
        if (!grainSvg) grainSvg = grainLines();
        const body = (piece.elements || []).map(elementSvg).join('');
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">` +
            `<rect width="${SIZE}" height="${SIZE}" fill="#e3c191"/>` + grainSvg +
            `<rect x="6" y="6" width="${SIZE - 12}" height="${SIZE - 12}" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="12"/>` +
            body + `</svg>`;
    }

    function pieceThumbnail(piece) {
        const key = JSON.stringify(piece.elements || []);
        if (!cache.has(key)) cache.set(key, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pieceSvg(piece)));
        return cache.get(key);
    }

    // Give every piece a generated thumbnail (pieces without elements keep any stored one).
    function applyPieceArt(library) {
        (library || []).forEach(p => {
            if (p && p.elements && p.elements.length) p.thumbnail = pieceThumbnail(p);
        });
        return library;
    }

    global.pieceThumbnail = pieceThumbnail;
    global.applyPieceArt = applyPieceArt;
})(typeof window !== 'undefined' ? window : globalThis);
