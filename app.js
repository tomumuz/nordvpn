// 国コードと名前のマッピング
const COUNTRY_NAMES = {
    'US': 'アメリカ',
    'NL': 'オランダ',
    'CH': 'スイス',
    'DE': 'ドイツ',
    'FI': 'フィンランド',
    'FR': 'フランス',
    'GB': '英国'
};

// 作品IDの高速検索用インデックス
let workIdIndex = new Map();

// 現在表示中の作品ID（シェア用）
let currentWorkId = null;

// 現在の検索クエリ
let currentSearchQuery = '';

// 作品IDの履歴管理（localStorage）
const WorkIdHistory = {
    STORAGE_KEY: 'nordvpn_work_id_history',
    
    // 履歴を取得
    getHistory() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('履歴の読み込みに失敗:', e);
            return {};
        }
    },
    
    // 履歴を保存
    saveHistory(history) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('履歴の保存に失敗:', e);
        }
    },
    
    // 作品の一意キーを生成（タイトル+年+カテゴリ）
    getItemKey(item) {
        const title = item.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        const year = item.year || 'unknown';
        const category = item.category || 'unknown';
        return `${title}::${year}::${category}`;
    },
    
    // 履歴からIDを取得
    getId(item) {
        const history = this.getHistory();
        const key = this.getItemKey(item);
        return history[key];
    },
    
    // 履歴にIDを保存
    setId(item, workId) {
        const history = this.getHistory();
        const key = this.getItemKey(item);
        history[key] = workId;
        this.saveHistory(history);
    }
};

// Netflix広告つきプランNGの国（20カ国）
const AD_TIER_NG_COUNTRIES = [
    'Argentina', 'Belgium', 'Czech Republic', 'Greece', 'Hong Kong', 'India', 'Israel',
    'Netherlands', 'Philippines', 'Poland', 'Portugal', 'Romania', 'Singapore',
    'Slovakia', 'South Africa', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'Ukraine',
    'アルゼンチン', 'ベルギー', 'チェコ', 'ギリシャ', '香港', 'インド', 'イスラエル',
    'オランダ', 'フィリピン', 'ポーランド', 'ポルトガル', 'ルーマニア', 'シンガポール',
    'スロバキア', '南アフリカ', 'スウェーデン', 'スイス', 'タイ', 'トルコ', 'ウクライナ'
];

// Netflix広告なしプランOKの国（16カ国）
const AD_TIER_OK_COUNTRIES = [
    'Australia', 'Brazil', 'Canada', 'Colombia', 'France', 'Germany', 'Hungary',
    'Iceland', 'Italy', 'Lithuania', 'Malaysia', 'Mexico', 'South Korea', 'Spain',
    'United Kingdom', 'United States',
    'オーストラリア', 'ブラジル', 'カナダ', 'コロンビア', 'フランス', 'ドイツ', 'ハンガリー',
    'アイスランド', 'イタリア', 'リトアニア', 'マレーシア', 'メキシコ', '韓国', 'スペイン',
    '英国', '米国', 'アメリカ'
];

// 国名に基づいてバッジの背景色を取得
function getCountryBadgeColor(countryName) {
    if (AD_TIER_NG_COUNTRIES.includes(countryName)) {
        return '#ff6b6b'; // 一括選択NGと同じ赤
    } else if (AD_TIER_OK_COUNTRIES.includes(countryName)) {
        return '#4caf50'; // 一括選択OKと同じ緑
    }
    return '#a78bfa'; // デフォルト（紫）
}

// 特別カテゴリのリスト
const SPECIAL_CATEGORIES = {
    'ghibli': {
        name: 'スタジオジブリ',
        movies: [
            'Spirited Away',
            'Princess Mononoke',
            'Howl\u2019s Moving Castle',
            'My Neighbor Totoro',
            'Kiki\u2019s Delivery Service',
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
            'Kaguyahime no monogatari',
            'Porco Rosso',
            'Only Yesterday',
            'Pom Poko',
            'The Boy and the Heron',
            'Earwig and the Witch',
            'The Red Turtle'
        ]
    },
    'conan': {
        name: '名探偵コナン',
        movies: [
            'Detective Conan : The Time-Bombed Skyscraper',
            'Detective Conan : The Fourteenth Target',
            'Detective Conan : The Last Wizard of the Century',
            'Detective Conan : Captured in Her Eyes',
            'Detective Conan : Countdown to Heaven',
            'Detective Conan : The Phantom of Baker Street',
            'Detective Conan : Crossroad in the Ancient Capital',
            'Detective Conan : Magician of the Silver Sky',
            'Detective Conan : Strategy Above the Depths',
            'Detective Conan : The Private Eyes\' Requiem',
            'Detective Conan : Jolly Roger in the Deep Azure',
            'Detective Conan : Full Score of Fear',
            'Detective Conan : The Raven Chaser',
            'Detective Conan : The Lost Ship in The Sky',
            'Detective Conan : Quarter of Silence',
            'Detective Conan : The Eleventh Striker',
            'Detective Conan : Private Eye in the Distant Sea',
            'Detective Conan : Dimensional Sniper',
            'Detective Conan : Sunflowers of Inferno',
            'Detective Conan : The Darkest Nightmare',
            'Detective Conan : The Crimson Love Letter',
            'Detective Conan : Zero The Enforcer',
            'Detective Conan : The Fist of Blue Sapphire',
            'Detective Conan : The Scarlet Bullet',
            'Detective Conan : The Bride of Halloween',
            'Detective Conan : Black Iron Submarine'
        ]
    },
    'onepiece': {
        name: 'ワンピース',
        movies: [
            'One Piece: Episode of Alabasta',
            'One Piece: Episode of Chopper: Bloom in the Winter, Miracle Sakura',
            'One Piece Film: Strong World',
            'One Piece Film Z',
            'One Piece: 3D2Y - Overcome Ace\'s Death! Luffy\'s Vow to His Friends',
            'One Piece Adventure of Nebulandia',
            'One Piece Heart of Gold',
            'One Piece Film: Gold',
            'One Piece Episode of East blue - Luffy and His Four Crewmates\' Great Adventure',
            'One Piece Episode of Skypiea',
            'One Piece Stampede',
            'One Piece Film: Red'
        ]
    },
    'naruto': {
        name: 'NARUTO',
        movies: [
            'Naruto the Movie: Ninja Clash in the Land of Snow',
            'Naruto the Movie 2: Legend of the Stone of Gelel',
            'Naruto the Movie 3: Guardians of the Crescent Moon Kingdom',
            'Naruto Shippuden: The Movie',
            'Naruto Shippuden The Movie: Bonds',
            'Naruto Shippuden the Movie: The Will of Fire',
            'Naruto Shippuden: The Movie: The Lost Tower',
            'Naruto Shippuden : Blood Prison',
            'Road to Ninja: Naruto the Movie',
            'The Last: Naruto the Movie',
            'Boruto: Naruto the Movie'
        ]
    }
};

