// LESSONS
// ============================================================
function renderLessons(filter = '', categoryFilter = '') {
    const lessons = getLessons();
    const files = getFilesMeta();

    const filteredLessons = lessons.filter(l => {
        const matchText = !filter || l.title.includes(filter) || (l.description && l.description.includes(filter)) || (l.category && l.category.includes(filter)) || (l.content && l.content.includes(filter));
        const matchCat = !categoryFilter || l.category === categoryFilter;
        return matchText && matchCat;
    }).sort((a, b) => (a.isBuiltin && !b.isBuiltin) ? -1 : (!a.isBuiltin && b.isBuiltin) ? 1 : 0);

    const filteredFiles = files.filter(f => {
        const matchText = !filter || f.name.includes(filter) || (f.description && f.description.includes(filter)) || (f.category && f.category.includes(filter));
        const matchCat = !categoryFilter || f.category === categoryFilter;
        return matchText && matchCat;
    });

    document.getElementById('lessonsCount').innerText = lessons.length;
    const allCats = [...new Set([...lessons.map(l => l.category), ...files.map(f => f.category)].filter(Boolean))];
    document.getElementById('lessonsCategoriesCount').innerText = allCats.length;
    document.getElementById('lessonsBuiltinCount').innerText = lessons.filter(l => l.isBuiltin).length;
    document.getElementById('lessonsFilesCount').innerText = files.length;

    const catSelect = document.getElementById('filterLessonCategory');
    const currentVal = catSelect.value;
    catSelect.innerHTML = '<option value="">كل التصنيفات</option>' + allCats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    catSelect.value = currentVal;
    document.getElementById('categoryList').innerHTML = allCats.map(c => `<option value="${escapeHtml(c)}">`).join('');

    const missing = getMissingBuiltinCount();
    const banner = document.getElementById('builtinBanner');
    if (missing > 0) {
        banner.style.display = 'flex';
        document.getElementById('missingBuiltinCount').innerText = missing;
    } else {
        banner.style.display = 'none';
    }

    const container = document.getElementById('lessonsContainer');
    if (filteredLessons.length === 0 && filteredFiles.length === 0) {
        container.innerHTML = `<div class="lesson-empty"><i class="fas fa-book-open"></i>${lessons.length === 0 && files.length === 0 ? 'لا توجد دروس أو ملفات بعد. ابدأ بإضافة أول درس أو ملف!' : 'لا توجد نتائج مطابقة للبحث'}</div>`;
        return;
    }

    let html = '';

    filteredFiles.forEach(f => {
        const isPdf = f.type === 'pdf';
        const icon = isPdf ? 'fa-file-pdf' : 'fa-file-image';
        const typeLabel = isPdf ? 'PDF' : 'صورة';
        const typeClass = isPdf ? 'pdf' : 'image';
        const cardClass = isPdf ? 'file-pdf' : 'file-image';
        html += `<article class="lesson-card file-card ${cardClass}">
            <div class="lesson-card-top">
                <span class="file-type-badge ${typeClass}"><i class="fas ${icon}"></i> ${typeLabel}</span>
                <span class="lesson-card-symbol"><i class="fas ${icon}"></i></span>
            </div>
            <h3>${escapeHtml(f.name)}</h3>
            ${f.description ? `<div class="lesson-desc">${escapeHtml(f.description)}</div>` : ''}
            <div class="lesson-meta">
                <span><i class="fas fa-tag"></i> ${escapeHtml(f.category || 'عام')}</span>
                <span><i class="fas fa-hdd"></i> ${formatFileSize(f.size)}</span>
            </div>
            <div class="lesson-actions">
                <button class="btn btn-sm btn-present lesson-open-btn" onclick="openFileViewer(${f.id})"><i class="fas fa-eye"></i> معاينة الملف</button>
                <button class="btn btn-sm btn-danger" onclick="deleteFile(${f.id})" title="حذف الملف" aria-label="حذف الملف"><i class="fas fa-trash"></i></button>
            </div>
        </article>`;
    });

    filteredLessons.forEach(l => {
        const firstContentLine = (l.content || '').split('\n')
            .map(line => line.trim())
            .find(line => line && !/^(#{1,6}\s|:::|[-*]\s|\d+\.\s|\||---)/.test(line));
        const excerpt = firstContentLine
            ? firstContentLine.replace(/\*\*/g, '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').slice(0, 130)
            : '';
        const sectionCount = (l.content || '').match(/^#{1,3}\s/gm)?.length || 0;
        html += `<article class="lesson-card ${l.isBuiltin ? 'builtin' : ''}">
            <div class="lesson-card-top">
                <span class="lesson-badge"><i class="fas fa-tag"></i> ${escapeHtml(l.category || 'عام')}</span>
                ${l.isBuiltin ? '<span class="lesson-core-badge"><i class="fas fa-star"></i> درس أساسي</span>' : '<span class="lesson-card-symbol"><i class="fas fa-book-quran"></i></span>'}
            </div>
            <h3>${escapeHtml(l.title)}</h3>
            ${l.description ? `<div class="lesson-desc">${escapeHtml(l.description)}</div>` : ''}
            ${excerpt ? `<div class="lesson-excerpt"><i class="fas fa-quote-right"></i><span>${escapeHtml(excerpt)}${excerpt.length === 130 ? '…' : ''}</span></div>` : ''}
            <div class="lesson-meta">
                <span><i class="fas fa-list-ol"></i> ${sectionCount ? `${sectionCount} محاور` : 'درس تعليمي'}</span>
                <span><i class="fas fa-calendar-alt"></i> ${formatDate(l.createdAt) || '-'}</span>
            </div>
            <div class="lesson-actions">
                <button class="btn btn-sm btn-present lesson-open-btn" onclick="startPresentation('${l.id}')"><i class="fas fa-play"></i> ابدأ الدرس</button>
                <button class="btn btn-sm lesson-icon-btn" onclick="editLesson('${l.id}')" title="تعديل الدرس" aria-label="تعديل الدرس"><i class="fas fa-edit"></i></button>
                ${l.isBuiltin
                    ? `<button class="btn btn-sm lesson-icon-btn" onclick="resetBuiltinLesson('${l.id}')" title="استرجاع النسخة الأصلية" aria-label="استرجاع النسخة الأصلية"><i class="fas fa-undo"></i></button>`
                    : `<button class="btn btn-sm btn-danger lesson-icon-btn" onclick="deleteLesson('${l.id}')" title="حذف الدرس" aria-label="حذف الدرس"><i class="fas fa-trash"></i></button>`}
            </div>
        </article>`;
    });

    container.innerHTML = html;
}

function openLessonModal(data = null) {
    document.getElementById('editLessonId').value = data ? data.id : '';
    document.getElementById('lessonTitle').value = data ? data.title : '';
    document.getElementById('lessonCategory').value = data ? (data.category || '') : '';
    document.getElementById('lessonDescription').value = data ? (data.description || '') : '';
    document.getElementById('lessonContent').value = data ? (data.content || '') : '';
    document.getElementById('lessonModalTitle').innerText = data ? (data.isBuiltin ? 'تعديل درس أساسي' : 'تعديل الدرس') : 'إضافة درس جديد';
    document.getElementById('lessonModal').classList.add('show');
}

function insertTemplate(text) {
    const ta = document.getElementById('lessonContent');
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.substring(0, start);
    const after = ta.value.substring(end);
    const sep = (before && !before.endsWith('\n\n')) ? '\n\n' : '';
    ta.value = before + sep + text + '\n\n' + after;
    ta.focus();
    ta.selectionStart = ta.selectionEnd = (before + sep + text).length;
    showToast('تم إضافة القالب', 'success');
}

function saveLesson() {
    const id = document.getElementById('editLessonId').value;
    const title = document.getElementById('lessonTitle').value.trim();
    const category = document.getElementById('lessonCategory').value.trim();
    const description = document.getElementById('lessonDescription').value.trim();
    const content = document.getElementById('lessonContent').value.trim();
    if (!title) { showToast('يرجى إدخال عنوان الدرس', 'error'); return; }
    const lessons = getLessons();
    if (id) {
        const idx = lessons.findIndex(l => String(l.id) === String(id));
        if (idx > -1) {
            const wasBuiltin = lessons[idx].isBuiltin;
            lessons[idx] = { ...lessons[idx], title, category, description, content };
            if (wasBuiltin) lessons[idx].modifiedAt = new Date().toISOString();
            setLessons(lessons);
            showToast(wasBuiltin ? 'تم تعديل الدرس الأساسي' : 'تم تحديث الدرس', 'success');
        }
    } else {
        lessons.push({ id: getNextId(NEXT_LESSON_ID), title, category, description, content, createdAt: getCurrentDate() });
        setLessons(lessons);
        showToast('تم إضافة الدرس', 'success');
    }
    closeModal('lessonModal');
    renderLessons(document.getElementById('searchLesson').value, document.getElementById('filterLessonCategory').value);
    renderDashboard();
}

function editLesson(id) { const l = getLessons().find(x => String(x.id) === String(id)); if (l) openLessonModal(l); }

function deleteLesson(id) {
    const lesson = getLessons().find(x => String(x.id) === String(id));
    if (lesson && lesson.isBuiltin) { showToast('لا يمكن حذف درس أساسي. يمكنك تعديله فقط', 'warning'); return; }
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    setLessons(getLessons().filter(l => String(l.id) !== String(id)));
    renderLessons(document.getElementById('searchLesson').value, document.getElementById('filterLessonCategory').value);
    renderDashboard();
    showToast('تم حذف الدرس', 'success');
}

function resetBuiltinLesson(id) {
    const original = BUILTIN_LESSONS.find(bl => String(bl.id) === String(id));
    if (!original) return;
    if (!confirm('استرجاع النسخة الأصلية؟ سيتم فقدان تعديلاتك.')) return;
    const lessons = getLessons();
    const idx = lessons.findIndex(l => String(l.id) === String(id));
    if (idx > -1) {
        lessons[idx] = { ...original };
        setLessons(lessons);
        renderLessons();
        showToast('تم استرجاع النسخة الأصلية', 'success');
    }
}

// ============================================================
// FILE UPLOAD
// ============================================================
let pendingFile = null;
let currentFileBlobUrl = null;
let currentFileId = null;

function openFileUploadModal() {
    pendingFile = null;
    document.getElementById('fileDisplayName').value = '';
    document.getElementById('fileCategory').value = '';
    document.getElementById('fileDescription').value = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreviewInfo').innerHTML = '';
    document.getElementById('fileUploadModal').classList.add('show');
}

function handleFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) { showToast('يُسمح فقط بملفات PDF والصور', 'error'); event.target.value = ''; return; }
    if (file.size > 20 * 1024 * 1024) { showToast('حجم الملف يتجاوز 20 ميجابايت', 'error'); event.target.value = ''; return; }
    pendingFile = file;
    const icon = isPdf ? 'fa-file-pdf' : 'fa-file-image';
    document.getElementById('filePreviewInfo').innerHTML = `
        <div class="file-preview-info">
            <i class="fas ${icon}"></i>
            <div class="file-info-text">
                <strong>${escapeHtml(file.name)}</strong>
                <small>${formatFileSize(file.size)} • ${isPdf ? 'PDF' : 'صورة'}</small>
            </div>
            <button class="btn btn-sm btn-danger" onclick="clearPendingFile()"><i class="fas fa-times"></i></button>
        </div>
    `;
    if (!document.getElementById('fileDisplayName').value) {
        document.getElementById('fileDisplayName').value = file.name.replace(/\.[^/.]+$/, '');
    }
}

function clearPendingFile() {
    pendingFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreviewInfo').innerHTML = '';
}

async function saveUploadedFile() {
    if (!pendingFile) { showToast('يرجى اختيار ملف أولاً', 'error'); return; }
    const name = document.getElementById('fileDisplayName').value.trim() || pendingFile.name;
    const category = document.getElementById('fileCategory').value.trim() || 'ملفات';
    const description = document.getElementById('fileDescription').value.trim();
    const isPdf = pendingFile.type === 'application/pdf' || pendingFile.name.toLowerCase().endsWith('.pdf');
    const id = getNextId(NEXT_FILE_ID);
    try {
        await saveFileToDB(id, pendingFile);
        const meta = getFilesMeta();
        meta.push({
            id, name, category, description,
            type: isPdf ? 'pdf' : 'image',
            mime: pendingFile.type,
            size: pendingFile.size,
            originalName: pendingFile.name,
            createdAt: getCurrentDate()
        });
        setFilesMeta(meta);
        closeModal('fileUploadModal');
        renderLessons(document.getElementById('searchLesson').value, document.getElementById('filterLessonCategory').value);
        renderDashboard();
        showToast('تم حفظ الملف بنجاح', 'success');
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء حفظ الملف', 'error');
    }
}

async function openFileViewer(id) {
    const meta = getFilesMeta().find(f => f.id === id);
    if (!meta) { showToast('الملف غير موجود', 'error'); return; }
    const blob = await getFileFromDB(id);
    if (!blob) { showToast('تعذر تحميل الملف', 'error'); return; }
    if (currentFileBlobUrl) { URL.revokeObjectURL(currentFileBlobUrl); currentFileBlobUrl = null; }
    const url = URL.createObjectURL(blob);
    currentFileBlobUrl = url;
    currentFileId = id;
    document.getElementById('fileViewerTitle').textContent = meta.name;
    const body = document.getElementById('fileViewerBody');
    if (meta.type === 'pdf') {
        body.innerHTML = `<iframe src="${url}" title="${escapeHtml(meta.name)}"></iframe>`;
    } else {
        body.innerHTML = `<img src="${url}" alt="${escapeHtml(meta.name)}" />`;
    }
    document.getElementById('fileViewerOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeFileViewer() {
    document.getElementById('fileViewerOverlay').classList.remove('show');
    document.getElementById('fileViewerBody').innerHTML = '';
    document.body.style.overflow = '';
    if (currentFileBlobUrl) { URL.revokeObjectURL(currentFileBlobUrl); currentFileBlobUrl = null; }
    currentFileId = null;
}

function downloadCurrentFile() {
    if (!currentFileBlobUrl || !currentFileId) return;
    const meta = getFilesMeta().find(f => f.id === currentFileId);
    const a = document.createElement('a');
    a.href = currentFileBlobUrl;
    a.download = meta ? (meta.originalName || meta.name) : 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function deleteFile(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
    try {
        await deleteFileFromDB(id);
        setFilesMeta(getFilesMeta().filter(f => f.id !== id));
        renderLessons(document.getElementById('searchLesson').value, document.getElementById('filterLessonCategory').value);
        renderDashboard();
        showToast('تم حذف الملف', 'success');
    } catch (err) {
        console.error(err);
        showToast('تعذر حذف الملف', 'error');
    }
}

// ============================================================
// MARKDOWN PARSER
// ============================================================
function applyInlineMarkdown(text) {
    let safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<span class="md-bold">$1</span>');
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return safe;
}

function parseMarkdown(text) {
    if (!text) return '';
    const lines = text.split('\n');
    const out = [];
    let inTable = false, tableRows = [];

    const flushTable = () => {
        if (tableRows.length === 0) { inTable = false; return; }
        let html = '<div class="pdf-table-wrap"><table class="pdf-table">';
        tableRows.forEach((row, i) => {
            const cells = row.split('|').map(c => c.trim()).filter(c => c !== '');
            if (cells.length === 0) return;
            const tag = i === 0 ? 'th' : 'td';
            html += '<tr>' + cells.map(c => `<${tag}>${applyInlineMarkdown(c)}</${tag}>`).join('') + '</tr>';
        });
        html += '</table></div>';
        out.push(html);
        tableRows = [];
        inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace(/\r$/, '');
        const t = line.trim();

        if (/^:::title:\s*/.test(t)) { if (inTable) flushTable(); out.push(`<div class="pdf-title-box">${applyInlineMarkdown(t.replace(/^:::title:\s*/, ''))}</div>`); continue; }
        if (/^:::box-(red|green|yellow|blue):\s*/.test(t)) {
            if (inTable) flushTable();
            const m = t.match(/^:::box-(red|green|yellow|blue):\s*(.+)$/);
            out.push(`<div class="pdf-box pdf-box-${m[1]}">${applyInlineMarkdown(m[2])}</div>`);
            continue;
        }
        if (/^:::card:\s*/.test(t)) {
            if (inTable) flushTable();
            const m = t.match(/^:::card:\s*(.+?)(?:\s*\|\s*(.+))?$/);
            out.push(`<div class="pdf-card"><div class="card-label">${applyInlineMarkdown(m[1])}</div>${m[2] ? `<div class="card-content">${applyInlineMarkdown(m[2])}</div>` : ''}</div>`);
            continue;
        }
        if (/^:::quran:\s*/.test(t)) { if (inTable) flushTable(); out.push(`<div class="pdf-quran-example">${applyInlineMarkdown(t.replace(/^:::quran:\s*/, ''))}</div>`); continue; }
        if (/^:::table\s*$/.test(t)) { inTable = true; tableRows = []; continue; }
        if (inTable) {
            if (t.startsWith('|')) tableRows.push(t);
            else if (t === '') { /* skip */ }
            else flushTable();
            continue;
        }
        if (!t) { out.push('<div style="height:8px;"></div>'); continue; }
        if (/^#\s+/.test(t)) { out.push(`<div class="md-h1">${applyInlineMarkdown(t.replace(/^#\s+/, ''))}</div>`); continue; }
        if (/^##\s+/.test(t)) { out.push(`<div class="md-h2">${applyInlineMarkdown(t.replace(/^##\s+/, ''))}</div>`); continue; }
        if (/^###\s+/.test(t)) { out.push(`<div class="md-h3">${applyInlineMarkdown(t.replace(/^###\s+/, ''))}</div>`); continue; }
        if (/^>\s?/.test(t)) { out.push(`<div class="md-quote">${applyInlineMarkdown(t.replace(/^>\s?/, ''))}</div>`); continue; }
        if (/^---+\s*$/.test(t)) { out.push('<hr class="md-hr">'); continue; }
        const numMatch = t.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) { out.push(`<div class="md-numbered"><span class="num-badge">${numMatch[1]}</span><span>${applyInlineMarkdown(numMatch[2])}</span></div>`); continue; }
        const bulletMatch = t.match(/^[-*]\s+(.*)$/);
        if (bulletMatch) { out.push(`<div class="md-bullet"><span class="bullet-icon">◆</span><span>${applyInlineMarkdown(bulletMatch[1])}</span></div>`); continue; }
        out.push(`<div class="md-text">${applyInlineMarkdown(t)}</div>`);
    }
    if (inTable) flushTable();
    return out.join('');
}

// ============================================================
// PRESENTATION
// ============================================================
let presentationSlides = [];
let currentSlideIndex = 0;

function buildSlidesFromLesson(lesson) {
    const slides = [{ type: 'cover', theme: 0, title: lesson.title, category: lesson.category || 'درس', description: lesson.description || '' }];
    const content = (lesson.content || '').trim();
    if (content) {
        const lines = content.split('\n');
        const firstLine = lines[0].trim();
        if (/^#\s+/.test(firstLine) && firstLine.replace(/^#\s+/, '').trim() === lesson.title.trim()) {
            lines.shift();
        }
        let curr = [];
        const push = () => {
            const body = curr.join('\n').trim();
            if (!body) return;
            slides.push({ type: 'content', theme: (slides.length % 4) + 1, body });
            curr = [];
        };
        lines.forEach(line => {
            const t = line.trim();
            if (/^#{1,2}\s+/.test(t) || /^:::title:/.test(t) || /^:::table\s*$/.test(t)) {
                const hasBody = curr.some(part => {
                    const text = part.trim();
                    return text && !/^#{1,2}\s+/.test(text);
                });
                if (hasBody) push();
                curr.push(line);
                return;
            }
            curr.push(line);
            if (curr.length >= 12) push();
        });
        push();
    }
    slides.push({ type: 'end', theme: 0, title: 'شكراً لحسن استماعكم', subtitle: 'وفقكم الله لما يحب ويرضى' });
    return slides;
}

function startPresentation(lessonId) {
    const lesson = getLessons().find(l => String(l.id) === String(lessonId));
    if (!lesson) { showToast('الدرس غير موجود', 'error'); return; }
    presentationSlides = buildSlidesFromLesson(lesson);
    currentSlideIndex = 0;
    renderPresentationSlides();
    updatePresentationUI();
    document.getElementById('presentationOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function renderPresentationSlides() {
    const container = document.getElementById('presentationSlidesContainer');
    container.innerHTML = '';
    presentationSlides.forEach((slide, idx) => {
        const el = document.createElement('div');
        el.className = 'presentation-slide';
        el.dataset.theme = slide.theme || 0;
        if (idx === 0) el.classList.add('active');
        if (slide.type === 'cover') {
            el.classList.add('cover');
            el.innerHTML = `<div class="presentation-content">
                <div class="presentation-cover-icon"><i class="fas fa-book-quran"></i></div>
                <div class="presentation-category"><i class="fas fa-tag"></i> ${escapeHtml(slide.category)}</div>
                <h1 class="presentation-title">${escapeHtml(slide.title)}</h1>
                <div class="presentation-divider" style="margin:0 auto 30px;"></div>
                ${slide.description ? `<p class="presentation-cover-sub">${escapeHtml(slide.description)}</p>` : ''}
            </div>
            <div class="presentation-slide-badge">شريحة ${idx + 1}</div>`;
        } else if (slide.type === 'end') {
            el.classList.add('end');
            el.innerHTML = `<div class="presentation-content">
                <div class="presentation-cover-icon" style="color:#F5C871;"><i class="fas fa-star-and-crescent"></i></div>
                <h1 class="presentation-title">${escapeHtml(slide.title)}</h1>
                <div class="presentation-divider" style="margin:0 auto 30px;"></div>
                <p class="presentation-cover-sub">${escapeHtml(slide.subtitle || '')}</p>
                <p class="presentation-cover-sub" style="margin-top:40px;color:#F5C871;font-size:24px;font-weight:700;">أ. عبير هلال</p>
            </div>
            <div class="presentation-slide-badge">شريحة ${idx + 1}</div>`;
        } else {
            el.innerHTML = `<div class="presentation-content"><div class="presentation-body">${parseMarkdown(slide.body)}</div></div>
                <div class="presentation-slide-badge">شريحة <bdi>${idx + 1} / ${presentationSlides.length}</bdi></div>`;
        }
        container.appendChild(el);
    });
}

function updatePresentationUI() {
    document.querySelectorAll('.presentation-slide').forEach((s, i) => s.classList.toggle('active', i === currentSlideIndex));
    const ind = document.getElementById('pageIndicator');
    if (ind) ind.innerText = `${currentSlideIndex + 1} / ${presentationSlides.length}`;
    const prog = document.getElementById('presentationProgress');
    if (prog) prog.style.width = ((currentSlideIndex + 1) / presentationSlides.length * 100) + '%';
}

function nextSlide() { if (currentSlideIndex < presentationSlides.length - 1) { currentSlideIndex++; updatePresentationUI(); } }
function prevSlide() { if (currentSlideIndex > 0) { currentSlideIndex--; updatePresentationUI(); } }
function closePresentation() {
    document.getElementById('presentationOverlay').classList.remove('show');
    document.body.style.overflow = '';
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
function toggleFullscreen() {
    if (!document.fullscreenElement) document.getElementById('presentationOverlay').requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
}

// ============================================================
