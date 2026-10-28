// ==UserScript==
// @name         Instagram No Login
// @namespace    https://github.com/protagone/instagram-no-login
// @version      1.11.4
// @description  Use Instagram without an account: no login pop-ups, posts and profiles open normally, and a search box on the home page.
// @author       protagone
// @homepageURL  https://github.com/protagone/instagram-no-login
// @supportURL   https://github.com/protagone/instagram-no-login/issues
// @downloadURL  https://raw.githubusercontent.com/protagone/instagram-no-login/main/instagram-no-login.user.js
// @updateURL    https://raw.githubusercontent.com/protagone/instagram-no-login/main/instagram-no-login.user.js
// @match        *://instagram.com/*
// @match        *://*.instagram.com/*
// @match        *://instagr.am/*
// @match        *://*.instagr.am/*
// @run-at       document-start
// @noframes
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @connect      search.brave.com
// @connect      html.duckduckgo.com
// @connect      imgs.search.brave.com
// @license      GPL-3.0-only
// ==/UserScript==

// Based on "Bypass Instagram Login Redirects" by ZX_02
// (https://greasyfork.org/scripts/561325), GNU GPLv3. Changes: see CHANGELOG.md.

// Built by build.mjs from src/. Edit the files there, then run `node build.mjs`.

(() => {
    'use strict';

    // Shared by the content script and the extension pop-up.

    const VIEWER_LIST = [
        {
            name: "Imginn",
            profilePrefix: "https://imginn.com/",
            postPrefix: "https://imginn.com/p/",
        },
        {
            name: "Pixnoy",
            profilePrefix: "https://www.pixnoy.com/profile/",
            postPrefix: "https://www.pixnoy.com/post/",
        }
    ];

    // Used when no choice is saved. The extension has a pop-up to change it;
    // Userscripts (Safari) has no script menu, so change this name there.
    const DEFAULT_VIEWER = "Imginn";

    // Texts of the search box and the extension pop-up. English is the
    // default; the choice is saved.
    const LANGUAGES = {
        en: { flag: "🇬🇧", name: "English", title: "Find an account",
            help: "Type a name or username and pick an account, or paste a link.",
            example: "e.g. natgeo", open: "Open on Instagram", search: "Search with Brave", close: "Close", language: "Language",
            searching: "Searching…", noResults: "No accounts found",
            failed: "Couldn't search right now",
            busy: "Search is busy. Try “Search with Brave” or wait a minute.",
            fallback: "Fallback site", fallbackHelp: "Used only when Instagram insists on the login page." },
        nl: { flag: "🇳🇱", name: "Nederlands", title: "Account zoeken",
            help: "Typ een naam of gebruikersnaam en kies een account, of plak een link.",
            example: "bijv. natgeo", open: "Open op Instagram", search: "Zoek met Brave", close: "Sluiten", language: "Taal",
            searching: "Zoeken…", noResults: "Geen accounts gevonden",
            failed: "Zoeken lukt nu niet",
            busy: "Zoeken is even druk. Probeer “Zoek met Brave” of wacht een minuut.",
            fallback: "Uitwijksite", fallbackHelp: "Alleen als Instagram toch de inlogpagina laat zien." },
        pl: { flag: "🇵🇱", name: "Polski", title: "Znajdź konto",
            help: "Wpisz nazwę lub nazwę użytkownika i wybierz konto albo wklej link.",
            example: "np. natgeo", open: "Otwórz na Instagramie", search: "Szukaj w Brave", close: "Zamknij", language: "Język",
            searching: "Szukam…", noResults: "Nie znaleziono kont",
            failed: "Wyszukiwanie teraz nie działa",
            busy: "Wyszukiwarka jest teraz zajęta. Użyj „Szukaj w Brave” albo poczekaj minutę.",
            fallback: "Strona zapasowa", fallbackHelp: "Tylko gdy Instagram wymusza stronę logowania." },
        hi: { flag: "🇮🇳", name: "हिन्दी", title: "अकाउंट खोजें",
            help: "नाम या यूज़रनेम लिखें और अकाउंट चुनें, या लिंक पेस्ट करें।",
            example: "जैसे natgeo", open: "Instagram पर खोलें", search: "Brave से खोजें", close: "बंद करें", language: "भाषा",
            searching: "खोज रहे हैं…", noResults: "कोई अकाउंट नहीं मिला",
            failed: "अभी खोज नहीं हो पा रही",
            busy: "खोज अभी व्यस्त है। “Brave से खोजें” आज़माएँ या एक मिनट रुकें।",
            fallback: "वैकल्पिक साइट", fallbackHelp: "सिर्फ़ तब, जब Instagram लॉग इन पेज पर ही ले जाए।" },
        de: { flag: "🇩🇪", name: "Deutsch", title: "Konto suchen",
            help: "Gib einen Namen oder Benutzernamen ein und wähle ein Konto, oder füge einen Link ein.",
            example: "z. B. natgeo", open: "Auf Instagram öffnen", search: "Mit Brave suchen", close: "Schließen", language: "Sprache",
            searching: "Suche…", noResults: "Keine Konten gefunden",
            failed: "Suche gerade nicht möglich",
            busy: "Die Suche ist gerade ausgelastet. Nutze „Mit Brave suchen“ oder warte eine Minute.",
            fallback: "Ausweichseite", fallbackHelp: "Nur wenn Instagram auf der Anmeldeseite besteht." },
        es: { flag: "🇪🇸", name: "Español", title: "Buscar una cuenta",
            help: "Escribe un nombre o nombre de usuario y elige una cuenta, o pega un enlace.",
            example: "p. ej. natgeo", open: "Abrir en Instagram", search: "Buscar con Brave", close: "Cerrar", language: "Idioma",
            searching: "Buscando…", noResults: "No se encontraron cuentas",
            failed: "No se puede buscar ahora",
            busy: "La búsqueda está ocupada. Prueba «Buscar con Brave» o espera un minuto.",
            fallback: "Sitio alternativo", fallbackHelp: "Solo cuando Instagram insiste en la página de inicio de sesión." },
        fr: { flag: "🇫🇷", name: "Français", title: "Rechercher un compte",
            help: "Saisissez un nom ou un nom d’utilisateur et choisissez un compte, ou collez un lien.",
            example: "ex. natgeo", open: "Ouvrir sur Instagram", search: "Chercher avec Brave", close: "Fermer", language: "Langue",
            searching: "Recherche…", noResults: "Aucun compte trouvé",
            failed: "Recherche impossible pour le moment",
            busy: "La recherche est saturée. Essayez « Chercher avec Brave » ou attendez une minute.",
            fallback: "Site de secours", fallbackHelp: "Seulement quand Instagram impose la page de connexion." },
        pt: { flag: "🇧🇷", name: "Português", title: "Encontrar uma conta",
            help: "Digite um nome ou nome de usuário e escolha uma conta, ou cole um link.",
            example: "ex.: natgeo", open: "Abrir no Instagram", search: "Pesquisar com o Brave", close: "Fechar", language: "Idioma",
            searching: "Pesquisando…", noResults: "Nenhuma conta encontrada",
            failed: "Não foi possível pesquisar agora",
            busy: "A pesquisa está ocupada. Tente “Pesquisar com o Brave” ou espere um minuto.",
            fallback: "Site alternativo", fallbackHelp: "Só quando o Instagram exige a página de login." },
        it: { flag: "🇮🇹", name: "Italiano", title: "Trova un account",
            help: "Digita un nome o un nome utente e scegli un account, oppure incolla un link.",
            example: "es. natgeo", open: "Apri su Instagram", search: "Cerca con Brave", close: "Chiudi", language: "Lingua",
            searching: "Ricerca…", noResults: "Nessun account trovato",
            failed: "Ricerca non disponibile al momento",
            busy: "La ricerca è occupata. Prova «Cerca con Brave» o attendi un minuto.",
            fallback: "Sito alternativo", fallbackHelp: "Solo quando Instagram impone la pagina di accesso." },
        tr: { flag: "🇹🇷", name: "Türkçe", title: "Hesap bul",
            help: "Bir ad veya kullanıcı adı yazıp bir hesap seçin ya da bağlantı yapıştırın.",
            example: "ör. natgeo", open: "Instagram'da aç", search: "Brave ile ara", close: "Kapat", language: "Dil",
            searching: "Aranıyor…", noResults: "Hesap bulunamadı",
            failed: "Şu anda arama yapılamıyor",
            busy: "Arama şu an yoğun. “Brave ile ara”yı deneyin veya bir dakika bekleyin.",
            fallback: "Yedek site", fallbackHelp: "Yalnızca Instagram giriş sayfasında ısrar ettiğinde." },
        id: { flag: "🇮🇩", name: "Bahasa Indonesia", title: "Cari akun",
            help: "Ketik nama atau nama pengguna lalu pilih akun, atau tempel tautan.",
            example: "mis. natgeo", open: "Buka di Instagram", search: "Cari dengan Brave", close: "Tutup", language: "Bahasa",
            searching: "Mencari…", noResults: "Akun tidak ditemukan",
            failed: "Pencarian sedang tidak bisa",
            busy: "Pencarian sedang sibuk. Coba “Cari dengan Brave” atau tunggu sebentar.",
            fallback: "Situs cadangan", fallbackHelp: "Hanya saat Instagram memaksa halaman masuk." },
        ru: { flag: "🇷🇺", name: "Русский", title: "Найти аккаунт",
            help: "Введите имя или имя пользователя и выберите аккаунт либо вставьте ссылку.",
            example: "напр. natgeo", open: "Открыть в Instagram", search: "Искать в Brave", close: "Закрыть", language: "Язык",
            searching: "Поиск…", noResults: "Аккаунты не найдены",
            failed: "Сейчас поиск недоступен",
            busy: "Поиск сейчас перегружен. Попробуйте «Искать в Brave» или подождите минуту.",
            fallback: "Запасной сайт", fallbackHelp: "Только когда Instagram требует войти." },
        ar: { flag: "🇸🇦", name: "العربية", rtl: true, title: "البحث عن حساب",
            help: "اكتب اسمًا أو اسم مستخدم واختر حسابًا، أو الصق رابطًا.",
            example: "مثال: natgeo", open: "فتح على Instagram", search: "البحث عبر Brave", close: "إغلاق", language: "اللغة",
            searching: "جارٍ البحث…", noResults: "لم يتم العثور على حسابات",
            failed: "تعذّر البحث الآن",
            busy: "البحث مشغول الآن. جرّب «البحث عبر Brave» أو انتظر دقيقة.",
            fallback: "الموقع البديل", fallbackHelp: "فقط عندما يفرض Instagram صفحة تسجيل الدخول." },
        zh: { flag: "🇨🇳", name: "中文", title: "查找账号",
            help: "输入名称或用户名并选择账号，或粘贴链接。",
            example: "例如 natgeo", open: "在 Instagram 上打开", search: "用 Brave 搜索", close: "关闭", language: "语言",
            searching: "正在搜索…", noResults: "未找到账号",
            failed: "暂时无法搜索",
            busy: "搜索繁忙。请试试“用 Brave 搜索”或稍等一分钟。",
            fallback: "备用网站", fallbackHelp: "仅在 Instagram 强制显示登录页时使用。" },
        ja: { flag: "🇯🇵", name: "日本語", title: "アカウントを探す",
            help: "名前またはユーザーネームを入力してアカウントを選ぶか、リンクを貼り付けてください。",
            example: "例: natgeo", open: "Instagram で開く", search: "Brave で検索", close: "閉じる", language: "言語",
            searching: "検索中…", noResults: "アカウントが見つかりません",
            failed: "現在検索できません",
            busy: "検索が混み合っています。「Brave で検索」を試すか、1分ほど待ってください。",
            fallback: "代わりのサイト", fallbackHelp: "Instagram がログインページを強制したときだけ使います。" },
    };

    // Instagram addresses and usernames. Shared by core.js and search.js.

    const INSTA_HOST = /^(?:www\.|m\.)?(?:instagram\.com|instagr\.am)$/i;
    const POST_PATHS = new Set(["p", "reel", "reels", "tv"]);
    const NOT_A_USER = new Set([
        "accounts", "explore", "developer", "direct", "stories", "static", "legal",
        "about", "api", "web", "challenge", "emails", "session", "privacy", "terms",
        "directory", "oauth", "graphql", "ajax", "data", "nametag", "lite",
    ]);
    const USERNAME = /^[A-Za-z0-9._]{1,30}$/;
    const isUsername = name => !!name && USERNAME.test(name) &&
        !NOT_A_USER.has(name.toLowerCase()) && !POST_PATHS.has(name.toLowerCase());

    // A username from what someone typed or pasted: "@natgeo", "natgeo" or a
    // link to the account.
    const usernameFrom = text => {
        let value = text.trim().replace(/^@/, "");
        try {
            const url = new URL(value);
            if (INSTA_HOST.test(url.hostname)) value = url.pathname.split("/").filter(Boolean)[0] || "";
        } catch (e) { /* not a link */ }
        value = value.replace(/\/+$/, "");
        return isUsername(value) ? value : null;
    };

    // The account search behind the search box: a search engine, asked for
    // site:instagram.com, lists accounts without a login. fetchPage comes
    // from platform.js (the userscript manager, or the extension's
    // background script); DOMParser from the page.

    const WEB_SEARCH = "https://search.brave.com/search?q=";
    const webSearchUrl = query => WEB_SEARCH + encodeURIComponent(`site:instagram.com ${query}`);

    // Search engines that list Instagram accounts without a login, tried in
    // this order. Search engines limit how often one address may ask (HTTP
    // 429, or a check page instead of results), so a source that refuses is
    // left alone for a minute and the next one is asked.
    const SOURCES = [
        {
            name: "Brave",
            url: query => webSearchUrl(query),
            // Not a word test: every Brave page carries "captcha" in its
            // translations. A real results page has result snippets.
            limited: (status, body) => status === 429 || (status === 200 && !/class="snippet\b/.test(body)),
            links: doc => doc.querySelectorAll('a[href*="instagram.com/"]'),
            // Brave puts "Name (@user)" in a title attribute inside the link.
            target: link => link.getAttribute("href"),
            title: link => link.querySelector("[title]")?.getAttribute("title") || "",
            // Some results carry a thumbnail (the profile picture) through
            // Brave's image proxy, next to the link inside the same snippet.
            image: link => {
                const images = link.closest(".snippet")?.querySelectorAll("img") || [];
                const thumb = [...images].find(img => !/favicon/.test(img.getAttribute("class") || "") &&
                    (img.getAttribute("src") || "").startsWith("https://imgs.search.brave.com/"));
                return thumb?.getAttribute("src") || "";
            },
        },
        {
            name: "DuckDuckGo",
            url: query => "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(`site:instagram.com ${query}`),
            limited: (status, body) => status === 202 || status === 429 || /anomaly/i.test(body),
            links: doc => doc.querySelectorAll("a.result__a"),
            // DuckDuckGo links go through a redirect: //duckduckgo.com/l/?uddg=<url>
            target: link => {
                const href = link.getAttribute("href") || "";
                try {
                    return new URL(href, "https://duckduckgo.com").searchParams.get("uddg") || href;
                } catch (e) {
                    return href;
                }
            },
            title: link => link.textContent || "",
            image: () => "",
        },
    ];
    const COOLDOWN_MS = 60 * 1000;
    const coolingUntil = new Map();

    // Accounts on a results page: every link to instagram.com/<user>, in
    // order, once. A link's title is only trusted as the account's name when
    // it points at the profile itself, not at one of its posts.
    // How many accounts the list shows; each of them gets a picture.
    const MAX_ACCOUNTS = 8;

    const parseAccounts = (source, html) => {
        const accounts = new Map();
        const doc = new DOMParser().parseFromString(html, "text/html");
        for (const link of source.links(doc)) {
            const href = source.target(link);
            const user = usernameFrom(href);
            if (!user) continue;
            const key = user.toLowerCase();
            let name = "";
            let image = "";
            try {
                if (new URL(href).pathname.split("/").filter(Boolean).length === 1) {
                    name = source.title(link).trim().split(/\s*\(@|\s+•\s+|\s+[-|]\s+/)[0].trim();
                    if (/^instagram$/i.test(name)) name = "";
                    image = source.image(link);
                }
            } catch (e) { /* not a full URL */ }
            if (!accounts.has(key)) accounts.set(key, { user, name, image });
            else {
                const known = accounts.get(key);
                known.name ||= name;
                known.image ||= image;
            }
            if (accounts.size >= MAX_ACCOUNTS) break;
        }
        return [...accounts.values()];
    };

    class SearchBusy extends Error {}

    const searchSources = async query => {
        let emptyAnswer = false;
        let busy = false;
        let lastError = null;
        for (const source of SOURCES) {
            if ((coolingUntil.get(source.name) || 0) > Date.now()) {
                busy = true;
                continue;
            }
            try {
                const { status, body } = await fetchPage(source.url(query));
                if (source.limited(status, body)) {
                    coolingUntil.set(source.name, Date.now() + COOLDOWN_MS);
                    busy = true;
                    continue;
                }
                if (status !== 200) {
                    lastError = new Error(`${source.name}: HTTP ${status}`);
                    continue;
                }
                const accounts = parseAccounts(source, body);
                if (accounts.length) return accounts;
                emptyAnswer = true;
            } catch (error) {
                lastError = error;
            }
        }
        if (emptyAnswer) return [];
        if (busy) throw new SearchBusy("busy");
        throw lastError || new Error("no source answered");
    };

    // Found accounts are kept for the page's lifetime; a failed search is not,
    // so it is tried again later.
    const accountCache = new Map();
    const findAccounts = query => {
        const key = query.toLowerCase();
        if (!accountCache.has(key)) {
            accountCache.set(key, searchSources(query).catch(error => {
                accountCache.delete(key);
                throw error;
            }));
        }
        return accountCache.get(key);
    };

    // Profile pictures for the account list. Two sources, both used sparingly:
    // the thumbnail Brave sometimes puts next to a result (free, it came with
    // the results page), and otherwise the account's own profile page, for the
    // first few accounts only. fetchImageData comes from platform.js;
    // loadSetting and saveSetting keep what Instagram said for a day.

    // Profile pictures. Instagram's Content-Security-Policy only lets the page
    // show images from its own servers, data: and blob:, so fetchImageData
    // (platform.js) fetches the picture and hands it over as a data: URL. Each
    // picture is fetched once per page, also when it failed.
    const imageCache = new Map();
    const fetchImage = url => {
        if (!imageCache.has(url)) imageCache.set(url, fetchImageData(url));
        return imageCache.get(url);
    };

    // Instagram's own picture: the og:image of the account's profile page, which
    // is its profile picture (the same file the page shows as the avatar). The
    // page is fetched from this page (same origin, the visitor's own cookies),
    // like opening the profile, and only read until that tag, about the first
    // 100 KB. Instagram's profile API (web_profile_info) is no use here: logged
    // out, it answers 401 "please wait" (seen in Safari and Chrome, 28 Oct 2026).
    // The picture lies on Instagram's CDN, which the page's CSP allows, so the
    // <img> can use it as it is. Each request still counts toward Instagram's
    // limit for visitors, so: only the accounts in the list (PICTURES_PER_LIST), one
    // request at a time, an answer kept for a day, and a 10-minute pause when
    // Instagram refuses or sends the login page.
    const PICTURES_PER_LIST = MAX_ACCOUNTS;
    const PICTURE_TTL_MS = 24 * 60 * 60 * 1000;
    const PICTURE_PAUSE_MS = 10 * 60 * 1000;
    const PICTURE_CACHE_SIZE = 200;
    const PROFILE_READ_LIMIT = 400 * 1024;
    const INSTAGRAM_IMAGE = /^https:\/\/[^/]+\.(?:cdninstagram\.com|fbcdn\.net)\//;
    const OG_IMAGE = /<meta property="og:image" content="([^"]+)"/;

    class PicturesPaused extends Error {}

    // Saved as JSON text: not every userscript manager stores objects.
    const loadJson = async key => {
        try {
            return JSON.parse((await loadSetting(key)) || "null");
        } catch (e) {
            return null;
        }
    };

    // The og:image of a profile page, reading only as far as needed.
    const readOgImage = async response => {
        let html = "";
        const reader = response.body?.getReader?.();
        if (!reader) html = await response.text();
        else {
            const decoder = new TextDecoder();
            while (html.length < PROFILE_READ_LIMIT && !OG_IMAGE.test(html)) {
                const { done, value } = await reader.read();
                if (done) break;
                html += decoder.decode(value, { stream: true });
            }
            reader.cancel().catch(() => {});
        }
        const found = html.match(OG_IMAGE)?.[1] || "";
        return found.replace(/&amp;/g, "&");
    };

    const askInstagram = async user => {
        const now = Date.now();
        const cache = (await loadJson("pictures")) || {};
        const known = cache[user.toLowerCase()];
        if (known && now - known.at < PICTURE_TTL_MS) return known.url;
        if (((await loadJson("picturesPausedUntil")) || 0) > now) throw new PicturesPaused("paused");

        const pause = async reason => {
            await saveSetting("picturesPausedUntil", JSON.stringify(now + PICTURE_PAUSE_MS));
            throw new PicturesPaused(reason);
        };
        let response, found = "";
        try {
            response = await fetch(`https://${location.host}/${encodeURIComponent(user)}/`, { credentials: "include" });
            if (response.ok && !/\/accounts\/login/.test(response.url || "")) found = await readOgImage(response);
        } catch (e) {
            throw new Error("network error");
        }
        // A refusal, or the login page instead of the profile: Instagram wants a
        // login, so stop asking for now.
        if ([400, 401, 403, 429].includes(response.status) || /\/accounts\/login/.test(response.url || "")) {
            return pause(`Instagram HTTP ${response.status}`);
        }
        // 404: no such account, so no picture, and that answer is kept too. An
        // account that does not exist (any more) comes back logged out as 200
        // without og:image (checked in Chrome, 28 Oct 2026): also "no picture",
        // kept for a day, and no pause, so one stale search result does not cost
        // the pictures of the whole list.
        if (!response.ok && response.status !== 404) throw new Error(`Instagram HTTP ${response.status}`);

        const url = INSTAGRAM_IMAGE.test(found) ? found : "";
        const fresh = Object.entries(cache)
            .filter(([, entry]) => now - entry.at < PICTURE_TTL_MS)
            .slice(-(PICTURE_CACHE_SIZE - 1));
        await saveSetting("pictures", JSON.stringify(Object.fromEntries([...fresh, [user.toLowerCase(), { url, at: now }]])));
        return url;
    };

    // One request at a time. `wanted` is asked again just before the request,
    // so a list that was replaced in the meantime costs nothing.
    let pictureQueue = Promise.resolve();
    const instagramPicture = (user, wanted = () => true) => {
        const turn = pictureQueue.then(() => wanted() ? askInstagram(user) : "");
        pictureQueue = turn.catch(() => {});
        return turn;
    };

    // The picture for the i-th account in the list: Brave's thumbnail when it
    // has one, else Instagram's for the first few. Resolves with an image URL,
    // or "" for none (the letter stays).
    const accountPicture = ({ user, image }, index, wanted) => {
        const fromInstagram = () => index < PICTURES_PER_LIST ? instagramPicture(user, wanted) : "";
        return (image ? fetchImage(image).catch(fromInstagram) : Promise.resolve().then(fromInstagram)).catch(() => "");
    };

    // What the userscript manager offers the shared code: settings, the
    // script menu and cross-site requests. Settings in the userscript manager. Userscripts (Safari) only offers
    // GM.getValue/GM.setValue; Tampermonkey offers both.
    const loadSetting = async key => {
        try {
            if (typeof GM !== "undefined" && GM.getValue) return await GM.getValue(key);
            if (typeof GM_getValue === "function") return GM_getValue(key);
        } catch (e) { /* no storage: use the default */ }
        return undefined;
    };
    const saveSetting = async (key, value) => {
        try {
            if (typeof GM !== "undefined" && GM.setValue) return await GM.setValue(key, value);
            if (typeof GM_setValue === "function") return GM_setValue(key, value);
        } catch (e) { /* no storage: choice lasts until the page closes */ }
    };

    // Userscript managers tell no other tab about a change: a new choice
    // counts from the next page load.
    const watchSettings = () => {};

    // The viewer choice lives in the script menu (Tampermonkey, Violentmonkey).
    const addViewerMenu = () => {
        if (typeof GM_registerMenuCommand !== "function") return;
        VIEWER_LIST.forEach(viewer => {
            const label = currentViewer.name === viewer.name ? `✅ ${viewer.name}` : viewer.name;
            GM_registerMenuCommand(label, async () => {
                await saveSetting("currentViewer", viewer.name);
                currentViewer = viewer;
            });
        });
    };

    // A page on instagram.com cannot fetch another site itself (CORS), so
    // this goes through the userscript manager: GM.xmlHttpRequest in
    // Userscripts (Safari), GM_xmlhttpRequest in Tampermonkey. One GET,
    // without the visitor's cookies for that site (anonymous). Resolves with
    // the manager's response; rejects on an error or a timeout, also when the
    // manager reports it only through the promise it returns, or not at all.
    const gmRequest = () => (typeof GM !== "undefined" && GM.xmlHttpRequest) ||
        (typeof GM_xmlhttpRequest === "function" && GM_xmlhttpRequest);
    const GM_TIMEOUT_MS = 10000;
    const gmGet = (url, responseType) => new Promise((resolve, reject) => {
        const request = gmRequest();
        if (!request) return reject(new Error("no cross-site requests"));
        const guard = setTimeout(() => reject(new Error("timed out")), GM_TIMEOUT_MS + 5000);
        const settle = (fn, value) => {
            clearTimeout(guard);
            fn(value);
        };
        request({
            method: "GET", url, timeout: GM_TIMEOUT_MS, responseType, anonymous: true,
            onload: response => settle(resolve, response),
            onerror: () => settle(reject, new Error("network error")),
            ontimeout: () => settle(reject, new Error("timed out")),
        })?.catch?.(() => settle(reject, new Error("network error")));
    });

    // A results page: { status, body } for any answer.
    const fetchPage = async url => {
        const response = await gmGet(url, "text");
        const body = response.responseText ?? response.response;
        return { status: response.status, body: typeof body === "string" ? body : "" };
    };

    // A profile picture as a data: URL (see fetchImage in pictures.js). Larger
    // files are refused; background.js has the same limit for the extension.
    const MAX_IMAGE_BYTES = 1024 * 1024;
    const fetchImageData = async url => {
        const response = await gmGet(url, "blob");
        const blob = response.response;
        if (response.status !== 200 || !/^image\//.test(blob?.type || "")) throw new Error(`image HTTP ${response.status}`);
        if (!blob.size || blob.size > MAX_IMAGE_BYTES) throw new Error("image too large or empty");
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    };

    // The logic itself, shared by the userscript and the extension. It runs
    // inside a wrapper after shared.js, names.js, search.js and one of the
    // platform.js files, which give it loadSetting, saveSetting,
    // watchSettings, addViewerMenu and fetchPage.

    const findViewer = name => VIEWER_LIST.find(v => v.name === name);
    let currentViewer = findViewer(DEFAULT_VIEWER) || VIEWER_LIST[0];

    // /p/CODE, /reel/CODE, and /username/p/CODE
    function postCode(parts) {
        for (let i = 0; i < Math.min(parts.length - 1, 2); i++) {
            if (POST_PATHS.has(parts[i].toLowerCase())) return parts[i + 1];
        }
        return null;
    }

    function getRedirectUrl(href) {
        let url;
        try {
            url = new URL(href, location.href);
        } catch (e) {
            return null;
        }
        if (!INSTA_HOST.test(url.hostname)) return null;

        let path = url.pathname;
        if (path.startsWith("/accounts/login")) {
            const next = url.searchParams.get("next");
            if (!next) return null;
            try {
                const nextUrl = new URL(next, "https://www.instagram.com");
                if (!INSTA_HOST.test(nextUrl.hostname)) return null;
                path = nextUrl.pathname;
            } catch (e) {
                return null;
            }
        }

        const parts = path.split("/").filter(Boolean);
        const code = postCode(parts);
        if (code) return currentViewer.postPrefix + code;
        const user = parts[0];
        return isUsername(user) ? currentViewer.profilePrefix + user : null;
    }

    const onInstagram = INSTA_HOST.test(location.hostname);

    // On instagram.com itself: only leave the login page. Instagram changes the
    // URL without reloading, so check the address now and then (a cheap string
    // compare), and redirect at most once per page.
    let settingsLoaded = false;
    let redirected = false;
    const checkLoginPage = () => {
        if (!settingsLoaded || redirected || !location.pathname.startsWith("/accounts/login")) return;
        const target = getRedirectUrl(location.href);
        if (target) {
            redirected = true;
            location.replace(target);
        }
    };

    // Instagram's logged-out pop-up ("See photos, videos and more ... Sign up /
    // Log in"). A dialog only counts when it offers login or sign-up, so the
    // dialogs of a logged-in user are left alone. With a close button: press
    // it. Without one (the hard login wall): go to the viewer, or hide it.
    const LOGIN_LINK = 'a[href*="/accounts/login"], a[href*="/accounts/emailsignup"]';
    const LOGIN_TEXT = /^(log in|sign up|inloggen|aanmelden|registreren)$/i;
    const CLOSE_BUTTON = '[aria-label="Close"], [aria-label="Sluiten"]';
    const pressedAt = new WeakMap();

    // The text check only looks at small dialogs: the login pop-up has a few
    // buttons, a logged-in post with comments has many.
    const isLoginPopup = dialog => {
        if (dialog.querySelector(LOGIN_LINK)) return true;
        const buttons = dialog.querySelectorAll('a, button, [role="button"]');
        return buttons.length <= 8 &&
            [...buttons].filter(el => LOGIN_TEXT.test(el.textContent.trim())).length >= 2;
    };

    // The X sits on the overlay around the dialog, not always inside it.
    const findCloseButton = dialog => {
        for (let el = dialog, depth = 0; el && el !== document.body && depth < 6; el = el.parentElement, depth++) {
            const close = el.querySelector(CLOSE_BUTTON);
            if (close) return close.closest('button, [role="button"]') || close;
        }
        return null;
    };

    const hideOverlay = dialog => {
        let overlay = dialog;
        for (let el = dialog; el && el !== document.body; el = el.parentElement) {
            if (getComputedStyle(el).position === "fixed") overlay = el;
        }
        overlay.style.setProperty("display", "none", "important");
    };

    const hidePopup = dialog => {
        hideOverlay(dialog);
        for (const el of [document.documentElement, document.body]) {
            el.style.setProperty("overflow", "auto", "important");
        }
    };

    const checkLoginPopup = () => {
        for (const dialog of document.querySelectorAll('[role="dialog"]')) {
            if (!isLoginPopup(dialog)) continue;
            if (pressedAt.has(dialog)) {
                // Pressed the X but it is still there: hide it ourselves.
                if (Date.now() - pressedAt.get(dialog) > 1500) hidePopup(dialog);
                continue;
            }
            const close = findCloseButton(dialog);
            if (close) {
                // Hide it before it is drawn, then let Instagram close it
                // properly (that also gives the page its scrolling back).
                hideOverlay(dialog);
                pressedAt.set(dialog, Date.now());
                close.click();
            } else if (settingsLoaded && !redirected && getRedirectUrl(location.href)) {
                redirected = true;
                location.replace(getRedirectUrl(location.href));
            } else {
                hidePopup(dialog);
            }
        }
    };

    // The logo leads to "/", which is only a login form when logged out, and
    // Instagram has no search without login. So "/" shows this search box
    // instead (on load, and when the logo is clicked). When you pause typing,
    // it asks a search engine for Instagram accounts (site:instagram.com, see
    // SOURCES in search.js) and lists them; a username or link goes straight to that
    // account. The button opens Brave's results page in the browser.
    let searchHost = null;
    let language = "en";
    const strings = () => LANGUAGES[language] || LANGUAGES.en;

    const closeSearch = () => {
        searchHost?.remove();
        searchHost = null;
    };

    const applyLanguage = root => {
        const t = strings();
        const box = root.querySelector(".box");
        box.dir = t.rtl ? "rtl" : "ltr";
        box.setAttribute("aria-label", t.title);
        root.querySelector("h2").textContent = t.title;
        root.querySelector(".help").textContent = t.help;
        root.querySelector("input").placeholder = t.example;
        root.querySelector(".primary").textContent = t.open;
        root.querySelector(".secondary").textContent = t.search;
        root.querySelector(".close").setAttribute("aria-label", t.close);
        root.querySelector(".close").title = t.close;
        root.querySelector("select").setAttribute("aria-label", t.language);
        root.querySelector("select").title = t.language;
    };

    const openSearch = () => {
        if (searchHost) return searchHost.shadowRoot.querySelector("input").focus();
        searchHost = document.createElement("div");
        // A shadow root keeps Instagram's styles out, and keeps this dialog
        // out of checkLoginPopup's querySelectorAll.
        const root = searchHost.attachShadow({ mode: "open" });
        root.innerHTML = `
            <style>
                :host { all: initial; }
                .backdrop { position: fixed; inset: 0; z-index: 2147483647; display: flex;
                    align-items: flex-start; justify-content: center; padding: 15vh 16px 0;
                    background: rgba(0, 0, 0, .6);
                    font: 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                .box { position: relative; width: min(440px, 100%); box-sizing: border-box; padding: 24px;
                    border-radius: 16px; background: #fff; color: #000; box-shadow: 0 10px 40px rgba(0, 0, 0, .3); }
                h2 { margin: 0 0 4px; padding-inline-end: 32px; font-size: 20px; }
                .help { margin: 0 0 16px; color: #737373; font-size: 13px; line-height: 1.4; }
                input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #dbdbdb;
                    border-radius: 8px; font: inherit; background: #fafafa; color: inherit; }
                .results { margin: 6px 0 0; padding: 4px; list-style: none; border: 1px solid #dbdbdb;
                    border-radius: 8px; max-height: 300px; overflow-y: auto; }
                .results[hidden] { display: none; }
                .results li { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px;
                    cursor: pointer; }
                .results li[aria-selected="true"], .results li:hover { background: rgba(128, 128, 128, .15); }
                .results .name { font-weight: 600; }
                .results .text { display: flex; flex-direction: column; min-width: 0; }
                .results .avatar { flex: none; display: grid; place-items: center; width: 36px; height: 36px;
                    overflow: hidden; border-radius: 50%; color: #fff; font-weight: 600; font-size: 15px; }
                .results .avatar img { width: 100%; height: 100%; object-fit: cover; }
                .results .user, .results .status { color: #737373; font-size: 13px; }
                .results .status { cursor: default; }
                .row { display: flex; gap: 8px; margin-top: 12px; }
                .row button { flex: 1; padding: 9px 12px; border: 0; border-radius: 8px; font: inherit;
                    font-weight: 600; cursor: pointer; }
                .primary { background: #0095f6; color: #fff; }
                .secondary { background: #efefef; color: #000; }
                .close { position: absolute; top: 14px; inset-inline-end: 14px; width: 32px; height: 32px;
                    padding: 0; border: 0; border-radius: 50%; background: none; color: inherit;
                    font: 22px/32px sans-serif; cursor: pointer; }
                .close:hover { background: rgba(128, 128, 128, .15); }
                .footer { display: flex; justify-content: flex-end; margin-top: 14px; }
                select { padding: 4px 6px; border: 1px solid #dbdbdb; border-radius: 6px; font: 13px inherit;
                    font-family: inherit; background: transparent; color: #737373; cursor: pointer; }
                @media (prefers-color-scheme: dark) {
                    .box { background: #262626; color: #f5f5f5; }
                    input { background: #121212; border-color: #363636; }
                    .results { border-color: #363636; }
                    .results .user, .results .status { color: #a8a8a8; }
                    .secondary { background: #363636; color: #f5f5f5; }
                    select { border-color: #363636; color: #a8a8a8; }
                    select option { background: #262626; color: #f5f5f5; }
                }
            </style>
            <div class="backdrop">
                <form class="box" role="dialog">
                    <button type="button" class="close">✕</button>
                    <h2></h2>
                    <p class="help"></p>
                    <input name="q" autocomplete="off" autocapitalize="off" spellcheck="false"
                           role="combobox" aria-autocomplete="list" aria-controls="results" aria-expanded="false">
                    <ul class="results" id="results" role="listbox" hidden></ul>
                    <div class="row">
                        <button type="submit" class="primary"></button>
                        <button type="button" class="secondary"></button>
                    </div>
                    <div class="footer"><select></select></div>
                </form>
            </div>`;

        const input = root.querySelector("input");
        const list = root.querySelector(".results");
        const select = root.querySelector("select");
        // Built as nodes, so the markup above holds no values at all.
        for (const [code, l] of Object.entries(LANGUAGES)) select.append(new Option(`${l.flag} ${l.name}`, code));
        select.value = LANGUAGES[language] ? language : "en";
        applyLanguage(root);

        const openAccount = user => location.assign(`https://www.instagram.com/${user}/`);
        const searchWeb = () => location.assign(webSearchUrl(input.value.trim()));

        // The dropdown. `shown` holds the accounts on screen, `active` the
        // one picked with the arrow keys (-1: none).
        let shown = [];
        let active = -1;
        let latest = 0;
        let typingTimer = null;

        const showStatus = message => {
            shown = [];
            active = -1;
            list.replaceChildren();
            const item = document.createElement("li");
            item.className = "status";
            item.textContent = message;
            list.append(item);
            list.hidden = false;
            input.setAttribute("aria-expanded", "true");
        };
        const hideList = () => {
            shown = [];
            active = -1;
            list.hidden = true;
            input.setAttribute("aria-expanded", "false");
        };
        const showAccounts = accounts => {
            if (!accounts.length) return showStatus(strings().noResults);
            shown = accounts;
            active = -1;
            list.replaceChildren(...accounts.map(({ user, name, image }, i) => {
                const item = document.createElement("li");
                item.setAttribute("role", "option");
                item.id = `account-${i}`;
                // The first letter on a colour of its own until (or unless)
                // the picture arrives.
                const avatar = document.createElement("span");
                avatar.className = "avatar";
                avatar.setAttribute("aria-hidden", "true");
                avatar.textContent = (name || user).charAt(0).toUpperCase();
                const hue = [...user].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) % 360, 7);
                avatar.style.background = `hsl(${hue} 45% 45%)`;
                // The picture replaces the letter once it has loaded; if it does
                // not load, the letter stays (see accountPicture in pictures.js).
                accountPicture({ user, image }, i, () => item.isConnected).then(src => {
                    if (!src) return;
                    const picture = document.createElement("img");
                    picture.alt = "";
                    picture.onload = () => avatar.replaceChildren(picture);
                    picture.src = src;
                });
                const label = document.createElement("span");
                label.className = "text";
                const title = document.createElement("span");
                title.className = "name";
                title.textContent = name || `@${user}`;
                label.append(title);
                if (name) {
                    const handle = document.createElement("span");
                    handle.className = "user";
                    handle.textContent = `@${user}`;
                    label.append(handle);
                }
                item.append(avatar, label);
                // mousedown, not click: it fires before the input loses focus.
                item.addEventListener("mousedown", event => {
                    event.preventDefault();
                    openAccount(user);
                });
                return item;
            }));
            list.hidden = false;
            input.setAttribute("aria-expanded", "true");
        };
        const highlight = index => {
            active = index;
            list.querySelectorAll('[role="option"]').forEach((item, i) => {
                item.setAttribute("aria-selected", String(i === index));
                if (i === index) item.scrollIntoView?.({ block: "nearest" });
            });
            if (index >= 0) input.setAttribute("aria-activedescendant", `account-${index}`);
            else input.removeAttribute("aria-activedescendant");
        };

        // Wait until typing pauses, so a word costs one search, not one per
        // letter. Only the newest search may fill the list.
        input.addEventListener("input", () => {
            clearTimeout(typingTimer);
            const query = input.value.trim();
            if (query.length < 3 || /^https?:\/\//i.test(query)) {
                latest++; // a search still running may no longer fill the list
                return hideList();
            }
            typingTimer = setTimeout(() => {
                const ticket = ++latest;
                showStatus(strings().searching);
                findAccounts(query).then(
                    accounts => ticket === latest && showAccounts(accounts),
                    error => {
                        console.warn("[Instagram No Login] account search failed:", error);
                        if (ticket !== latest) return;
                        showStatus(error instanceof SearchBusy ? strings().busy
                            : `${strings().failed} (${error?.message || error})`);
                    });
            }, 600);
        });
        input.addEventListener("keydown", event => {
            if (!shown.length) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                // Cycle through the accounts and back to the input (-1).
                let next = active + (event.key === "ArrowDown" ? 1 : -1);
                if (next < -1) next = shown.length - 1;
                if (next >= shown.length) next = -1;
                highlight(next);
            }
        });

        root.querySelector("form").addEventListener("submit", event => {
            event.preventDefault();
            if (active >= 0 && shown[active]) return openAccount(shown[active].user);
            if (!input.value.trim()) return;
            const user = usernameFrom(input.value);
            if (user) openAccount(user);
            else searchWeb();
        });
        root.querySelector(".secondary").addEventListener("click", () => {
            if (input.value.trim()) searchWeb();
        });
        root.querySelector(".close").addEventListener("click", closeSearch);
        select.addEventListener("change", () => {
            language = select.value;
            saveSetting("language", language);
            applyLanguage(root);
            input.focus();
        });
        root.querySelector(".backdrop").addEventListener("click", event => {
            if (event.target === event.currentTarget) closeSearch();
        });
        // Keep typing away from Instagram's own keyboard handling.
        root.addEventListener("keydown", event => {
            event.stopPropagation();
            if (event.key === "Escape") closeSearch();
        });

        (document.body || document.documentElement).append(searchHost);
        input.focus();
    };

    // Logged out, Instagram never plays stories: it only sends them to
    // logged-in visitors. So a story opens on Imginn instead, from a link to
    // /stories/<username>/ or from the ring around a profile picture (a
    // button in the profile header that draws the ring on a canvas, with no
    // link). Highlights (/stories/highlights/<id>/) carry no username, so
    // they are left alone. Pixnoy has no known stories page: always Imginn.
    const IMGINN_STORIES = "https://imginn.com/stories/";
    const storyOwner = target => {
        const link = target.closest("a[href]");
        if (link) {
            let url;
            try {
                url = new URL(link.href, location.href);
            } catch (e) {
                return null;
            }
            const [first, user] = url.pathname.split("/").filter(Boolean);
            if (!INSTA_HOST.test(url.hostname) || first?.toLowerCase() !== "stories") return null;
            return user && user.toLowerCase() !== "highlights" && isUsername(user) ? user : null;
        }
        const ring = target.closest('header [role="button"]');
        if (!ring?.querySelector("canvas")) return null;
        const user = location.pathname.split("/").filter(Boolean)[0];
        return isUsername(user) ? user : null;
    };

    if (onInstagram) {
        // Logged out, "/" is only a login form: show the search box there,
        // once per visit (after closing it, the login form stays usable).
        let homeSearchShown = false;
        const checkHome = () => {
            if (location.pathname !== "/") {
                homeSearchShown = false;
                return;
            }
            if (homeSearchShown || !settingsLoaded || !document.body || !loggedOut()) return;
            homeSearchShown = true;
            openSearch();
        };

        let lastHref = "";
        const tick = () => {
            if (location.href !== lastHref) {
                lastHref = location.href;
                checkLoginPage();
            }
            checkLoginPopup();
            checkHome();
        };
        setInterval(tick, 500);
        window.addEventListener("popstate", tick);
        document.addEventListener("DOMContentLoaded", checkHome);

        // The interval alone lets the pop-up show for up to half a second. A
        // MutationObserver runs right after Instagram adds it, before the
        // browser draws the next frame, so it is never seen. Only on Instagram,
        // and it only looks for dialogs, so it stays cheap.
        new MutationObserver(checkLoginPopup)
            .observe(document.documentElement, { childList: true, subtree: true });

        // Logged out, Instagram answers a click on a post or account name with
        // the login pop-up instead of going there. Load it as a normal page
        // instead: a post or account opened directly is shown, and if Instagram
        // sends that to the login page after all, checkLoginPage moves on to
        // the viewer. The logo (a link to "/") opens the search box, and a
        // story opens on Imginn (see storyOwner).
        // Links to /accounts/ (the "Log in" button) are left alone, and so is
        // every click when logged in: Instagram sets ds_user_id after login.
        // A stale ds_user_id can stay behind after the session ended, so the
        // page itself decides too: logged out, every page (profile, post, reel,
        // explore, home) has a "Log in" or "Sign up" link; logged in, none.
        // Both are read at the moment of the click, so logging in, also again
        // with the same account, counts at once.
        const loggedOut = () =>
            !/(?:^|;\s*)ds_user_id=/.test(document.cookie) || !!document.querySelector(LOGIN_LINK);
        window.addEventListener("click", event => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (!(event.target instanceof Element) || !loggedOut()) return;
            const owner = storyOwner(event.target);
            if (owner) {
                event.preventDefault();
                event.stopImmediatePropagation();
                location.assign(`${IMGINN_STORIES}${owner}/`);
                return;
            }
            const link = event.target.closest("a[href]");
            if (!link) return;
            let url;
            try {
                url = new URL(link.href, location.href);
            } catch (e) {
                return;
            }
            if (!INSTA_HOST.test(url.hostname) || url.pathname.startsWith("/accounts/")) return;
            const isHome = url.pathname === "/";
            if (!isHome && !getRedirectUrl(url.href)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (isHome) openSearch();
            else location.assign(url.href);
        }, true);
    }

    // A saved setting, or one changed in the extension pop-up while the page
    // is open.
    const applySetting = (key, value) => {
        // Version 1.0 saved the whole viewer object, 1.1 saves its name.
        if (key === "currentViewer") currentViewer = findViewer(value?.name ?? value) || currentViewer;
        if (key === "language" && LANGUAGES[value]) {
            language = value;
            if (searchHost) {
                searchHost.shadowRoot.querySelector("select").value = language;
                applyLanguage(searchHost.shadowRoot);
            }
        }
    };

    (async () => {
        applySetting("currentViewer", await loadSetting("currentViewer"));
        applySetting("language", await loadSetting("language"));
        settingsLoaded = true;
        watchSettings(applySetting);
        addViewerMenu();

        if (onInstagram) checkLoginPage();
    })();
})();