let allData = [];

// URLパラメータからフィルター状態を読み込むフラグ
let isInitialLoad = true;

// DOM要素の取得
const extractHtmlBtn = document.getElementById('extractHtmlBtn');
const loadBtn = document.getElementById('loadBtn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const resultCountSpan = document.getElementById('resultCount');
const countryCheckboxes = document.querySelectorAll('.country-checkbox');
const selectAllCheckbox = document.getElementById('selectAll');
const deselectAllCheckbox = document.getElementById('deselectAll');
const dataTimestampSpan = document.getElementById('dataTimestamp');

// ステータス表示
function setStatus(message, type = '') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

// URLパラメータにフィルター状態を保存
function saveFiltersToURL() {
    const params = new URLSearchParams();
    
    // 国フィルター
    const selectedCountries = Array.from(document.querySelectorAll('.country-checkbox'))
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    const allCheckboxes = document.querySelectorAll('.country-checkbox');
    if (selectedCountries.length > 0 && selectedCountries.length < allCheckboxes.length) {
        params.set('countries', selectedCountries.join(','));
    }
    
    // カテゴリフィルター
    const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
    const selectedCategories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    if (selectedCategories.length > 0 && selectedCategories.length < categoryCheckboxes.length) {
        params.set('categories', selectedCategories.join(','));
    }
    
    // 年フィルター
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    if (startYearSelect && endYearSelect) {
        const startYear = startYearSelect.value;
        const endYear = endYearSelect.value;
        if (startYear) params.set('startYear', startYear);
        if (endYear) params.set('endYear', endYear);
    }
    
    // 特別カテゴリフィルター（URLパラメータから直接取得して保持）
    const currentParams = new URLSearchParams(window.location.search);
    const specialParam = currentParams.get('special');
    if (specialParam) {
        params.set('special', specialParam);
    }
    
    // 検索クエリ
    if (currentSearchQuery) {
        params.set('search', currentSearchQuery);
    }
    
    // URLを更新（ページをリロードしない）
    const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newURL);
}

// 特別カテゴリパラメータをリセット
function resetSpecialCategory() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('special')) {
        params.delete('special');
        const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', newURL);
    }
}

// 一括選択チェックボックスの状態を更新
function updateBulkSelectionCheckboxes() {
    // Netflix広告つきプランNG
    const selectAdTierNG = document.getElementById('selectAdTierNG');
    if (selectAdTierNG) {
        const adTierNGCheckboxes = document.querySelectorAll('#adTierNGContainer .country-checkbox');
        const allChecked = adTierNGCheckboxes.length > 0 && 
            Array.from(adTierNGCheckboxes).every(cb => cb.checked);
        selectAdTierNG.checked = allChecked;
    }
    
    // Netflix広告なしプランOK
    const selectAdTierOK = document.getElementById('selectAdTierOK');
    if (selectAdTierOK) {
        const adTierOKCheckboxes = document.querySelectorAll('#adTierOKContainer .country-checkbox');
        const allChecked = adTierOKCheckboxes.length > 0 && 
            Array.from(adTierOKCheckboxes).every(cb => cb.checked);
        selectAdTierOK.checked = allChecked;
    }
}

// URLパラメータからフィルター状態を復元
function loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    // 特別カテゴリが指定されている場合の処理
    const specialParam = params.get('special');
    
    // 国フィルター
    const countriesParam = params.get('countries');
    if (countriesParam) {
        const selectedCountries = countriesParam.split(',');
        const allCheckboxes = document.querySelectorAll('.country-checkbox');
        allCheckboxes.forEach(cb => {
            cb.checked = selectedCountries.includes(cb.value);
        });
        
        // 一括選択チェックボックスの状態を更新
        updateBulkSelectionCheckboxes();
        
        // 全て選択チェックボックスの状態を更新
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            const allChecked = allCheckboxes.length > 0 && 
                Array.from(allCheckboxes).every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
        }
    }
    
    // カテゴリフィルター
    const categoriesParam = params.get('categories');
    if (categoriesParam) {
        const selectedCategories = categoriesParam.split(',');
        const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
        categoryCheckboxes.forEach(cb => {
            cb.checked = selectedCategories.includes(cb.value);
        });
        
        // カテゴリの全て選択チェックボックスの状態を更新
        const selectAllCategoriesCheckbox = document.getElementById('selectAllCategories');
        if (selectAllCategoriesCheckbox) {
            const allChecked = categoryCheckboxes.length > 0 && 
                Array.from(categoryCheckboxes).every(cb => cb.checked);
            selectAllCategoriesCheckbox.checked = allChecked;
        }
    } else if (specialParam && SPECIAL_CATEGORIES[specialParam]) {
        // 特別カテゴリが指定されている場合は「日本の映画(アニメ)」のみをチェック
        const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
        categoryCheckboxes.forEach(cb => {
            cb.checked = (cb.value === '日本の映画(アニメ)');
        });
        
        // カテゴリの全て選択チェックボックスは外す
        const selectAllCategoriesCheckbox = document.getElementById('selectAllCategories');
        if (selectAllCategoriesCheckbox) {
            selectAllCategoriesCheckbox.checked = false;
        }
    }
    
    // 年フィルター（データ読み込み後に設定）
    const startYear = params.get('startYear');
    const endYear = params.get('endYear');
    if (startYear || endYear) {
        // データが読み込まれた後に年フィルターを設定
        setTimeout(() => {
            const startYearSelect = document.getElementById('startYearSelect');
            const endYearSelect = document.getElementById('endYearSelect');
            if (startYearSelect && startYear) {
                startYearSelect.value = startYear;
            }
            if (endYearSelect && endYear) {
                endYearSelect.value = endYear;
            }
        }, 100);
    }
    
    // 検索クエリの復元
    const searchQuery = params.get('search');
    if (searchQuery) {
        const searchBox = document.getElementById('searchBox');
        const clearButton = document.getElementById('clearSearch');
        if (searchBox) {
            searchBox.value = searchQuery;
            currentSearchQuery = searchQuery;
            if (clearButton) {
                clearButton.style.display = 'block';
            }
        }
    }
}

