// STUDENT CRUD
// ============================================================
function openStudentModal(data = null) {
    document.getElementById('editStudentId').value = data ? data.id : '';
    document.getElementById('studentName').value = data ? data.name : '';
    document.getElementById('studentLevel').value = data ? (data.level || '') : '';
    document.getElementById('studentDetails').value = data ? (data.details || '') : '';
    document.getElementById('studentStartDate').value = data ? (data.startDate || '') : '';
    document.getElementById('studentModalTitle').innerText = data ? 'تعديل طالب' : 'إضافة طالب';
    document.getElementById('studentModal').classList.add('show');
}

function saveStudent() {
    const id = document.getElementById('editStudentId').value;
    const name = document.getElementById('studentName').value.trim();
    const level = document.getElementById('studentLevel').value.trim();
    const details = document.getElementById('studentDetails').value.trim();
    const startDate = document.getElementById('studentStartDate').value;
    if (!name) { showToast('يرجى إدخال اسم الطالب', 'error'); return; }
    const students = getStudents();
    if (id) {
        const idx = students.findIndex(s => s.id === parseInt(id));
        if (idx > -1) { students[idx] = { ...students[idx], name, level, details, startDate }; setStudents(students); showToast('تم تحديث الطالب', 'success'); }
    } else {
        students.push({ id: getNextId(STORAGE_KEYS.nextStudentId), name, level, details, startDate });
        setStudents(students);
        showToast('تم إضافة الطالب', 'success');
    }
    closeModal('studentModal');
    renderStudents(document.getElementById('searchStudent').value);
    renderDashboard();
}

function editStudent(id) { const s = getStudent(id); if (s) openStudentModal(s); }

function deleteStudent(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    setStudents(getStudents().filter(s => s.id !== id));
    setSessions(getSessions().filter(s => s.studentId !== id));
    renderStudents(document.getElementById('searchStudent').value);
    renderDashboard();
    showToast('تم حذف الطالب', 'success');
}

// ============================================================
// SESSION CRUD
// ============================================================
function openSessionModal(data = null) {
    if (!currentStudentId && !data) { showToast('اختر طالباً أولاً', 'error'); return; }
    const studentId = data ? data.studentId : currentStudentId;
    document.getElementById('sessionStudentId').value = studentId;
    document.getElementById('editSessionId').value = data ? data.id : '';
    document.getElementById('sessionDate').value = data ? data.date : getCurrentDate();
    document.getElementById('sessionMemorization').value = data ? (data.memorization || '') : '';
    document.getElementById('sessionReview').value = data ? (data.review || '') : '';
    document.getElementById('sessionRating').value = data ? (data.rating || '') : '';
    document.getElementById('sessionNotes').value = data ? (data.notes || '') : '';
    document.getElementById('sessionModalTitle').innerText = data ? 'تعديل حصة' : 'إضافة حصة جديدة';
    if (!data) showPreviousSessionData(studentId);
    else {
        document.getElementById('previousMemorizationBox').style.display = 'none';
        document.getElementById('previousReviewBox').style.display = 'none';
    }
    document.getElementById('sessionModal').classList.add('show');
}

function showPreviousSessionData(studentId) {
    const sessions = getSessionsForStudent(studentId);
    if (sessions.length === 0) {
        document.getElementById('previousMemorizationBox').style.display = 'none';
        document.getElementById('previousReviewBox').style.display = 'none';
        return;
    }
    const latest = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id)[0];
    if (latest.memorization) {
        document.getElementById('previousMemorizationContent').innerHTML = `${escapeHtml(latest.memorization)} <span style="font-weight:400;color:var(--text-secondary);font-size:14px;">(${formatDate(latest.date)})</span>`;
        document.getElementById('previousMemorizationBox').style.display = 'block';
    } else {
        document.getElementById('previousMemorizationBox').style.display = 'none';
    }
    if (latest.review) {
        document.getElementById('previousReviewContent').innerHTML = `${escapeHtml(latest.review)} <span style="font-weight:400;color:var(--text-secondary);font-size:14px;">(${formatDate(latest.date)})</span>`;
        document.getElementById('previousReviewBox').style.display = 'block';
    } else {
        document.getElementById('previousReviewBox').style.display = 'none';
    }
}

