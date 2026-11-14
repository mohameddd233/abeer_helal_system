// TOAST
// ============================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// HELPERS
// ============================================================
function getStudent(id) { return getStudents().find(s => s.id === id); }
function getSessionsForStudent(studentId) {
    return getSessions().filter(s => s.studentId === studentId).sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
}
function getAllSessionsSorted() { return getSessions().sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id); }
function getStudentName(id) { const s = getStudent(id); return s ? s.name : 'غير معروف'; }
function formatDate(d) { if (!d) return ''; const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }
function getDayName(d) { return new Date(d + 'T00:00:00').toLocaleDateString('ar-EG', { weekday: 'long' }); }
function getCurrentDate() { return new Date().toISOString().split('T')[0]; }
function getCurrentTime() { return new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }); }
function getCurrentDay() { return new Date().toLocaleDateString('ar-EG', { weekday: 'long' }); }
function getStars(rating) {
    if (!rating) return '<span class="stars-empty">☆☆☆☆☆</span>';
    const full = Math.floor(rating);
    return '<span class="stars">' + '★'.repeat(full) + '</span><span class="stars-empty">' + '☆'.repeat(5 - full) + '</span>';
}
function getAverageRating(sessions) {
    const rated = sessions.filter(s => s.rating && s.rating > 0);
    if (rated.length === 0) return 0;
    return Math.round((rated.reduce((a, s) => a + parseFloat(s.rating), 0) / rated.length) * 10) / 10;
}
function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ============================================================
// NAVIGATION
// ============================================================
function navigateTo(page, data) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links a[data-page]').forEach(a => a.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    const link = document.querySelector(`.nav-links a[data-page="${page}"]`);
    if (link) link.classList.add('active');
    if (page === 'dashboard') renderDashboard();
    else if (page === 'students') renderStudents();
    else if (page === 'lessons') renderLessons();
    else if (page === 'whiteboard') initWhiteboard();
    else if (page === 'all-sessions') renderAllSessions();
    else if (page === 'student-detail' && data) renderStudentDetail(data);
}