// URLのworkパラメータから作品を検索してモーダル表示
function loadWorkFromURL() {
    const params = new URLSearchParams(window.location.search);
    const workId = params.get('work');
    
    if (workId && allData && allData.length > 0) {
        // まずworkIdIndexから検索
        let item = workIdIndex.get(workId);
        
        if (!item) {
            // workIdをパースして作品情報を抽出
            const parsed = parseWorkId(workId);
            
            if (parsed) {
                // タイトルの部分一致で検索（ハイフンもスペースに統一）
                const titleForSearch = parsed.title.replace(/-/g, ' ');
                const candidates = allData.filter(candidate => {
                    const candidateTitle = candidate.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ');
                    return candidateTitle.includes(titleForSearch) || titleForSearch.includes(candidateTitle);
                });
                
                // 年とメディアタイプでさらに絞り込み
                for (const candidate of candidates) {
                    if (!candidate._workId) {
                        candidate._workId = generateWorkId(candidate, allData);
                    }
                    if (candidate._workId === workId) {
                        item = candidate;
                        workIdIndex.set(workId, item);
                        break;
                    }
                }
                
                if (item) {
                    showModal(item);
                } else {
                    showNotFoundModal(workId);
                }
            } else {
                console.log('✗ workIdのパースに失敗しました');
                showNotFoundModal(workId);
            }
        } else {
            showModal(item);
        }
    }
}

// 環境判定: GitHub Pagesかどうか（preview-docsもGitHub Pages扱い）
const IS_GITHUB_PAGES = window.location.hostname.includes('github.io') || window.location.port === '3041';

