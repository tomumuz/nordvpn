// 国コードと名前のマッピング（NordVPN対象国）
let COUNTRY_NAMES = {};
let NORDVPN_COUNTRIES = [];

let allData = [];

// DOM要素の取得
const extractHtmlBtn = document.getElementById('extractHtmlBtn');
const loadBtn = document.getElementById('loadBtn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const resultCountSpan = document.getElementById('resultCount');
const selectAllCheckbox = document.getElementById('selectAll');
const deselectAllCheckbox = document.getElementById('deselectAll');
const dataTimestampSpan = document.getElementById('dataTimestamp');

// ステータス表示
function setStatus(message, type = '') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

// データの更新日時を取得して表示（GitHub Pages版: 静的ファイルから読み込み）
async function updateDataTimestamp() {
    try {
        const response = await fetch('data/metadata.json');
        const metadata = await response.json();
        
        if (metadata.lastUpdated) {
            const date = new Date(metadata.lastUpdated);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            dataTimestampSpan.textContent = `${year}年${month}月${day}日 ${hours}時${minutes}分`;
            dataTimestampSpan.style.color = '#059669';
            dataTimestampSpan.style.fontWeight = '600';
        } else {
            dataTimestampSpan.textContent = 'データ未取得';
            dataTimestampSpan.style.color = '#dc2626';
            dataTimestampSpan.style.fontWeight = '600';
        }
    } catch (error) {
        console.error('タイムスタンプ取得エラー:', error);
        dataTimestampSpan.textContent = '不明';
        dataTimestampSpan.style.color = '#6b7280';
    }
}

// 保存済みデータを読み込み（GitHub Pages版: 静的ファイルから読み込み）
async function loadData() {
    setStatus('データを読み込み中...', 'loading');
    loadBtn.disabled = true;

    try {
        const response = await fetch('data/unogs-data.json');
        allData = await response.json();
        
        setStatus(`データ読み込み完了: ${allData.length}件`, 'success');
        // 年フィルターを初期化
        initializeYearFilters();
        applyFilters();
        // 更新日時を更新
        await updateDataTimestamp();
    } catch (error) {
        setStatus(`エラー: ${error.message}`, 'error');
        console.error('データ読み込みエラー:', error);
    } finally {
        loadBtn.disabled = false;
    }
}

// フィルター適用
function applyFilters() {
    const countryCheckboxes = document.querySelectorAll('.country-checkbox');
    const selectedCountries = Array.from(countryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    if (selectedCountries.length === 0) {
        resultsDiv.innerHTML = '<div class="empty-state"><h3>国を選択してください</h3></div>';
        resultCountSpan.textContent = '0';
        return;
    }

    // カテゴリフィルターを取得
    const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
    const selectedCategories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    // カテゴリが1つも選択されていない場合
    if (selectedCategories.length === 0) {
        resultsDiv.innerHTML = '<div class="empty-state"><h3>カテゴリを選択してください</h3></div>';
        resultCountSpan.textContent = '0';
        return;
    }

    // 年フィルターを取得
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    const startYear = startYearSelect ? parseInt(startYearSelect.value) : 1966;
    const endYear = endYearSelect ? parseInt(endYearSelect.value) : 2025;

    // 各選択された国に一致する作品を抽出（重複なし）
    const filteredResults = [];
    const seenIds = new Set();

    allData.forEach(item => {
        // カテゴリフィルター
        if (!selectedCategories.includes(item.category)) {
            return;
        }

        // 年フィルター
        const itemYear = parseInt(item.year);
        if (!isNaN(itemYear) && itemYear > 0) {
            if (itemYear < startYear || itemYear > endYear) {
                return;
            }
        }
        
        // 国情報が配列の場合
        if (Array.isArray(item.countries)) {
            // 日本（JP）を除く選択された国のいずれかで配信されているかチェック
            const hasSelectedCountry = item.countries.some(c => 
                c.code !== 'JP' && selectedCountries.includes(c.code)
            );
            
            if (hasSelectedCountry && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                filteredResults.push(item);
            }
        }
        // 国情報が文字列の場合
        else if (typeof item.countries === 'string') {
            // 日本（JP）を除く選択された国のいずれかが含まれているかチェック
            const hasSelectedCountry = selectedCountries.some(code => 
                code !== 'JP' && item.countries.includes(code)
            );
            
            if (hasSelectedCountry && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                filteredResults.push(item);
            }
        }
    });

    displayResults(filteredResults);
    resultCountSpan.textContent = filteredResults.length;
}

// タイプと年を日本語に変換
function formatTypeAndYear(item) {
    const typeMap = {
        'movie': '映画',
        'series': 'TVシリーズ',
        'tv': 'TVシリーズ',
        'film': '映画',
        'documentary': 'ドキュメンタリー',
        'short': '短編'
    };
    
    const type = typeMap[item.type?.toLowerCase()] || item.type || '不明';
    const year = item.year || '年不明';
    
    return `${type} / ${year}年`;
}

// モーダル表示
function showModal(item) {
    const modal = document.getElementById('detailModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalType = document.getElementById('modalType');
    const modalRating = document.getElementById('modalRating');
    const modalCountries = document.getElementById('modalCountries');
    const modalSynopsis = document.getElementById('modalSynopsis');
    
    // 画像
    const defaultImageUrl = 'https://via.placeholder.com/600x900/1a1a1a/ffffff?text=画像なし';
    // GitHub Pages用に絶対パスを相対パスに変換（/data/... → data/...）
    let imageUrl = item.imageUrl || defaultImageUrl;
    if (imageUrl.startsWith('/data/')) {
        imageUrl = imageUrl.substring(1); // 最初の'/'を削除
    }
    const fallbackImageUrl = `https://via.placeholder.com/600x900/a78bfa/ffffff?text=${encodeURIComponent(item.englishTitle || item.title).substring(0, 30).replace(/%20/g, '+')}`;
    modalImage.src = imageUrl;
    modalImage.onerror = function() {
        this.onerror = null;
        this.src = fallbackImageUrl;
    };
    // タイトル表示（英語（日本語）形式）
    let displayTitle = item.title;
    if (item.titleJa && item.titleJa !== item.title) {
        // タイトルから日本語部分を削除して英語部分のみを取得
        const englishOnly = item.title.replace(/\s*\([^\)]*[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf][^\)]*\)\s*$/, '').trim();
        displayTitle = `${englishOnly} (${item.titleJa})`;
    }
    modalImage.alt = displayTitle;
    
    // タイトル
    modalTitle.textContent = displayTitle;
    
    // タイプと年
    modalType.textContent = formatTypeAndYear(item);
    
    // 評価
    modalRating.textContent = item.rating ? `⭐ ${item.rating}` : '';
    
    // 国
    const countriesHtml = item.countries && item.countries.length > 0
        ? item.countries.map(c => 
            `<span class="country-badge">${c.name || COUNTRY_NAMES[c.code] || c.code}</span>`
        ).join('')
        : `<span class="country-badge">${item.filterCountryName || '不明'}</span>`;
    modalCountries.innerHTML = countriesHtml;
    
    // 概要（全文）- synopsisが元の完全なテキスト
    const synopsis = item.synopsisJaFull || item.synopsis || item.synopsisJapanese || '概要はありません。';
    modalSynopsis.textContent = synopsis;
    
    // モーダルを表示
    modal.style.display = 'block';
}

// モーダルを閉じる
function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.style.display = 'none';
}