// ============================================================
// DARK MODE
// ============================================================
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem(STORAGE_KEYS.darkMode, isDark ? 'true' : 'false');
    document.querySelector('.dark-toggle i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}
function loadDarkMode() {
    if (localStorage.getItem(STORAGE_KEYS.darkMode) === 'true') {
        document.body.classList.add('dark-mode');
        document.querySelector('.dark-toggle i').className = 'fas fa-sun';
    }
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
    const students = getStudents();
    const sessions = getSessions();
    const lessons = getLessons();
    const sortedSessions = getAllSessionsSorted();
    document.getElementById('dashStudentCount').innerText = students.length;
    document.getElementById('dashSessionCount').innerText = sessions.length;
    document.getElementById('dashLessonsCount').innerText = lessons.length;
    const lastSession = sortedSessions.length ? sortedSessions[0] : null;
    document.getElementById('dashLastSession').innerText = lastSession ? formatDate(lastSession.date) : 'لا توجد';
    document.getElementById('dashTodaySessions').innerText = sessions.filter(s => s.date === getCurrentDate()).length;
    let bestStudent = '-', bestAvg = 0;
    students.forEach(s => {
        const ss = getSessionsForStudent(s.id);
        const avg = getAverageRating(ss);
        if (avg > bestAvg && ss.length > 0) { bestAvg = avg; bestStudent = s.name; }
    });
    document.getElementById('dashBestStudent').innerText = bestStudent;
    const sortedStudents = [...students].sort((a, b) => b.id - a.id);
    document.getElementById('dashLatestStudent').innerText = sortedStudents.length ? sortedStudents[0].name : '-';
    let totalAvg = 0, count = 0;
    students.forEach(s => {
        const avg = getAverageRating(getSessionsForStudent(s.id));
        if (avg > 0) { totalAvg += avg; count++; }
    });
    document.getElementById('dashAvgRating').innerText = count > 0 ? (Math.round((totalAvg / count) * 10) / 10) : '0';
    document.getElementById('studentCount').innerText = students.length;
    document.getElementById('sessionCount').innerText = sessions.length;
    document.getElementById('avgRating').innerText = getAverageRating(sessions) || '0';
}

// ============================================================
// STUDENTS
// ============================================================
function renderStudents(filter = '') {
    const students = getStudents();
    const filtered = [...students].sort((a, b) => a.name.localeCompare(b.name)).filter(s => s.name.includes(filter));
    const tbody = document.getElementById('studentsTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;">لا يوجد طلاب</td></tr>`;
        return;
    }
    tbody.innerHTML = filtered.map((s, idx) => {
        const ss = getSessionsForStudent(s.id);
        const avg = getAverageRating(ss);
        const detailsText = s.details || '';
        const detailsShort = detailsText.length > 40 ? detailsText.substring(0, 40) + '...' : detailsText;
        return `<tr>
            <td>${idx + 1}</td>
            <td><a class="student-name-link" onclick="navigateTo('student-detail', ${s.id})"><i class="fas fa-user-circle"></i> ${escapeHtml(s.name)}</a></td>
            <td>${escapeHtml(s.level || '-')}</td>
            <td style="max-width:220px;font-size:13px;color:var(--text-secondary);" title="${escapeHtml(detailsText)}">${escapeHtml(detailsShort || '-')}</td>
            <td>${ss.length}</td>
            <td>${avg > 0 ? getStars(avg) : '-'}</td>
            <td class="actions-cell">
                <button class="btn btn-sm" onclick="editStudent(${s.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudent(${s.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
    document.getElementById('studentCount').innerText = students.length;
}

let currentStudentId = null;
let studentChartInstance = null;

function renderStudentDetail(studentId) {
    currentStudentId = studentId;
    const student = getStudent(studentId);
    if (!student) { navigateTo('students'); return; }
    document.getElementById('studentDetailName').querySelector('span').innerText = student.name;
    const sessions = getSessionsForStudent(studentId);
    const avg = getAverageRating(sessions);
    const last = sessions.length ? sessions[0] : null;
    const details = student.details || '';
    document.getElementById('studentInfoCard').innerHTML = `
        <div class="info-item"><i class="fas fa-chalkboard"></i> عدد الحصص: <span class="value">${sessions.length}</span></div>
        <div class="info-item"><i class="fas fa-star"></i> متوسط التقييم: <span class="value">${avg > 0 ? avg : '-'}</span></div>
        <div class="info-item"><i class="fas fa-clock"></i> آخر حصة: <span class="value">${last ? formatDate(last.date) : 'لا توجد'}</span></div>
        <div class="info-item"><i class="fas fa-book"></i> آخر حفظ: <span class="value">${last ? escapeHtml(last.memorization || '-') : '-'}</span></div>
        <div class="info-item"><i class="fas fa-undo"></i> آخر مراجعة: <span class="value">${last ? escapeHtml(last.review || '-') : '-'}</span></div>
        <div class="info-item"><i class="fas fa-layer-group"></i> المستوى: <span class="value">${escapeHtml(student.level || '-')}</span></div>
        <div class="info-item"><i class="fas fa-calendar-alt"></i> بداية الدراسة: <span class="value">${student.startDate ? formatDate(student.startDate) : '-'}</span></div>
    `;
    document.getElementById('studentDetailsCard').innerHTML = `
        <div class="student-details-card">
            <div class="details-header">
                <i class="fas fa-id-card"></i>
                <span>تفاصيل الطالب</span>
                <button class="btn btn-sm btn-primary" onclick="editStudentDetails(${student.id})" style="margin-right:auto;">
                    <i class="fas fa-edit"></i> تعديل
                </button>
            </div>
            <div class="details-content">
                ${details ? escapeHtml(details).replace(/\n/g, '<br>') : '<span style="color:var(--text-muted);font-style:italic;">لا توجد تفاصيل مسجلة بعد.</span>'}
            </div>
        </div>
    `;
    renderStudentChart(studentId);
    const container = document.getElementById('sessionsContainer');
    if (sessions.length === 0) {
        container.innerHTML = `<div style="padding:30px;text-align:center;color:var(--text-secondary);">لا توجد حصص مسجلة</div>`;
        return;
    }
    container.innerHTML = sessions.map(s => `
        <div class="session-item">
            <div class="session-info">
                <span class="date"><i class="fas fa-calendar-alt"></i> ${formatDate(s.date)}</span>
                <span class="day"><i class="fas fa-calendar-day"></i> ${getDayName(s.date)}</span>
                <span><i class="fas fa-clock"></i> ${s.time || '--:--'}</span>
                <span><i class="fas fa-book"></i> حفظ: ${escapeHtml(s.memorization || '-')}</span>
                <span><i class="fas fa-undo"></i> مراجعة: ${escapeHtml(s.review || '-')}</span>
                <span><i class="fas fa-star" style="color:var(--gold);"></i> ${s.rating ? getStars(s.rating) : '-'}</span>
                ${s.notes ? `<span><i class="fas fa-pen"></i> ${escapeHtml(s.notes)}</span>` : ''}
            </div>
            <div class="session-actions">
                <button class="btn btn-sm" onclick="editSession(${s.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteSession(${s.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function editStudentDetails(studentId) { const s = getStudent(studentId); if (s) openStudentModal(s); }

function renderStudentChart(studentId) {
    const rated = getSessionsForStudent(studentId).filter(s => s.rating && s.rating > 0).sort((a, b) => new Date(a.date) - new Date(b.date));
    const ctx = document.getElementById('studentChart').getContext('2d');
    if (studentChartInstance) studentChartInstance.destroy();
    const isDark = document.body.classList.contains('dark-mode');
    const primaryColor = isDark ? '#7DD3C0' : '#5BA88C';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(91,168,140,0.1)';
    const textColor = isDark ? '#E8EEF4' : '#2C3E35';
    if (rated.length < 2) {
        studentChartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: ['لا توجد بيانات كافية'], datasets: [{ label: 'التقييم', data: [0], borderColor: primaryColor, backgroundColor: 'rgba(91,168,140,0.1)', fill: true, tension: 0.4 }] },
            options: { responsive: true, plugins: { legend: { labels: { color: textColor, font: { family: 'Cairo' } } } }, scales: { y: { min: 0, max: 5, grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { color: gridColor }, ticks: { color: textColor } } } }
        });
        return;
    }
    studentChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rated.map(s => formatDate(s.date)),
            datasets: [{ label: 'تطور التقييم', data: rated.map(s => parseFloat(s.rating)), borderColor: primaryColor, backgroundColor: 'rgba(91,168,140,0.15)', fill: true, tension: 0.4, pointBackgroundColor: primaryColor, pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 6 }]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: textColor, font: { family: 'Cairo', size: 14 } } } }, scales: { y: { min: 0, max: 5, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor } }, x: { grid: { color: gridColor }, ticks: { color: textColor } } } }
    });
}