// データの更新日時を取得して表示
async function updateDataTimestamp() {
    try {
        let result;
        if (IS_GITHUB_PAGES) {
            // GitHub Pages: metadata.jsonから読み込み
            const response = await fetch('data/metadata.json');
            if (!response.ok) {
                throw new Error(`metadata.json取得失敗: ${response.status}`);
            }
            const metadata = await response.json();
            result = { success: true, timestamp: metadata.lastUpdated };
        } else {
            // サーバ版: APIエンドポイントから取得
            const response = await fetch('/api/data-timestamp');
            if (!response.ok) {
                throw new Error(`タイムスタンプAPI失敗: ${response.status}`);
            }
            result = await response.json();
        }
        
        if (result.success && result.timestamp) {
            const date = new Date(result.timestamp);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            dataTimestampSpan.textContent = `${year}年${month}月${day}日 ${hours}時${minutes}分`;
            dataTimestampSpan.style.color = '#059669';
            dataTimestampSpan.style.fontWeight = '600';
        } else if (!result.hasData) {
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

// HTMLから抽出
async function extractFromHTML() {
    setStatus('HTMLからデータを抽出中... しばらくお待ちください（大量データの場合は数分かかります）', 'loading');
    extractHtmlBtn.disabled = true;

    try {
        const response = await fetch('/api/extract-html', {
            signal: AbortSignal.timeout(300000) // 5分のタイムアウト
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || `サーバーエラー: ${response.status} ${response.statusText}`);
        }

        if (result.success && result.data && Array.isArray(result.data)) {
            allData = result.data;
            setStatus(`データ抽出完了: ${allData.length}件`, 'success');
            // 年フィルターを初期化
            initializeYearFilters();
            applyFilters();
            // データ抽出成功後、ボタン表示を更新
            extractHtmlBtn.style.display = 'none';
            loadBtn.style.display = 'inline-block';
            // 更新日時を更新
            await updateDataTimestamp();
        } else {
            setStatus(`エラー: ${result.error || '不明なエラー'}`, 'error');
            allData = []; // allDataを空配列に初期化
        }
    } catch (error) {
        if (error.name === 'TimeoutError') {
            setStatus('エラー: タイムアウトしました。データ量が多すぎる可能性があります。', 'error');
        } else {
            setStatus(`エラー: ${error.message}`, 'error');
        }
        console.error('データ抽出エラー:', error);
        allData = []; // allDataを空配列に初期化
    } finally {
        extractHtmlBtn.disabled = false;
    }
}

// 全量データ取得（使用しない - コメントアウト）
/*
async function fetchAllDataFromAPI() {
    setStatus('全量データを取得中... 数分かかる場合があります', 'loading');
    extractHtmlBtn.disabled = true;

    try {
        const response = await fetch('/api/fetch-all');
        const result = await response.json();

        if (result.success) {
            allData = result.data;
            setStatus(`データ取得完了: ${allData.length}件`, 'success');
            applyFilters();
        } else {
            setStatus(`エラー: ${result.error}`, 'error');
        }
    } catch (error) {
        setStatus(`エラー: ${error.message}`, 'error');
        console.error('データ取得エラー:', error);
    } finally {
        extractHtmlBtn.disabled = false;
    }
}
*/

// データ取得（API）
async function fetchDataFromAPI() {
    setStatus('データを取得中（API）... しばらくお待ちください', 'loading');
    // fetchAllBtn.disabled = true;
    // fetchApiBtn.disabled = true;
    // fetchBtn.disabled = true;
    // fetchPuppeteerBtn.disabled = true;

    try {
        const response = await fetch('/api/fetch-api');
        const result = await response.json();

        if (result.success) {
            allData = result.data;
            setStatus(`データ取得完了: ${allData.length}件`, 'success');
            applyFilters();
        } else {
            setStatus(`エラー: ${result.error}`, 'error');
        }
    } catch (error) {
        setStatus(`エラー: ${error.message}`, 'error');
        console.error('データ取得エラー:', error);
    } finally {
        // fetchAllBtn.disabled = false;
        // fetchApiBtn.disabled = false;
        // fetchBtn.disabled = false;
        // fetchPuppeteerBtn.disabled = false;
    }
}

// データ取得（通常）
async function fetchData() {
    setStatus('データを取得中...', 'loading');
    // fetchAllBtn.disabled = true;
    // fetchApiBtn.disabled = true;
    // fetchBtn.disabled = true;
    // fetchPuppeteerBtn.disabled = true;

    try {
        const response = await fetch('/api/fetch');
        const result = await response.json();

        if (result.success) {
            allData = result.data;
            setStatus(`データ取得完了: ${allData.length}件`, 'success');
            applyFilters();
        } else {
            setStatus(`エラー: ${result.error}`, 'error');
        }
    } catch (error) {
        setStatus(`エラー: ${error.message}`, 'error');
        console.error('データ取得エラー:', error);
    } finally {
        // fetchAllBtn.disabled = false;
        // fetchApiBtn.disabled = false;
        // fetchBtn.disabled = false;
        // fetchPuppeteerBtn.disabled = false;
    }
}

// データ取得（Puppeteer）
async function fetchDataWithPuppeteer() {
    setStatus('データを取得中（Puppeteer）...', 'loading');
    // fetchAllBtn.disabled = true;
    // fetchApiBtn.disabled = true;
    // fetchBtn.disabled = true;
    // fetchPuppeteerBtn.disabled = true;

    try {
        const response = await fetch('/api/fetch-puppeteer');
        const result = await response.json();

        if (result.success) {
            allData = result.data;
            setStatus(`データ取得完了: ${allData.length}件`, 'success');
            applyFilters();
        } else {
            setStatus(`エラー: ${result.error}`, 'error');
        }
    } catch (error) {
        setStatus(`エラー: ${error.message}`, 'error');
        console.error('データ取得エラー:', error);
    } finally {
        // fetchAllBtn.disabled = false;
        // fetchApiBtn.disabled = false;
        // fetchBtn.disabled = false;
        // fetchPuppeteerBtn.disabled = false;
    }
}

// 保存済みデータを読み込み
async function loadData() {
    setStatus('データを読み込み中...', 'loading');
    loadBtn.disabled = true;

    try {
        let result;
        if (IS_GITHUB_PAGES) {
            // GitHub Pages: 静的ファイルから読み込み
            const response = await fetch('data/unogs-data.json');
            if (!response.ok) {
                throw new Error(`データファイル取得失敗: ${response.status}`);
            }
            const data = await response.json();
            result = { success: true, data: data };
        } else {
            // サーバ版: APIエンドポイントから取得
            const response = await fetch('/api/data');
            if (!response.ok) {
                throw new Error(`データAPI失敗: ${response.status}`);
            }
            result = await response.json();
        }

        if (result.success) {
            allData = result.data;
            setStatus(`データ読み込み完了: ${allData.length}件`, 'success');
            // 年フィルターを初期化
            initializeYearFilters();
            // URLパラメータからフィルター状態を復元
            loadFiltersFromURL();
            applyFilters();
            // 初回ロードフラグをfalseに設定
            isInitialLoad = false;
            // 更新日時を更新
            await updateDataTimestamp();
            // workパラメータがあれば作品を表示
            setTimeout(() => loadWorkFromURL(), 100);
        } else {
            setStatus(`エラー: ${result.error}`, 'error');
        }
    } catch (error) {
        setStatus(`エラー: ${error.message}`, 'error');
        console.error('データ読み込みエラー:', error);
    } finally {
        loadBtn.disabled = false;
    }
}

// 検索ボックスの初期化
function initSearch() {
    const searchBox = document.getElementById('searchBox');
    const clearButton = document.getElementById('clearSearch');
    
    if (!searchBox || !clearButton) return;
    
    // リアルタイム検索（入力300ms後に実行）
    let searchTimeout;
    searchBox.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        currentSearchQuery = e.target.value.trim();
        
        // クリアボタンの表示制御
        clearButton.style.display = currentSearchQuery ? 'block' : 'none';
        
        // 300ms待ってから検索実行（デバウンス）
        searchTimeout = setTimeout(() => {
            applyFilters();
            saveFiltersToURL();
        }, 300);
    });
    
    // クリアボタン
    clearButton.addEventListener('click', () => {
        searchBox.value = '';
        currentSearchQuery = '';
        clearButton.style.display = 'none';
        applyFilters();
        saveFiltersToURL();
    });
}

// 特別カテゴリキーワードマッピング（ジブリのみ）
const specialCategoryKeywords = {
    'ghibli': ['ジブリ', 'スタジオジブリ', 'ghibli', 'studio ghibli']
};

// 検索クエリが特別カテゴリにマッチするかチェック
function checkSpecialCategoryKeyword(query) {
    const lowerQuery = query.toLowerCase().trim();
    for (const [category, keywords] of Object.entries(specialCategoryKeywords)) {
        for (const keyword of keywords) {
            if (lowerQuery === keyword.toLowerCase()) {
                return category;
            }
        }
    }
    return null;
}

// 検索実行関数
function searchInResults(results, query) {
    if (!query) return results;
    
    const searchText = query.toLowerCase();
    
    // 特別カテゴリキーワードをチェック
    const specialCategory = checkSpecialCategoryKeyword(query);
    
    if (specialCategory && SPECIAL_CATEGORIES[specialCategory]) {
        // 特別カテゴリにマッチした場合、該当カテゴリの作品のみを返す
        const categoryData = SPECIAL_CATEGORIES[specialCategory];
        return results.filter(item => 
            categoryData.movies.includes(item.title)
        );
    }
    
    // 通常の検索
    return results.filter(item => {
        // タイトル（英語）で検索
        if (item.title && item.title.toLowerCase().includes(searchText)) {
            return true;
        }
        
        // タイトル（日本語）で検索
        if (item.titleJa && item.titleJa.includes(searchText)) {
            return true;
        }
        
        // 概要（英語）で検索
        if (item.synopsis && item.synopsis.toLowerCase().includes(searchText)) {
            return true;
        }
        
        // 概要（日本語）で検索
        if (item.synopsisJa && item.synopsisJa.includes(searchText)) {
            return true;
        }
        
        // 概要（完全版、日本語）で検索
        if (item.synopsisJaFull && item.synopsisJaFull.includes(searchText)) {
            return true;
        }
        
        return false;
    });
}

// フィルター適用
function applyFilters() {
    // 特別カテゴリフィルター（URLパラメータから取得）
    const params = new URLSearchParams(window.location.search);
    const specialCategory = params.get('special');
    
    // 特別カテゴリが指定されている場合は、そのカテゴリの作品でベースデータを作成
    let baseData = allData;
    if (specialCategory && SPECIAL_CATEGORIES[specialCategory]) {
        const categoryData = SPECIAL_CATEGORIES[specialCategory];
        baseData = allData.filter(item => 
            categoryData.movies.includes(item.title)
        );
    }
    
    const countryCheckboxes = document.querySelectorAll(".country-checkbox");
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

    baseData.forEach(item => {
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
            const hasSelectedCountry = item.countries.some(c => 
                selectedCountries.includes(c.code)
            );
            
            if (hasSelectedCountry && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                filteredResults.push(item);
            }
        }
        // 国情報が文字列の場合
        else if (typeof item.countries === 'string') {
            const hasSelectedCountry = selectedCountries.some(code => 
                item.countries.includes(code)
            );
            
            if (hasSelectedCountry && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                filteredResults.push(item);
            }
        }
    });

    // 検索フィルター（最後に適用）
    const searchedResults = searchInResults(filteredResults, currentSearchQuery);

    displayResults(searchedResults);
    resultCountSpan.textContent = searchedResults.length;
    
    // 初回ロード以降はURLパラメータを更新
    if (!isInitialLoad) {
        saveFiltersToURL();
    }
}