// 結果を表示
function displayResults(results) {
    if (results.length === 0) {
        resultsDiv.innerHTML = '<div class="empty-state"><h3>該当する作品が見つかりませんでした</h3><p>フィルター条件を変更してください</p></div>';
        return;
    }

    // ジブリ映画のリスト
    const ghibliMovies = [
        'Spirited Away',
        'Princess Mononoke',
        'Howl\'s Moving Castle',
        'My Neighbor Totoro',
        'Kiki\'s Delivery Service',
        'Ponyo',
        'The Wind Rises',
        'Nausicaä of the Valley of the Wind',
        'Castle in the Sky',
        'Grave of the Fireflies',
        'The Secret World of Arrietty',
        'When Marnie Was There',
        'Whisper of the Heart',
        'From Up on Poppy Hill',
        'My Neighbors the Yamadas',
        'Ocean Waves',
        'Tales from Earthsea',
        'The Cat Returns',
        'Kaguyahime no monogatari'
    ];

    // ソート: ジブリ映画 → 評価順 → 年順
    results.sort((a, b) => {
        const aIsGhibli = ghibliMovies.includes(a.title);
        const bIsGhibli = ghibliMovies.includes(b.title);
        
        if (aIsGhibli && !bIsGhibli) return -1;
        if (!aIsGhibli && bIsGhibli) return 1;
        
        // 両方ジブリの場合は、リストの順番で
        if (aIsGhibli && bIsGhibli) {
            return ghibliMovies.indexOf(a.title) - ghibliMovies.indexOf(b.title);
        }
        
        // それ以外は評価順、次に年順
        if (a.rating && b.rating) {
            const ratingDiff = parseFloat(b.rating) - parseFloat(a.rating);
            if (ratingDiff !== 0) return ratingDiff;
        } else if (a.rating) {
            return -1;
        } else if (b.rating) {
            return 1;
        }
        
        return (b.year || 0) - (a.year || 0);
    });

    // 評価順に並び替え（評価が高い順）
    const sortedResults = [...results].sort((a, b) => {
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        if (ratingB !== ratingA) {
            return ratingB - ratingA; // 評価降順
        }
        // 評価が同じ場合は年順（新しい順）
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        return yearB - yearA;
    });

    resultsDiv.innerHTML = sortedResults.map((item, index) => {
        // 画像URLがない場合は、デフォルトのNetflix画像パターンを使用
        const defaultImageUrl = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=画像なし';
        // GitHub Pages用に絶対パスを相対パスに変換（/data/... → data/...）
        let imageUrl = item.imageUrl || defaultImageUrl;
        if (imageUrl.startsWith('/data/')) {
            imageUrl = imageUrl.substring(1); // 最初の'/'を削除
        }
        
        // 画像URLが無効な場合は、タイトルから検索用のプレースホルダーを生成
        const fallbackImageUrl = `https://via.placeholder.com/300x450/a78bfa/ffffff?text=${encodeURIComponent(item.englishTitle || item.title).substring(0, 30).replace(/%20/g, '+')}`;
        
        const imageHtml = `<img src="${imageUrl}" alt="${item.title}" onerror="this.onerror=null; this.src='${fallbackImageUrl}';">`;

        const countriesHtml = item.countries && item.countries.length > 0
            ? item.countries.map(c => 
                `<span class="country-badge">${c.name || COUNTRY_NAMES[c.code] || c.code}</span>`
            ).join('')
            : `<span class="country-badge">${item.filterCountryName || '不明'}</span>`;

        const typeAndYear = formatTypeAndYear(item);
        
        const ratingHtml = item.rating 
            ? `<div class="result-rating">⭐ ${item.rating}</div>` 
            : '';

        // 概要を表示（元データ synopsis から作成）
        const originalSynopsis = item.synopsis || '';
        let displaySynopsis = '';
        
        // 日本語文字を含むかチェック
        const hasJapaneseChar = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(originalSynopsis);
        
        if (hasJapaneseChar) {
            // 日本語の場合：13文字×2行 = 26文字
            if (originalSynopsis.length > 26) {
                displaySynopsis = originalSynopsis.substring(0, 23) + '...';
            } else {
                displaySynopsis = originalSynopsis;
            }
            // 13文字で改行
            if (displaySynopsis.length > 13) {
                const line1 = displaySynopsis.substring(0, 13);
                const line2 = displaySynopsis.substring(13);
                displaySynopsis = line1 + '\n' + line2;
            }
        } else {
            // 英語の場合：26文字×2行 = 52文字
            if (originalSynopsis.length > 52) {
                displaySynopsis = originalSynopsis.substring(0, 49) + '...';
            } else {
                displaySynopsis = originalSynopsis;
            }
            // 26文字で改行
            if (displaySynopsis.length > 26) {
                const line1 = displaySynopsis.substring(0, 26);
                const line2 = displaySynopsis.substring(26);
                displaySynopsis = line1 + '\n' + line2;
            }
        }
        
        const synopsisHtml = originalSynopsis ? 
            `<div class="result-synopsis">${escapeHtml(displaySynopsis)}</div>` : '';
        
        // タイトル表示（英語（日本語）形式）
        let displayTitle = item.title;
        if (item.titleJa && item.titleJa !== item.title) {
            // タイトルから日本語部分を削除して英語部分のみを取得
            const englishOnly = item.title.replace(/\s*\([^\)]*[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf][^\)]*\)\s*$/, '').trim();
            // 日本語タイトルがある場合は「英語（日本語）」形式
            displayTitle = `${englishOnly} (${item.titleJa})`;
        }
        
        return `
            <div class="result-card" data-index="${index}">
                <div class="result-image">
                    ${imageHtml}
                </div>
                <div class="result-info">
                    <div class="result-title">${escapeHtml(displayTitle)}</div>
                    <div class="result-meta">${typeAndYear}</div>
                    ${ratingHtml}
                    ${synopsisHtml}
                    <div class="result-countries">
                        ${countriesHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // カードにクリックイベントを追加
    document.querySelectorAll('.result-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            showModal(sortedResults[index]);
        });
    });
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 全て選択
function selectAllCountries() {
    const countryCheckboxes = document.querySelectorAll('.country-checkbox');
    countryCheckboxes.forEach(cb => {
        cb.checked = true;
    });
    
    // 一括選択チェックボックスもチェックする
    const selectAdTierNG = document.getElementById('selectAdTierNG');
    const selectAdTierOK = document.getElementById('selectAdTierOK');
    if (selectAdTierNG) selectAdTierNG.checked = true;
    if (selectAdTierOK) selectAdTierOK.checked = true;
    
    applyFilters();
}

// 全て解除
function deselectAllCountries() {
    const countryCheckboxes = document.querySelectorAll('.country-checkbox');
    countryCheckboxes.forEach(cb => {
        cb.checked = false;
    });
    
    // 一括選択チェックボックスも外す
    const selectAdTierNG = document.getElementById('selectAdTierNG');
    const selectAdTierOK = document.getElementById('selectAdTierOK');
    if (selectAdTierNG) selectAdTierNG.checked = false;
    if (selectAdTierOK) selectAdTierOK.checked = false;
    
    applyFilters();
}

// イベントリスナー
if (extractHtmlBtn) {
    extractHtmlBtn.style.display = 'none'; // GitHub Pages版では非表示
}
if (loadBtn) {
    loadBtn.addEventListener('click', loadData);
}

// 全て選択/解除のチェックボックス
selectAllCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        deselectAllCheckbox.checked = false;
        selectAllCountries();
    }
});

deselectAllCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        selectAllCheckbox.checked = false;
        deselectAllCountries();
    }
});

// 国のチェックボックスのイベントリスナーは動的に生成時に追加される（generateCountryFilters関数内）

// カテゴリフィルターの全選択/全解除
const selectAllCategoriesCheckbox = document.getElementById('selectAllCategories');
const deselectAllCategoriesCheckbox = document.getElementById('deselectAllCategories');

if (selectAllCategoriesCheckbox) {
    selectAllCategoriesCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            deselectAllCategoriesCheckbox.checked = false;
            const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
            categoryCheckboxes.forEach(cb => cb.checked = true);
            applyFilters();
        }
    });
}

if (deselectAllCategoriesCheckbox) {
    deselectAllCategoriesCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            selectAllCategoriesCheckbox.checked = false;
            const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
            categoryCheckboxes.forEach(cb => cb.checked = false);
            applyFilters();
        }
    });
}

// カテゴリのチェックボックス
document.querySelectorAll('.category-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
        const allChecked = Array.from(categoryCheckboxes).every(cb => cb.checked);
        const noneChecked = Array.from(categoryCheckboxes).every(cb => !cb.checked);
        
        if (selectAllCategoriesCheckbox) selectAllCategoriesCheckbox.checked = allChecked;
        if (deselectAllCategoriesCheckbox) deselectAllCategoriesCheckbox.checked = noneChecked;
        
        applyFilters();
    });
});

// 年フィルター用のプルダウンを初期化
function initializeYearFilters() {
    if (!allData || allData.length === 0) return;
    
    // 全作品の年を抽出
    const years = allData
        .map(w => parseInt(w.year))
        .filter(y => !isNaN(y) && y > 0);
    
    if (years.length === 0) return;
    
    const uniqueYears = [...new Set(years)].sort((a, b) => a - b);
    const minYear = Math.min(...uniqueYears);
    const maxYear = Math.max(...uniqueYears);
    
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    if (!startYearSelect || !endYearSelect) return;
    
    // 開始年のプルダウンを生成
    startYearSelect.innerHTML = '';
    uniqueYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '年';
        if (year === minYear) option.selected = true;
        startYearSelect.appendChild(option);
    });
    
    // 終了年のプルダウンを生成
    endYearSelect.innerHTML = '';
    uniqueYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '年';
        if (year === maxYear) option.selected = true;
        endYearSelect.appendChild(option);
    });
    
    // イベントリスナーを追加
    startYearSelect.addEventListener('change', () => {
        const startYear = parseInt(startYearSelect.value);
        const endYear = parseInt(endYearSelect.value);
        
        // 開始年が終了年より新しい場合、終了年を開始年と同じにする
        if (startYear > endYear) {
            endYearSelect.value = startYear;
        }
        
        applyFilters();
    });
    
    endYearSelect.addEventListener('change', () => {
        const startYear = parseInt(startYearSelect.value);
        const endYear = parseInt(endYearSelect.value);
        
        // 終了年が開始年より古い場合、開始年を終了年と同じにする
        if (endYear < startYear) {
            startYearSelect.value = endYear;
        }
        
        applyFilters();
    });
}

// ページ読み込み時に保存済みデータを自動読み込み
window.addEventListener('DOMContentLoaded', async () => {
    // NordVPN対象国を読み込んで国フィルターを生成
    await loadNordVPNCountries();
    
    // データを読み込み
    loadData();
    
    // モーダルのクローズボタン
    const modal = document.getElementById('detailModal');
    const closeBtn = document.querySelector('.modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // モーダルの外側をクリックしたら閉じる
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
});

// NordVPN対象国リストを読み込んで国フィルターを生成（GitHub Pages版: 静的データ）
async function loadNordVPNCountries() {
    try {
        // Netflix広告つきプランNG（20カ国）- 地域ごとに分類
        const adTierNG = {
            asiapacific: {
                name: 'アジア太平洋',
                countries: [
                    { code: 'HK', name: '香港' },
                    { code: 'TH', name: 'タイ' },
                    { code: 'SG', name: 'シンガポール' },
                    { code: 'IN', name: 'インド' },
                    { code: 'PH', name: 'フィリピン' }
                ]
            },
            europe: {
                name: 'ヨーロッパ',
                countries: [
                    { code: 'BE', name: 'ベルギー' },
                    { code: 'CZ', name: 'チェコ' },
                    { code: 'GR', name: 'ギリシャ' },
                    { code: 'NL', name: 'オランダ' },
                    { code: 'PL', name: 'ポーランド' },
                    { code: 'PT', name: 'ポルトガル' },
                    { code: 'RO', name: 'ルーマニア' },
                    { code: 'SK', name: 'スロバキア' },
                    { code: 'SE', name: 'スウェーデン' },
                    { code: 'CH', name: 'スイス' },
                    { code: 'UA', name: 'ウクライナ' }
                ]
            },
            africamiddleeast: {
                name: 'アフリカ・中近東',
                countries: [
                    { code: 'IL', name: 'イスラエル' },
                    { code: 'TR', name: 'トルコ' },
                    { code: 'ZA', name: '南アフリカ' }
                ]
            },
            americas: {
                name: '南北アメリカ',
                countries: [
                    { code: 'AR', name: 'アルゼンチン' }
                ]
            }
        };

        // Netflix広告なしプランOK（16カ国）- 地域ごとに分類
        const adTierOK = {
            americas: {
                name: '南北アメリカ',
                countries: [
                    { code: 'US', name: '米国' },
                    { code: 'CA', name: 'カナダ' },
                    { code: 'CO', name: 'コロンビア' },
                    { code: 'MX', name: 'メキシコ' },
                    { code: 'BR', name: 'ブラジル' }
                ]
            },
            europe: {
                name: 'ヨーロッパ',
                countries: [
                    { code: 'DE', name: 'ドイツ' },
                    { code: 'GB', name: '英国' },
                    { code: 'FR', name: 'フランス' },
                    { code: 'IT', name: 'イタリア' },
                    { code: 'HU', name: 'ハンガリー' },
                    { code: 'IS', name: 'アイスランド' },
                    { code: 'LT', name: 'リトアニア' },
                    { code: 'ES', name: 'スペイン' }
                ]
            },
            asiapacific: {
                name: 'アジア太平洋',
                countries: [
                    { code: 'MY', name: 'マレーシア' },
                    { code: 'AU', name: 'オーストラリア' },
                    { code: 'KR', name: '韓国' }
                ]
            }
        };
        
        // COUNTRY_NAMESマッピングを作成
        COUNTRY_NAMES = {};
        [adTierNG, adTierOK].forEach(group => {
            Object.values(group).forEach(region => {
                region.countries.forEach(country => {
                    COUNTRY_NAMES[country.code] = country.name;
                });
            });
        });
        
        // 国フィルターUIを2グループに分けて生成
        generateCountryFilters(adTierNG, adTierOK);
        
        console.log(`✅ NordVPN対象国を読み込みました: 36カ国`);
    } catch (error) {
        console.error('NordVPN対象国の読み込みエラー:', error);
    }
}

// 2グループに分けて国フィルターを生成
function generateCountryFilters(adTierNG, adTierOK) {
    // Netflix広告つきプランNG
    const adTierNGContainer = document.getElementById('adTierNGContainer');
    if (adTierNGContainer) {
        generateGroupFilters(adTierNGContainer, adTierNG, 'ad-tier-ng');
    }
    
    // Netflix広告なしプランOK
    const adTierOKContainer = document.getElementById('adTierOKContainer');
    if (adTierOKContainer) {
        generateGroupFilters(adTierOKContainer, adTierOK, 'ad-tier-ok');
    }
    
    // まとめてチェックボタンのイベントリスナー
    setupGroupCheckboxListeners();
}

// グループごとの国フィルターを生成
function generateGroupFilters(container, regions, groupClass) {
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
    container.style.gap = '10px';
    
    const regionOrder = ['americas', 'europe', 'asiapacific', 'africamiddleeast'];
    
    regionOrder.forEach(regionKey => {
        const region = regions[regionKey];
        if (!region || !region.countries || region.countries.length === 0) return;
        
        const regionHeader = document.createElement('div');
        regionHeader.style.gridColumn = '1 / -1';
        regionHeader.style.background = 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)';
        regionHeader.style.color = 'white';
        regionHeader.style.padding = '10px 15px';
        regionHeader.style.borderRadius = '8px';
        regionHeader.style.fontWeight = 'bold';
        regionHeader.style.marginTop = '10px';
        regionHeader.textContent = `${region.name} (${region.countries.length})`;
        container.appendChild(regionHeader);
        
        region.countries.forEach(country => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = `country-checkbox ${groupClass}-checkbox`;
            checkbox.value = country.code;
            checkbox.checked = true;
            checkbox.addEventListener('change', () => {
                applyFilters();
                updateGroupCheckboxState(groupClass);
            });
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${country.name}`));
            container.appendChild(label);
        });
    });
}