function saveSession() {
    const sessionId = document.getElementById('editSessionId').value;
    const studentId = parseInt(document.getElementById('sessionStudentId').value);
    const date = document.getElementById('sessionDate').value;
    const memorization = document.getElementById('sessionMemorization').value.trim();
    const review = document.getElementById('sessionReview').value.trim();
    const rating = document.getElementById('sessionRating').value;
    const notes = document.getElementById('sessionNotes').value.trim();
    if (!date) { showToast('يرجى اختيار التاريخ', 'error'); return; }
    const sessions = getSessions();
    if (sessionId) {
        const idx = sessions.findIndex(s => s.id === parseInt(sessionId));
        if (idx > -1) {
            sessions[idx] = { ...sessions[idx], date, time: sessions[idx].time || getCurrentTime(), memorization, review, rating: rating || '', notes };
            setSessions(sessions);
            showToast('تم تحديث الحصة', 'success');
        }
    } else {
        sessions.push({ id: getNextId(STORAGE_KEYS.nextSessionId), studentId, date, time: getCurrentTime(), memorization, review, rating: rating || '', notes });
        setSessions(sessions);
        showToast('تم إضافة الحصة', 'success');
    }
    closeModal('sessionModal');
    if (currentStudentId) renderStudentDetail(currentStudentId);
    renderDashboard();
    if (document.getElementById('page-all-sessions').classList.contains('active')) {
        renderAllSessions(document.getElementById('searchAllSessions').value, document.getElementById('filterSessionDate').value, document.getElementById('filterSessionMonth').value);
    }
}

function editSession(id) { const s = getSessions().find(x => x.id === id); if (s) { currentStudentId = s.studentId; openSessionModal(s); } }
function editSessionFromAll(id) { editSession(id); }

function deleteSession(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الحصة؟')) return;
    setSessions(getSessions().filter(s => s.id !== id));
    if (currentStudentId) renderStudentDetail(currentStudentId);
    renderDashboard();
    if (document.getElementById('page-all-sessions').classList.contains('active')) {
        renderAllSessions(document.getElementById('searchAllSessions').value, document.getElementById('filterSessionDate').value, document.getElementById('filterSessionMonth').value);
    }
    showToast('تم حذف الحصة', 'success');
}

// ============================================================
// EXPORT / IMPORT
// ============================================================
function exportJSON() {
    const data = {
        students: getStudents(), sessions: getSessions(), lessons: getLessons(), filesMeta: getFilesMeta(),
        nextStudentId: localStorage.getItem(STORAGE_KEYS.nextStudentId) || '1',
        nextSessionId: localStorage.getItem(STORAGE_KEYS.nextSessionId) || '1',
        nextLessonId: localStorage.getItem(NEXT_LESSON_ID) || '1',
        nextFileId: localStorage.getItem(NEXT_FILE_ID) || '1',
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `نسخ_احتياطي_عبير_هلال_${getCurrentDate()}.json`;
    a.click();
    showToast('تم تصدير النسخة الاحتياطية (JSON)', 'success');
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.students || !data.sessions) { showToast('ملف غير صالح', 'error'); return; }
            if (!confirm('سيتم استبدال البيانات الحالية. متابعة؟')) return;
            setStudents(data.students);
            setSessions(data.sessions);
            if (data.lessons) setLessons(data.lessons);
            if (data.filesMeta) setFilesMeta(data.filesMeta);
            if (data.nextStudentId) localStorage.setItem(STORAGE_KEYS.nextStudentId, data.nextStudentId);
            if (data.nextSessionId) localStorage.setItem(STORAGE_KEYS.nextSessionId, data.nextSessionId);
            if (data.nextLessonId) localStorage.setItem(NEXT_LESSON_ID, data.nextLessonId);
            if (data.nextFileId) localStorage.setItem(NEXT_FILE_ID, data.nextFileId);
            renderDashboard(); renderStudents(); renderLessons();
            showToast('تم استعادة البيانات بنجاح', 'success');
        } catch (err) { showToast('خطأ في قراءة الملف', 'error'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        s.onload = generateExcel;
        document.head.appendChild(s);
    } else generateExcel();
}

function generateExcel() {
    const sessions = getAllSessionsSorted();
    if (sessions.length === 0) { showToast('لا توجد حصص للتصدير', 'error'); return; }
    const data = sessions.map(s => ({
        'الطالب': getStudentName(s.studentId), 'التاريخ': formatDate(s.date), 'اليوم': getDayName(s.date),
        'الوقت': s.time || '', 'الحفظ': s.memorization || '', 'المراجعة': s.review || '', 'التقييم': s.rating || '', 'الملاحظات': s.notes || ''
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'الحصص');
    XLSX.writeFile(wb, `سجل_الحصص_${getCurrentDate()}.xlsx`);
    showToast('تم تصدير ملف Excel', 'success');
}

function clearAllData() {
    if (!confirm('⚠️ سيتم حذف جميع الطلاب والحصص والدروس والملفات نهائياً! هل أنت متأكد؟')) return;
    if (!confirm('تأكيد أخير: سيتم مسح كل البيانات!')) return;
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(LESSON_KEY);
    localStorage.removeItem(NEXT_LESSON_ID);
    localStorage.removeItem(FILES_META_KEY);
    localStorage.removeItem(NEXT_FILE_ID);
    localStorage.removeItem(BUILTIN_INSTALLED);
    const db = indexedDB.deleteDatabase(DB_NAME);
    db.onsuccess = () => { showToast('تم مسح كل البيانات', 'success'); location.reload(); };
    db.onerror = () => { showToast('تم مسح البيانات المحلية، لكن فشل مسح الملفات', 'warning'); location.reload(); };
}

// ============================================================