// 作品の一意なIDを生成（永続性を考慮）
function generateWorkId(item, allItems = []) {
    // 1. 履歴から既存IDを確認
    const existingId = WorkIdHistory.getId(item);
    if (existingId) {
        // 既存IDがあれば、衝突チェックのみ実施
        const isUnique = !allItems.some(other => 
            other !== item && other._workId === existingId
        );
        if (isUnique) {
            return existingId; // 既存IDをそのまま使用
        }
    }
    
    // 2. 新規ID生成
    const titleSlug = item.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    const genreMap = {
        'movie': 'movie',
        'film': 'movie',
        'series': 'tv',
        'tv': 'tv',
        'documentary': 'movie',
        'short': 'movie'
    };
    const genre = genreMap[item.type?.toLowerCase()] || 'movie';
    
    const isAnime = item.category?.includes('アニメ');
    const mediaType = isAnime ? 'anime' : 'live';
    
    const year = item.year || 'unknown';
    
    const baseId = `${titleSlug}-${genre}-${mediaType}-${year}`;
    
    // 3. 衝突チェックとsuffix付与
    let finalId = baseId;
    let suffix = 0;
    const suffixes = 'abcdefghijklmnopqrstuvwxyz';
    
    while (allItems.some(other => {
        const otherId = other._workId || WorkIdHistory.getId(other) || '';
        return otherId === finalId && other !== item;
    })) {
        if (suffix < suffixes.length) {
            finalId = `${baseId}-${suffixes[suffix]}`;
        } else {
            finalId = `${baseId}-${suffix}`;
        }
        suffix++;
    }
    
    // 4. 履歴に保存
    WorkIdHistory.setId(item, finalId);
    
    return finalId;
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

// meta タグを更新または作成
function setMetaTag(property, content) {
    // og:* の場合
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
        // twitter:* や name属性の場合
        meta = document.querySelector(`meta[name="${property}"]`);
    }
    
    if (meta) {
        meta.setAttribute('content', content);
    } else {
        // 存在しない場合は新規作成
        meta = document.createElement('meta');
        if (property.startsWith('og:')) {
            meta.setAttribute('property', property);
        } else {
            meta.setAttribute('name', property);
        }
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
    }
}

// OGP等のmeta情報を更新
function updateMetaTags(item) {
    const displayTitle = item.titleJa 
        ? `${item.title} (${item.titleJa})` 
        : item.title;
    
    const description = (item.synopsisJaFull || item.synopsis || '概要はありません。')
        .substring(0, 200);
    
    let imageUrl = item.imageUrl || 'https://via.placeholder.com/600x900';
    // GitHub Pages版では絶対パスを相対パスに変換
    if (IS_GITHUB_PAGES && imageUrl.startsWith('/data/')) {
        imageUrl = imageUrl.substring(1); // 最初の'/'を削除
    }
    // サーバ版では絶対パスのままでOK（localhostの場合）
    // OGPには完全URLが必要なので、相対パスの場合は絶対URLに変換
    if (!imageUrl.startsWith('http')) {
        const origin = window.location.origin;
        const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
        imageUrl = `${origin}${basePath}${basePath ? '/' : ''}${imageUrl}`;
    }
    
    // タイトル
    document.title = `${displayTitle} | NordVPNユーザ向けNetflix作品リスト`;
    
    // OGPタイプを作品タイプに応じて設定
    const isMovie = item.type && (item.type.toLowerCase().includes('movie') || item.type.toLowerCase().includes('映画'));
    const ogType = isMovie ? 'video.movie' : 'video.tv_show';
    
    // OGP基本情報
    setMetaTag('og:title', displayTitle);
    setMetaTag('og:description', description);
    setMetaTag('og:image', imageUrl);
    setMetaTag('og:url', window.location.href);
    setMetaTag('og:type', ogType);
    setMetaTag('og:site_name', 'NordVPNユーザ向けNetflix作品リスト');
    setMetaTag('og:locale', 'ja_JP');
    
    // OGP画像詳細
    setMetaTag('og:image:width', '600');
    setMetaTag('og:image:height', '900');
    setMetaTag('og:image:alt', displayTitle);
    
    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', displayTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', imageUrl);
}

// Meta情報をデフォルトに戻す
function resetMetaTags() {
    document.title = 'NordVPNユーザ向けNetflix作品リスト';
    setMetaTag('og:title', 'NordVPNユーザ向けNetflix作品リスト');
    setMetaTag('og:description', '日本で視聴できないNetflix作品を国別に検索できるツール。NordVPNとuNoGSで視聴可能な36ヵ国の作品情報を提供しています。');
    setMetaTag('og:image', 'https://tomumuz.github.io/nordvpn/nordvpn-ogp.png?v=20260111');
    setMetaTag('og:url', 'https://tomumuz.github.io/nordvpn/');
    setMetaTag('twitter:title', 'NordVPNユーザ向けNetflix作品リスト');
    setMetaTag('twitter:description', '日本で視聴できないNetflix作品を国別に検索できるツール。NordVPNとuNoGSで視聴可能な36ヵ国の作品情報を提供しています。');
    setMetaTag('twitter:image', 'https://tomumuz.github.io/nordvpn/nordvpn-ogp.png?v=20260111');
}

// 特別カテゴリ用のMeta情報を更新
function updateMetaTagsForSpecialCategory(specialCategory) {
    if (!SPECIAL_CATEGORIES[specialCategory]) {
        resetMetaTags();
        return;
    }
    
    const categoryData = SPECIAL_CATEGORIES[specialCategory];
    
    // カテゴリ名に応じてタイトルを生成
    let categoryTitle = '';
    
    if (specialCategory === 'ghibli') {
        categoryTitle = 'スタジオジブリ作品(映画)';
    } else if (specialCategory === 'conan') {
        categoryTitle = '名探偵コナン(映画)';
    } else if (specialCategory === 'onepiece') {
        categoryTitle = 'ワンピース(映画)';
    } else if (specialCategory === 'naruto') {
        categoryTitle = 'NARUTO(映画)';
    } else {
        // その他の特別カテゴリの場合
        categoryTitle = `${categoryData.name}(映画)`;
    }
    
    const description = `${categoryTitle}の一覧です。Netflixで視聴可能な作品を配信国別に検索できます。`;
    const fullTitle = `${categoryTitle} | NordVPNユーザ向けNetflix作品リスト`;
    
    document.title = fullTitle;
    
    setMetaTag('og:title', categoryTitle);
    setMetaTag('og:description', description);
    setMetaTag('og:url', window.location.href);
    setMetaTag('og:image', '');
    
    setMetaTag('twitter:title', categoryTitle);
    setMetaTag('twitter:description', description);
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
    let imageUrl = item.imageUrl || defaultImageUrl;
    // GitHub Pages版では絶対パスを相対パスに変換
    if (IS_GITHUB_PAGES && imageUrl.startsWith('/data/')) {
        imageUrl = imageUrl.substring(1); // 最初の'/'を削除
    }
    const fallbackImageUrl = `https://via.placeholder.com/600x900/667eea/ffffff?text=${encodeURIComponent(item.englishTitle || item.title).substring(0, 30).replace(/%20/g, '+')}`;
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
        ? item.countries.map(c => {
            const countryName = c.name || COUNTRY_NAMES[c.code] || c.code;
            const bgColor = getCountryBadgeColor(countryName);
            return `<span class="country-badge" style="background: ${bgColor};">${countryName}</span>`;
        }).join('')
        : (() => {
            const countryName = item.filterCountryName || '不明';
            const bgColor = getCountryBadgeColor(countryName);
            return `<span class="country-badge" style="background: ${bgColor};">${countryName}</span>`;
        })();
    modalCountries.innerHTML = countriesHtml;
    
    // 概要（全文）- synopsisが元の完全なテキスト
    const synopsis = item.synopsisJaFull || item.synopsis || item.synopsisJapanese || '概要はありません。';
    modalSynopsis.textContent = synopsis;
    
    // IDを生成（まだ生成されていない場合のみ）
    if (!item._workId) {
        item._workId = generateWorkId(item, allData);
    }
    
    // URLにworkパラメータを追加（specialパラメータは保持）
    const workId = item._workId;
    if (workId) {
        // 現在のworkIdを保存（シェア用）
        currentWorkId = workId;
        
        const url = new URL(window.location.href);
        url.searchParams.set('work', workId);
        
        // meta情報も更新
        updateMetaTags(item);
        
        window.history.pushState({ workId }, '', url.toString());
    }
    
    // モーダルを表示
    modal.style.display = 'block';
}