// グループの一括選択チェックボックスの状態を更新
function updateGroupCheckboxState(groupClass) {
    const checkboxes = document.querySelectorAll(`.${groupClass}-checkbox`);
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    if (groupClass === 'ad-tier-ng') {
        const selectAdTierNG = document.getElementById('selectAdTierNG');
        if (selectAdTierNG) {
            selectAdTierNG.checked = allChecked;
        }
    } else if (groupClass === 'ad-tier-ok') {
        const selectAdTierOK = document.getElementById('selectAdTierOK');
        if (selectAdTierOK) {
            selectAdTierOK.checked = allChecked;
        }
    }
}

// まとめてチェックボタンのイベントリスナーを設定
function setupGroupCheckboxListeners() {
    // Netflix広告つきプランNG
    const selectAdTierNG = document.getElementById('selectAdTierNG');
    if (selectAdTierNG) {
        selectAdTierNG.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.ad-tier-ng-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
            applyFilters();
        });
    }
    
    // Netflix広告なしプランOK
    const selectAdTierOK = document.getElementById('selectAdTierOK');
    if (selectAdTierOK) {
        selectAdTierOK.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.ad-tier-ok-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
            applyFilters();
        });
    }
}

// 旧フォールバック関数（削除予定）
function generateCountryFiltersOld(countries) {
    const container = document.getElementById('countryFiltersContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    countries.forEach(country => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.style.fontSize = '13px';
        label.style.padding = '8px 12px';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'country-checkbox';
        checkbox.value = country.code;
        checkbox.checked = true;
        
        // チェックボックス変更時にフィルターを適用 + 全選択/全解除の状態を更新
        checkbox.addEventListener('change', () => {
            const countryCheckboxes = document.querySelectorAll('.country-checkbox');
            const allChecked = Array.from(countryCheckboxes).every(cb => cb.checked);
            const noneChecked = Array.from(countryCheckboxes).every(cb => !cb.checked);
            
            selectAllCheckbox.checked = allChecked;
            deselectAllCheckbox.checked = noneChecked;
            
            applyFilters();
        });
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${country.name}`));
        container.appendChild(label);
    });
    
    console.log(`✅ 国フィルターを生成しました: ${countries.length}カ国`);
}

