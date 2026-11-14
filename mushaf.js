const MUSHAF_QURAN_URL = 'https://api.alquran.cloud/v1/quran/quran-uthmani';
const MUSHAF_TAFSIR_URL = 'https://api.alquran.cloud/v1/quran/ar.muyassar';
const MUSHAF_PAGE_COUNT = 604;

const mushafState = {
    pages: null,
    surahs: null,
    tafsir: null,
    currentPage: 1,
    showTafsir: false,
    quranRequest: null,
    tafsirRequest: null
};

async function fetchMushafEdition(url, label) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`تعذر تحميل ${label} (HTTP ${response.status}).`);

    const result = await response.json();
    if (result.code !== 200 || !result.data || !Array.isArray(result.data.surahs)) {
        throw new Error(`استجابة ${label} غير مكتملة.`);
    }
    return result.data;
}

function loadMushafQuran() {
    if (mushafState.pages) return Promise.resolve();
    if (mushafState.quranRequest) return mushafState.quranRequest;

    mushafState.quranRequest = fetchMushafEdition(MUSHAF_QURAN_URL, 'المصحف')
        .then(data => {
            if (data.surahs.length !== 114) throw new Error('لم تكتمل بيانات سور المصحف.');

            const pages = new Map();
            let ayahCount = 0;
            data.surahs.forEach(surah => {
                if (!Array.isArray(surah.ayahs)) throw new Error('بيانات إحدى سور المصحف غير مكتملة.');
                surah.ayahs.forEach(ayah => {
                    if (!Number.isInteger(ayah.page) || ayah.page < 1 || ayah.page > MUSHAF_PAGE_COUNT) {
                        throw new Error('ترقيم صفحات المصحف غير صالح.');
                    }
                    if (!pages.has(ayah.page)) pages.set(ayah.page, []);
                    pages.get(ayah.page).push({ ...ayah, surahNumber: surah.number, surahName: surah.name });
                    ayahCount++;
                });
            });
            if (ayahCount !== 6236 || pages.size !== MUSHAF_PAGE_COUNT) {
                throw new Error('لم تكتمل بيانات صفحات المصحف المدني.');
            }

            mushafState.pages = pages;
            mushafState.surahs = data.surahs;
            const select = document.getElementById('mushafSurahSelect');
            select.innerHTML = data.surahs.map(surah =>
                `<option value="${surah.number}">${escapeHtml(surah.name)}</option>`
            ).join('');
            document.getElementById('mushafPageInput').disabled = false;
            document.getElementById('mushafTafsirToggle').disabled = false;
            document.getElementById('mushafPrevPage').disabled = false;
            document.getElementById('mushafNextPage').disabled = false;
            select.disabled = false;
        })
        .catch(error => {
            mushafState.quranRequest = null;
            throw error;
        });

    return mushafState.quranRequest;
}

function loadMushafTafsir() {
    if (mushafState.tafsir) return Promise.resolve();
    if (mushafState.tafsirRequest) return mushafState.tafsirRequest;

    mushafState.tafsirRequest = fetchMushafEdition(MUSHAF_TAFSIR_URL, 'التفسير الميسر')
        .then(data => {
            const tafsir = new Map();
            data.surahs.forEach(surah => {
                if (!Array.isArray(surah.ayahs)) throw new Error('بيانات التفسير غير مكتملة.');
                surah.ayahs.forEach(ayah => tafsir.set(ayah.number, ayah.text));
            });
            if (tafsir.size !== 6236) throw new Error('لم تكتمل بيانات التفسير الميسر.');
            mushafState.tafsir = tafsir;
        })
        .catch(error => {
            mushafState.tafsirRequest = null;
            throw error;
        });

    return mushafState.tafsirRequest;
}

async function renderMushaf() {
    const status = document.getElementById('mushafStatus');
    status.textContent = 'جارٍ تحميل المصحف المدني...';
    try {
        await loadMushafQuran();
        renderMushafPage();
    } catch (error) {
        status.textContent = `${error.message} تحقق من اتصال الإنترنت ثم أعد فتح صفحة المصحف.`;
        showToast(error.message, 'error');
    }
}