// モーダルを閉じる
function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.style.display = 'none';
    
    // 現在のworkIdをクリア
    currentWorkId = null;
    
    // URLからworkパラメータを削除（specialパラメータは保持）
    const url = new URL(window.location.href);
    url.searchParams.delete('work');
    
    // specialパラメータがある場合は、特別カテゴリのメタタグに戻す
    const specialParam = url.searchParams.get('special');
    if (specialParam && SPECIAL_CATEGORIES[specialParam]) {
        updateMetaTagsForSpecialCategory(specialParam);
    } else {
        // meta情報をデフォルトに戻す
        resetMetaTags();
    }
    
    window.history.pushState({}, '', url.toString());
    
    // specialパラメータがある場合はフィルタを再適用
    if (specialParam) {
        applyFilters();
    }
}

// 作品が見つからないモーダルを表示
function showNotFoundModal(workId) {
    const modal = document.getElementById('notFoundModal');
    modal.style.display = 'block';
    
    // meta情報を更新
    document.title = 'この作品はuNoGS上に存在しません | NordVPNユーザ向けNetflix作品リスト';
    setMetaTag('og:title', 'この作品はuNoGS上に存在しません | NordVPNユーザ向けNetflix作品リスト');
    setMetaTag('og:description', '※以下の可能性があります：配信が日本で開始、配信が海外で終了、一時的にuNoGS上から作品が消失（復活する可能性あり！）');
}

// 作品が見つからないモーダルを閉じる
function closeNotFoundModal() {
    const modal = document.getElementById('notFoundModal');
    modal.style.display = 'none';
    
    // 現在のworkIdをクリア
    currentWorkId = null;
    
    // URLからworkパラメータを削除
    const url = new URL(window.location.href);
    url.searchParams.delete('work');
    window.history.pushState({}, '', url.toString());
    
    // meta情報をリセット
    resetMetaTags();
}

