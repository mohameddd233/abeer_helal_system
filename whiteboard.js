// WHITEBOARD
// ============================================================
let wbCanvas, wbCtx, wbDrawing = false;
let wbTool = 'pen', wbColor = '#2C3E35', wbSize = 6;
let wbPaths = [], wbRedoStack = [], wbCurrentPath = null, wbInitialized = false;

function initWhiteboard() {
    if (wbInitialized) { setTimeout(() => wbResize(), 100); return; }
    wbCanvas = document.getElementById('whiteboardCanvas');
    wbCtx = wbCanvas.getContext('2d');
    wbResize();
    window.addEventListener('resize', wbResize);
    document.addEventListener('fullscreenchange', () => setTimeout(() => wbResize(), 200));
    wbCanvas.addEventListener('pointerdown', wbStart);
    wbCanvas.addEventListener('pointermove', wbMove);
    wbCanvas.addEventListener('pointerup', wbEnd);
    wbCanvas.addEventListener('pointercancel', wbEnd);
    wbCanvas.addEventListener('pointerleave', wbEnd);
    wbInitialized = true;
    wbUpdateStatus();
    wbRedraw();
}

function wbResize() {
    if (!wbCanvas) return;
    const wrapper = document.getElementById('wbCanvasWrapper');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    wbCanvas.width = rect.width * dpr;
    wbCanvas.height = rect.height * dpr;
    wbCanvas.style.width = rect.width + 'px';
    wbCanvas.style.height = rect.height + 'px';
    wbCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wbRedraw();
}

function wbStart(e) {
    wbDrawing = true;
    wbCanvas.setPointerCapture(e.pointerId);
    const rect = wbCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    wbCurrentPath = { tool: wbTool, color: wbColor, size: wbSize, points: [{ x, y }] };
    if (wbTool === 'eraser') { wbCurrentPath.color = 'eraser'; wbCurrentPath.size = wbSize * 3; }
    wbRedoStack = [];
}

function wbMove(e) {
    if (!wbDrawing || !wbCurrentPath) return;
    const rect = wbCanvas.getBoundingClientRect();
    wbCurrentPath.points.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    wbRedraw();
}

function wbEnd() {
    if (!wbDrawing || !wbCurrentPath) return;
    wbDrawing = false;
    if (wbCurrentPath.points.length > 0) wbPaths.push(wbCurrentPath);
    wbCurrentPath = null;
    wbRedraw();
}

function wbRedraw() {
    if (!wbCtx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = wbCanvas.width / dpr, h = wbCanvas.height / dpr;
    wbCtx.clearRect(0, 0, w, h);
    const all = wbCurrentPath ? [...wbPaths, wbCurrentPath] : wbPaths;
    all.forEach(p => wbDrawPath(p));
}

function wbDrawPath(path) {
    if (!path.points || path.points.length === 0) return;
    wbCtx.save();
    wbCtx.lineCap = 'round';
    wbCtx.lineJoin = 'round';
    wbCtx.lineWidth = path.size;
    if (path.color === 'eraser') {
        wbCtx.globalCompositeOperation = 'destination-out';
        wbCtx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        wbCtx.globalCompositeOperation = 'source-over';
        wbCtx.strokeStyle = path.color;
    }
    wbCtx.beginPath();
    const pts = path.points;
    if (pts.length === 1) {
        wbCtx.arc(pts[0].x, pts[0].y, path.size / 2, 0, Math.PI * 2);
        wbCtx.fillStyle = path.color === 'eraser' ? 'rgba(0,0,0,1)' : path.color;
        wbCtx.fill();
    } else {
        wbCtx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) wbCtx.lineTo(pts[i].x, pts[i].y);
        wbCtx.stroke();
    }
    wbCtx.restore();
}

function wbSetTool(tool) {
    wbTool = tool;
    const penBtn = document.getElementById('wbPenBtn');
    const eraserBtn = document.getElementById('wbEraserBtn');
    if (penBtn) penBtn.classList.toggle('active', tool === 'pen');
    if (eraserBtn) eraserBtn.classList.toggle('active', tool === 'eraser');
    const fsPen = document.getElementById('wbFsPenBtn');
    const fsEraser = document.getElementById('wbFsEraserBtn');
    if (fsPen) fsPen.classList.toggle('active', tool === 'pen');
    if (fsEraser) fsEraser.classList.toggle('active', tool === 'eraser');
    wbUpdateStatus();
}

function wbSetColor(el) {
    wbColor = el.dataset.color;
    document.querySelectorAll('.wb-color-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`.wb-color-btn[data-color="${wbColor}"]`).forEach(b => b.classList.add('active'));
    wbSetTool('pen');
    wbUpdateStatus();
}

function wbSetSize(size, el) {
    wbSize = size;
    document.querySelectorAll('.wb-size-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    wbUpdateStatus();
}

function wbUndo() { if (wbPaths.length === 0) return; wbRedoStack.push(wbPaths.pop()); wbRedraw(); }
function wbRedo() { if (wbRedoStack.length === 0) return; wbPaths.push(wbRedoStack.pop()); wbRedraw(); }
function wbClear() { if (!confirm('هل أنت متأكد من مسح السبورة بالكامل؟')) return; wbPaths = []; wbRedoStack = []; wbRedraw(); }

function wbToggleBg(type) {
    const wrapper = document.getElementById('wbCanvasWrapper');
    wrapper.className = 'wb-canvas-wrapper';
    if (type !== 'plain') wrapper.classList.add('bg-' + type);
}

function wbSaveImage() {
    const wrapper = document.getElementById('wbCanvasWrapper');
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const temp = document.createElement('canvas');
    temp.width = rect.width * dpr;
    temp.height = rect.height * dpr;
    const tctx = temp.getContext('2d');
    tctx.scale(dpr, dpr);
    const bgStyle = getComputedStyle(wrapper);
    tctx.fillStyle = bgStyle.backgroundColor || '#ffffff';
    tctx.fillRect(0, 0, rect.width, rect.height);
    tctx.drawImage(wbCanvas, 0, 0, rect.width, rect.height);
    const link = document.createElement('a');
    link.download = `سبورة_عبير_هلال_${getCurrentDate()}.png`;
    link.href = temp.toDataURL('image/png');
    link.click();
    showToast('تم حفظ السبورة كصورة', 'success');
}

function wbToggleFullscreen() {
    const wrapper = document.getElementById('wbCanvasWrapper');
    if (!document.fullscreenElement) {
        wrapper.requestFullscreen().catch(() => showToast('ملء الشاشة غير مدعوم', 'error'));
        setTimeout(() => wbResize(), 300);
    } else {
        document.exitFullscreen().catch(() => {});
        setTimeout(() => wbResize(), 300);
    }
}

function wbUpdateStatus() {
    const el = document.getElementById('wbStatusText');
    if (!el) return;
    const toolName = wbTool === 'pen' ? 'قلم' : 'ممحاة';
    let sizeName = 'متوسط';
    if (wbSize <= 3) sizeName = 'رفيع';
    else if (wbSize >= 20) sizeName = 'سميك جداً';
    else if (wbSize >= 10) sizeName = 'سميك';
    el.textContent = `${toolName} — ${sizeName}`;
}

// ============================================================
