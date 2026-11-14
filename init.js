// CLOCK
// ============================================================
function updateDateTime() {
    const d = new Date();
    document.getElementById('currentDate').innerText = d.toLocaleDateString('ar-EG');
    document.getElementById('currentTime').innerText = getCurrentTime();
    document.getElementById('currentDay').innerText = getCurrentDay();
}
setInterval(updateDateTime, 1000);

// ============================================================
// EVENTS
// ============================================================
document.getElementById('searchStudent').addEventListener('input', e => renderStudents(e.target.value));
document.getElementById('searchAllSessions').addEventListener('input', e => renderAllSessions(e.target.value, document.getElementById('filterSessionDate').value, document.getElementById('filterSessionMonth').value));
document.getElementById('filterSessionDate').addEventListener('change', e => renderAllSessions(document.getElementById('searchAllSessions').value, e.target.value, document.getElementById('filterSessionMonth').value));
document.getElementById('filterSessionMonth').addEventListener('change', e => { document.getElementById('filterSessionDate').value = ''; renderAllSessions(document.getElementById('searchAllSessions').value, '', e.target.value); });
document.getElementById('searchLesson').addEventListener('input', e => renderLessons(e.target.value, document.getElementById('filterLessonCategory').value));
document.getElementById('filterLessonCategory').addEventListener('change', e => renderLessons(document.getElementById('searchLesson').value, e.target.value));

document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        if (this.dataset.page === 'student-detail') return;
        navigateTo(this.dataset.page);
    });
});

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'd') { e.preventDefault(); toggleDarkMode(); return; }
    const overlay = document.getElementById('presentationOverlay');
    if (overlay && overlay.classList.contains('show')) {
        if (e.key === 'Escape') closePresentation();
        else if (e.key === 'ArrowLeft') nextSlide();
        else if (e.key === 'ArrowRight') prevSlide();
        else if (e.key === ' ') { e.preventDefault(); nextSlide(); }
        else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    }
    if (e.key === 'Escape' && document.getElementById('fileViewerOverlay').classList.contains('show')) closeFileViewer();
});

const uploadArea = document.getElementById('fileUploadArea');
if (uploadArea) {
    ['dragover', 'dragenter'].forEach(ev => uploadArea.addEventListener(ev, e => { e.preventDefault(); uploadArea.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(ev => uploadArea.addEventListener(ev, e => { e.preventDefault(); uploadArea.classList.remove('dragover'); }));
    uploadArea.addEventListener('drop', e => {
        const file = e.dataTransfer.files[0];
        if (file) {
            const dt = new DataTransfer();
            dt.items.add(file);
            document.getElementById('fileInput').files = dt.files;
            handleFileSelected({ target: { files: dt.files, value: '' } });
        }
    });
}

// ============================================================
// MODAL CLOSE
// ============================================================
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// ============================================================
// INIT
// ============================================================
function init() {
    installBuiltinLessons();
    loadDarkMode();
    updateDateTime();
    navigateTo('dashboard');
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', function(e) { if (e.target === this) closeModal(this.id); });
    });
}
init();