function renderMushafPage() {
    const pageAyahs = mushafState.pages && mushafState.pages.get(mushafState.currentPage);
    if (!pageAyahs) return;

    const pageInput = document.getElementById('mushafPageInput');
    pageInput.value = mushafState.currentPage;
    document.getElementById('mushafSurahSelect').value = String(pageAyahs[0].surahNumber);
    document.getElementById('mushafPrevPage').disabled = mushafState.currentPage === 1;
    document.getElementById('mushafNextPage').disabled = mushafState.currentPage === MUSHAF_PAGE_COUNT;

    const groups = [];
    pageAyahs.forEach(ayah => {
        let group = groups[groups.length - 1];
        if (!group || group.surahNumber !== ayah.surahNumber) {
            group = { surahNumber: ayah.surahNumber, surahName: ayah.surahName, ayahs: [] };
            groups.push(group);
        }
        group.ayahs.push(ayah);
    });

    const content = groups.map(group => {
        const beginsSurah = group.ayahs[0].numberInSurah === 1;
        const basmala = beginsSurah && group.surahNumber !== 1 && group.surahNumber !== 9
            ? '<div class="mushaf-basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>'
            : '';
        const ayahs = group.ayahs.map(ayah => {
            const text = beginsSurah && group.surahNumber !== 1 && group.surahNumber !== 9 && ayah.numberInSurah === 1
                ? ayah.text.replace(/^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/, '')
                : ayah.text;
            const tafsir = mushafState.showTafsir
                ? `<div class="mushaf-tafsir"><strong>التفسير الميسر:</strong> ${escapeHtml(mushafState.tafsir.get(ayah.number) || 'لا يتوفر تفسير لهذه الآية.')}</div>`
                : '';
            return `<article class="mushaf-ayah">
                <p class="mushaf-ayah-text">${escapeHtml(text)} <span class="mushaf-ayah-number" aria-label="الآية ${ayah.numberInSurah}">${new Intl.NumberFormat('ar-EG').format(ayah.numberInSurah)}</span></p>
                ${tafsir}
            </article>`;
        }).join('');
        return `<section class="mushaf-surah">
            <h3 class="mushaf-surah-title"><span>۞</span> ${escapeHtml(group.surahName)} <span>۞</span></h3>
            ${basmala}${ayahs}
        </section>`;
    }).join('');

    document.getElementById('mushafContent').innerHTML = content;
    document.getElementById('mushafStatus').textContent =
        `صفحة ${new Intl.NumberFormat('ar-EG').format(mushafState.currentPage)} من ${new Intl.NumberFormat('ar-EG').format(MUSHAF_PAGE_COUNT)}`;
}

function changeMushafPage(offset) {
    if (!mushafState.pages) return;
    mushafState.currentPage = Math.min(MUSHAF_PAGE_COUNT, Math.max(1, mushafState.currentPage + offset));
    renderMushafPage();
}

async function toggleMushafTafsir() {
    const button = document.getElementById('mushafTafsirToggle');
    const status = document.getElementById('mushafStatus');
    if (mushafState.showTafsir) {
        mushafState.showTafsir = false;
        button.innerHTML = '<i class="fas fa-eye"></i> إظهار التفسير';
        button.setAttribute('aria-pressed', 'false');
        renderMushafPage();
        return;
    }

    button.disabled = true;
    status.textContent = 'جارٍ تحميل التفسير الميسر...';
    try {
        await loadMushafTafsir();
        mushafState.showTafsir = true;
        button.innerHTML = '<i class="fas fa-eye-slash"></i> إخفاء التفسير';
        button.setAttribute('aria-pressed', 'true');
        renderMushafPage();
    } catch (error) {
        status.textContent = error.message;
        showToast(error.message, 'error');
    } finally {
        button.disabled = false;
    }
}

document.getElementById('mushafSurahSelect').addEventListener('change', event => {
    const surah = mushafState.surahs && mushafState.surahs.find(item => item.number === Number(event.target.value));
    if (!surah || !surah.ayahs.length) return;
    mushafState.currentPage = surah.ayahs[0].page;
    renderMushafPage();
});

document.getElementById('mushafPageInput').addEventListener('change', event => {
    const page = Number(event.target.value);
    if (!Number.isInteger(page) || page < 1 || page > MUSHAF_PAGE_COUNT || !mushafState.pages.has(page)) {
        event.target.value = mushafState.currentPage;
        showToast('أدخل رقم صفحة من 1 إلى 604.', 'warning');
        return;
    }
    mushafState.currentPage = page;
    renderMushafPage();
});