// トースト通知を表示
function showToast(message) {
    const toast = document.getElementById('copyToast');
    toast.textContent = message;
    toast.classList.add('show');
    
    // 2秒後に非表示
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 現在のURLをコピー
async function copyCurrentUrl() {
    const url = window.location.href;
    
    try {
        await navigator.clipboard.writeText(url);
        showToast('URLをコピーしました');
    } catch (err) {
        console.error('コピーに失敗:', err);
        // フォールバック
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('URLをコピーしました');
    }
}

// シェアボタンのクリックハンドラ（静的URLをコピー）
async function shareWork() {
    if (!currentWorkId) {
        showToast('エラー: 作品情報が見つかりません');
        return;
    }
    
    // 静的HTMLページのURLを生成
    const baseUrl = IS_GITHUB_PAGES 
        ? 'https://tomumuz.github.io/nordvpn' 
        : `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}`;
    const staticUrl = `${baseUrl}/works/${currentWorkId}.html`;
    
    try {
        await navigator.clipboard.writeText(staticUrl);
        showToast('URLをコピーしました');
    } catch (err) {
        console.error('コピーに失敗:', err);
        // フォールバック
        const textarea = document.createElement('textarea');
        textarea.value = staticUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('URLをコピーしました');
    }
}

// workIdから作品情報を抽出
function parseWorkId(workId) {
    try {
        const parts = workId.split('-');
        
        // 最後から解析（year, mediaType, genre）
        const year = parts[parts.length - 1];
        const mediaType = parts[parts.length - 2]; // anime or live
        const genre = parts[parts.length - 3]; // movie or tv
        
        // 残りがタイトル
        const titleParts = parts.slice(0, -3);
        const title = titleParts.join('-');
        
        return { title, genre, mediaType, year };
    } catch (e) {
        console.error('workIdのパースに失敗:', workId, e);
        return null;
    }
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

    // 画面幅から推測される列数を計算（グリッドの minmax(200px, 1fr) に基づく）
    const estimateColumnsCount = () => {
        const containerWidth = resultsDiv.clientWidth || 1400; // デフォルト幅
        const minCardWidth = 200; // CSSのminmax値
        const gap = 25; // gap値
        const maxColumns = Math.floor((containerWidth + gap) / (minCardWidth + gap));
        return Math.max(1, Math.min(maxColumns, 5)); // 1〜5列の範囲で制限
    };

    const estimatedColumns = estimateColumnsCount();
    
    // 各カードにHTMLを生成（グリッドレイアウトを使用）
    resultsDiv.innerHTML = sortedResults.map((item, index) => {
        // 行番号を計算（推測値）
        const rowNumber = Math.floor(index / estimatedColumns) + 1;
        const isFirstInRow = index % estimatedColumns === 0;
        
        // 画像URLがない場合は、デフォルトのNetflix画像パターンを使用
        const defaultImageUrl = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=画像なし';
        let imageUrl = item.imageUrl || defaultImageUrl;
        // GitHub Pages版では絶対パスを相対パスに変換
        if (IS_GITHUB_PAGES && imageUrl.startsWith('/data/')) {
            imageUrl = imageUrl.substring(1); // 最初の'/'を削除
        }
        
        // 画像URLが無効な場合は、タイトルから検索用のプレースホルダーを生成
        const fallbackImageUrl = `https://via.placeholder.com/300x450/a78bfa/ffffff?text=${encodeURIComponent(item.englishTitle || item.title).substring(0, 30).replace(/%20/g, '+')}`;
        
        const imageHtml = `<img src="${imageUrl}" alt="${item.title}" onerror="this.onerror=null; this.src='${fallbackImageUrl}';">`;

        const countriesHtml = item.countries && item.countries.length > 0
            ? item.countries.map(c => {
                const countryName = c.name || COUNTRY_NAMES[c.code] || c.code;
                const bgColor = getCountryBadgeColor(countryName);
                return `<span class="country-badge" style="background: ${bgColor};">${countryName}</span>`;
            }).join('')
            : (() => {
                const countryName = item.filterCountryName || '不明';
                const bgColor = getCountryBadgeColor(countryName);
                return `<span class="country-badge" style="background: ${bgColor};">${countryName}</span>`;
            })();

        const typeAndYear = formatTypeAndYear(item);
        
        const ratingHtml = item.rating 
            ? `<div class="result-rating">⭐ ${item.rating}</div>` 
            : '';

        // 概要を表示（日本語を優先）
        const originalSynopsis = item.synopsisJaFull || item.synopsisJapanese || item.synopsis || '';
        let displaySynopsis = '';
        
        // 日本語文字を含むかチェック
        const hasJapaneseChar = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(originalSynopsis);
        
        if (hasJapaneseChar) {
            // 日本語の場合：11文字×2行（最後の文字は「…」）
            if (originalSynopsis.length >= 21) {
                // 21文字以上の場合: 最初の21文字 + 「…」
                displaySynopsis = originalSynopsis.substring(0, 21) + '…';
            } else {
                // 21文字未満の場合: スペースで埋めて21文字にして「…」を追加
                displaySynopsis = originalSynopsis.padEnd(21, '　') + '…';
            }
            // 11文字で改行（1行目：11文字、2行目：10文字+「…」）
            const line1 = displaySynopsis.substring(0, 11);
            const line2 = displaySynopsis.substring(11, 22);
            displaySynopsis = line1 + '\n' + line2;
        } else {
            // 英語の場合：52文字に統一（49文字+「...」）
            if (originalSynopsis.length > 52) {
                displaySynopsis = originalSynopsis.substring(0, 49) + '...';
            } else if (originalSynopsis.length === 52) {
                displaySynopsis = originalSynopsis;
            } else {
                // 52文字未満の場合は52文字になるまでスペースで埋める
                displaySynopsis = originalSynopsis.padEnd(52, ' ');
            }
            // 26文字で改行（2行表示）
            const line1 = displaySynopsis.substring(0, 26);
            const line2 = displaySynopsis.substring(26, 52);
            displaySynopsis = line1 + '\n' + line2;
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
        
        // 行番号のHTML（最初のカードだけに表示）
        const rowNumberHtml = isFirstInRow 
            ? `<div class="row-number-label" style="position: absolute; left: -40px; top: 0; bottom: 0; width: 30px; font-size: 11px; font-weight: normal; color: #ccc; display: flex; align-items: center; justify-content: center; background: transparent; border-radius: 0;">${rowNumber}</div>`
            : '';
        
        return `
            <div class="result-card-wrapper" style="position: relative;">
                ${rowNumberHtml}
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

// データをダウンロード
// downloadData関数（使用しない - コメントアウト）
/*
function downloadData() {
    if (allData.length === 0) {
        alert('ダウンロードするデータがありません。まずデータを取得または読み込んでください。');
        return;
    }
    
    // 選択されている国でフィルタリング
    const selectedCountries = Array.from(countryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    let dataToDownload = allData;
    
    if (selectedCountries.length > 0) {
        dataToDownload = [];
        selectedCountries.forEach(countryCode => {
            const countryData = allData.filter(item => {
                if (Array.isArray(item.countries)) {
                    return item.countries.some(c => c.code === countryCode);
                }
                return false;
            });
            
            countryData.forEach(item => {
                if (!dataToDownload.find(r => r.id === item.id)) {
                    dataToDownload.push(item);
                }
            });
        });
    }
    
    // JSONファイルとしてダウンロード
    const dataStr = JSON.stringify(dataToDownload, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unogs-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setStatus(`${dataToDownload.length}件のデータをダウンロードしました`, 'success');
}
*/

// 全て選択
function selectAllCountries() {
    const checkboxes = document.querySelectorAll('.country-checkbox');
    checkboxes.forEach(cb => {
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
    const checkboxes = document.querySelectorAll('.country-checkbox');
    checkboxes.forEach(cb => {
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
extractHtmlBtn.addEventListener('click', extractFromHTML);
// fetchAllBtn.addEventListener('click', fetchAllDataFromAPI);
// fetchApiBtn.addEventListener('click', fetchDataFromAPI);
// fetchBtn.addEventListener('click', fetchData);
// fetchPuppeteerBtn.addEventListener('click', fetchDataWithPuppeteer);
loadBtn.addEventListener('click', loadData);
// downloadBtn.addEventListener('click', downloadData);

// 全て選択/解除のチェックボックス
selectAllCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        deselectAllCheckbox.checked = false;
        selectAllCountries();
        // 特別カテゴリパラメータをリセット
        resetSpecialCategory();
    }
});

deselectAllCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        selectAllCheckbox.checked = false;
        deselectAllCountries();
        // 特別カテゴリパラメータをリセット
        resetSpecialCategory();
    }
});

// 国のチェックボックス
countryCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        // 全て選択されているかチェック
        const allChecked = Array.from(countryCheckboxes).every(cb => cb.checked);
        const noneChecked = Array.from(countryCheckboxes).every(cb => !cb.checked);
        
        selectAllCheckbox.checked = allChecked;
        deselectAllCheckbox.checked = noneChecked;
        
        applyFilters();
    });
});

// カテゴリフィルターの全選択/全解除
const selectAllCategoriesCheckbox = document.getElementById('selectAllCategories');
const deselectAllCategoriesCheckbox = document.getElementById('deselectAllCategories');

if (selectAllCategoriesCheckbox) {
    selectAllCategoriesCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            deselectAllCategoriesCheckbox.checked = false;
            const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
            categoryCheckboxes.forEach(cb => cb.checked = true);
            // 特別カテゴリパラメータをリセット
            resetSpecialCategory();
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
            // 特別カテゴリパラメータをリセット
            resetSpecialCategory();
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
    
    // 7ヶ国でフィルタされた作品の年を抽出
    const TARGET_COUNTRY_CODES = ['US', 'NL', 'CH', 'DE', 'FI', 'FR', 'GB'];
    const filteredWorks = allData.filter(work => {
        if (!work.countries || !Array.isArray(work.countries)) return false;
        return work.countries.some(country => {
            if (typeof country === 'object' && country.code) {
                return TARGET_COUNTRY_CODES.includes(country.code);
            }
            return false;
        });
    });
    
    const years = filteredWorks
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
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // 特別カテゴリのメタタグを更新（URLパラメータから取得）
    const urlParams = new URLSearchParams(window.location.search);
    const specialParam = urlParams.get('special');
    if (specialParam && SPECIAL_CATEGORIES[specialParam]) {
        updateMetaTagsForSpecialCategory(specialParam);
    }
    
    // 検索機能の初期化
    initSearch();
    
    // モーダルのクローズボタン
    const modal = document.getElementById('detailModal');
    const closeBtn = document.querySelector('.modal-close');
    
    closeBtn.addEventListener('click', closeModal);
    
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
    
    // ページ読み込み時に保存済みデータの有無をチェック
    checkSavedData();
});

// 保存済みデータの有無をチェックして、ボタンの表示を制御
async function checkSavedData() {
    try {
        let result;
        if (IS_GITHUB_PAGES) {
            // GitHub Pages: 静的ファイルの存在を確認
            try {
                const response = await fetch('data/unogs-data.json');
                if (!response.ok) {
                    throw new Error(`データファイルが見つかりません: ${response.status}`);
                }
                const data = await response.json();
                result = { success: true, data: data };
            } catch (e) {
                console.warn('データファイル読み込みエラー:', e);
                result = { success: false };
            }
        } else {
            // サーバ版: APIエンドポイントから確認
            const response = await fetch('/api/data');
            if (response.ok) {
                result = await response.json();
            } else {
                result = { success: false };
            }
        }
        
        if (result.success && result.data && result.data.length > 0) {
            // データが存在する場合、「HTMLから抽出」ボタンを非表示
            extractHtmlBtn.style.display = 'none';
            loadBtn.style.display = 'inline-block';
        } else {
            // データが存在しない場合、「HTMLから抽出」ボタンを表示
            extractHtmlBtn.style.display = 'inline-block';
            loadBtn.style.display = 'none';
        }
        
        // ページ読み込み時に更新日時を表示
        await updateDataTimestamp();
    } catch (error) {
        // エラーの場合
        console.error('データチェックエラー:', error);
        if (IS_GITHUB_PAGES) {
            // GitHub Pages: 抽出ボタンは非表示、読み込みボタンのみ表示
            extractHtmlBtn.style.display = 'none';
            loadBtn.style.display = 'inline-block';
        } else {
            // サーバ版: 両方表示
            extractHtmlBtn.style.display = 'inline-block';
            loadBtn.style.display = 'inline-block';
        }
        await updateDataTimestamp();
    }
}


// NordVPN対象国を読み込む
async function loadNordVPNCountries() {
    try {
        let result;
        if (IS_GITHUB_PAGES) {
            // GitHub Pages: ハードコードされた国リストを使用
            result = {
                adTierNG: {
                    asiapacific: {
                        name: 'アジア太平洋',
                        countries: {
                            HK: '香港', TH: 'タイ', SG: 'シンガポール', IN: 'インド', PH: 'フィリピン'
                        }
                    },
                    europe: {
                        name: 'ヨーロッパ',
                        countries: {
                            BE: 'ベルギー', CZ: 'チェコ', GR: 'ギリシャ', NL: 'オランダ', PL: 'ポーランド',
                            PT: 'ポルトガル', RO: 'ルーマニア', SK: 'スロバキア', SE: 'スウェーデン',
                            CH: 'スイス', UA: 'ウクライナ'
                        }
                    },
                    africamiddleeast: {
                        name: 'アフリカ・中近東',
                        countries: {
                            IL: 'イスラエル', TR: 'トルコ', ZA: '南アフリカ'
                        }
                    },
                    americas: {
                        name: '南北アメリカ',
                        countries: {
                            AR: 'アルゼンチン'
                        }
                    }
                },
                adTierOK: {
                    americas: {
                        name: '南北アメリカ',
                        countries: {
                            US: '米国', CA: 'カナダ', CO: 'コロンビア', MX: 'メキシコ', BR: 'ブラジル'
                        }
                    },
                    europe: {
                        name: 'ヨーロッパ',
                        countries: {
                            DE: 'ドイツ', GB: '英国', FR: 'フランス', IT: 'イタリア', HU: 'ハンガリー',
                            IS: 'アイスランド', LT: 'リトアニア', ES: 'スペイン'
                        }
                    },
                    asiapacific: {
                        name: 'アジア太平洋',
                        countries: {
                            MY: 'マレーシア', AU: 'オーストラリア', KR: '韓国'
                        }
                    }
                }
            };
        } else {
            // サーバ版: APIエンドポイントから取得
            const response = await fetch('/api/nordvpn-countries');
            if (!response.ok) {
                throw new Error('国リストの取得に失敗しました');
            }
            result = await response.json();
        }
        
        if (result.adTierNG && result.adTierOK) {
            generateCountryFilters(result.adTierNG, result.adTierOK);
        }
    } catch (error) {
        console.error('国リストの読み込みエラー:', error);
        const adTierNGContainer = document.getElementById('adTierNGContainer');
        const adTierOKContainer = document.getElementById('adTierOKContainer');
        if (adTierNGContainer) {
            adTierNGContainer.innerHTML = '<p style="color: red;">国リストの読み込みに失敗しました</p>';
        }
        if (adTierOKContainer) {
            adTierOKContainer.innerHTML = '<p style="color: red;">国リストの読み込みに失敗しました</p>';
        }
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
        if (!region) return;
        
        const regionHeader = document.createElement('div');
        regionHeader.style.gridColumn = '1 / -1';
        regionHeader.style.background = 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)';
        regionHeader.style.color = 'white';
        regionHeader.style.padding = '10px 15px';
        regionHeader.style.borderRadius = '8px';
        regionHeader.style.fontWeight = 'bold';
        regionHeader.style.marginTop = '10px';
        regionHeader.textContent = `${region.name} (${Object.keys(region.countries).length})`;
        container.appendChild(regionHeader);
        
        Object.entries(region.countries).forEach(([code, name]) => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.innerHTML = `
                <input type="checkbox" class="country-checkbox ${groupClass}-checkbox" value="${code}" checked>
                ${name}
            `;
            container.appendChild(label);
        });
    });
    
    // イベントリスナーを設定（一括選択チェックボックスとの連動を追加）
    const checkboxes = container.querySelectorAll('.country-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            applyFilters();
            updateGroupCheckboxState(groupClass);
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

// ページ読み込み時にNordVPN対象国を読み込む
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadNordVPNCountries();
    });
} else {
    loadNordVPNCountries();
}