// ============================================================
// ALL SESSIONS
// ============================================================
function renderAllSessions(filter = '', dateFilter = '', monthFilter = '') {
    let sessions = getAllSessionsSorted();
    if (monthFilter) sessions = sessions.filter(s => s.date && s.date.startsWith(monthFilter));
    if (dateFilter) sessions = sessions.filter(s => s.date === dateFilter);
    const filtered = sessions.filter(s => {
        const name = getStudentName(s.studentId);
        return !filter || name.includes(filter) || (s.memorization && s.memorization.includes(filter)) || (s.review && s.review.includes(filter)) || (s.notes && s.notes.includes(filter));
    });
    const summary = document.getElementById('sessionsSummary');
    if (filter || dateFilter || monthFilter) {
        summary.style.display = 'flex';
        summary.innerHTML = `<span class="summary-item"><i class="fas fa-filter"></i> النتائج:</span>
            <span class="summary-item"><i class="fas fa-chalkboard"></i> الحصص: <span class="num">${filtered.length}</span></span>
            <span class="summary-item"><i class="fas fa-users"></i> الطلاب: <span class="num">${new Set(filtered.map(s => s.studentId)).size}</span></span>
            <span class="summary-item"><i class="fas fa-star"></i> المتوسط: <span class="num">${getAverageRating(filtered) || '0'}</span></span>`;
    } else {
        summary.style.display = 'none';
    }
    const container = document.getElementById('allSessionsContainer');
    if (filtered.length === 0) {
        container.innerHTML = `<div style="padding:30px;text-align:center;color:var(--text-secondary);">لا توجد حصص</div>`;
        return;
    }
    container.innerHTML = filtered.map(s => `
        <div class="session-item">
            <div class="session-info">
                <span><i class="fas fa-user"></i> ${escapeHtml(getStudentName(s.studentId))}</span>
                <span class="date"><i class="fas fa-calendar-alt"></i> ${formatDate(s.date)}</span>
                <span class="day"><i class="fas fa-calendar-day"></i> ${getDayName(s.date)}</span>
                <span><i class="fas fa-clock"></i> ${s.time || '--:--'}</span>
                <span><i class="fas fa-book"></i> حفظ: ${escapeHtml(s.memorization || '-')}</span>
                <span><i class="fas fa-undo"></i> مراجعة: ${escapeHtml(s.review || '-')}</span>
                <span><i class="fas fa-star" style="color:var(--gold);"></i> ${s.rating ? getStars(s.rating) : '-'}</span>
                ${s.notes ? `<span><i class="fas fa-pen"></i> ${escapeHtml(s.notes)}</span>` : ''}
            </div>
            <div class="session-actions">
                <button class="btn btn-sm" onclick="editSessionFromAll(${s.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteSession(${s.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function clearSessionFilters() {
    document.getElementById('searchAllSessions').value = '';
    document.getElementById('filterSessionDate').value = '';
    document.getElementById('filterSessionMonth').value = '';
    renderAllSessions();
}// ============================================================
