(() => {
    'use strict';

    const COLORS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink', 'white'];
    const COLOR_LABELS = {
        ru: { red: 'Красный', orange: 'Оранжевый', yellow: 'Жёлтый', green: 'Зелёный', teal: 'Бирюзовый', blue: 'Синий', indigo: 'Индиго', purple: 'Фиолетовый', pink: 'Розовый', white: 'Белый' },
        en: { red: 'Red', orange: 'Orange', yellow: 'Yellow', green: 'Green', teal: 'Teal', blue: 'Blue', indigo: 'Indigo', purple: 'Purple', pink: 'Pink', white: 'White' }
    };
    const EMOJI = ['💧', '🏃', '📚', '🧘', '😴', '🥗', '💪', '✍️', '🎧', '🧠', '☀️', '🚭', '🦷', '🎨', '🌿', '🧹', '💊', '🚴', '🎹', '🙏', '🍎', '📵', '🐕', '🧴'];
    const DOW_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const DOW_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const DOW = () => settings.lang === 'en' ? DOW_EN : DOW_RU;
    const C = 2 * Math.PI * 46, DEL_W = 98, WEEKS_BACK = 260, WEEKS_AHEAD = 104;
    const isFine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ---------- helpers ----------
    const $ = (s, r = document) => r.querySelector(s);
    const pad = n => String(n).padStart(2, '0');
    const key = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
    const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const wd = d => (d.getDay() + 6) % 7;
    const mondayOf = d => addDays(d, -wd(d));
    const same = (a, b) => key(a) === key(b);
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const uid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const plural = (n, a, b, c) => { const m = n % 100, d = n % 10; if (m > 10 && m < 20) return c; if (d === 1) return a; if (d >= 2 && d <= 4) return b; return c; };
    const fmtDay = d => d.toLocaleDateString(locale(), { day: 'numeric', month: 'long' });
    const checkSVG = '<svg class="ck" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    const clockSVG = '<svg class="clk" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
    const cs = c => `--c:var(--c-${c});--g:var(--g-${c})`;
    const tickSVG = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

    // ---------- state ----------
    // habits: {id,name,emoji,color,days[],created,once,endedAt?}
    // over[date] = {add:[ids], skip:[ids]}  — ручные правки плана для сегодня и будущих дней
    // past[date] = [ids]                    — зафиксированный план прошедших дней
    // log[date]  = [ids]                    — что выполнено
    let today = startOfDay(new Date()), clockBehind = false;
    let sel = today, tab = 'today', popId = null, unpopId = null, heroFirst = true;
    const pc = new Map();
    let state;
    function detectLang() {
        try { const s = localStorage.getItem('habits.lang'); if (s === 'ru' || s === 'en') return s; } catch (e) { }
        return String(navigator.language || 'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en';
    }
    function detectTheme() {
        try { const s = localStorage.getItem('habits.theme'); if (s === 'light' || s === 'dark' || s === 'system') return s; } catch (e) { }
        return 'system';
    }
    let settings = { theme: detectTheme(), motion: true, lang: detectLang() };

    // ---------- i18n ----------
    const LANG = {
        ru: {
            appName: 'Привычки', today: 'Сегодня', dayTab: 'День', yesterday: 'Вчера', tomorrow: 'Завтра',
            stats: 'Статистика', settings: 'Настройки', progressSub: 'Ваш прогресс', appearanceSub: 'Профиль и оформление',
            appearance: 'Внешний вид', theme: 'Тема', themeAuto: 'Авто', themeLight: 'Светлая', themeDark: 'Тёмная',
            behavior: 'Поведение', animations: 'Анимации',
            account: 'Аккаунт', yourProfile: 'Ваш профиль', personalData: 'Личные данные', nickname: 'Никнейм', email: 'Email', emailFull: 'Электронная почта', signOut: 'Выйти', changeEmail: 'Сменить email', newEmail: 'Новый email', saveEmail: 'Сохранить email', emailChanged: 'Email изменён. Проверьте почту для подтверждения.', emailInvalid: 'Введите корректный email', emailHint: 'После смены придёт письмо для подтверждения.', changePassword: 'Сменить пароль', changePasswordHint: 'Сменить пароль', oldPassword: 'Текущий пароль', rememberSession: 'Запомнить вход на этом устройстве', forgotPassword: 'Забыли пароль?', resetSent: 'Письмо для сброса пароля отправлено', fillAll: 'Заполните все поля', nickRequired: 'Введите никнейм', nickHint: 'От 2 до 24 символов.', nickShort: 'Никнейм — от 2 до 24 символов', profileSaved: 'Сохранено', wrongOldPass: 'Неверный текущий пароль', newPassword: 'Новый пароль', savePassword: 'Сохранить пароль', passChanged: 'Пароль изменён', passShort: 'Минимум 8 символов', passLong: 'Не больше 72 символов', passRules: 'Не меньше 8 символов, буква и цифра', passNeedMix: 'Добавьте букву и цифру', passCommon: 'Слишком простой пароль', passPersonal: 'Пароль не должен содержать ваш email или никнейм', passFair: 'Слабый, но допустимый', passGood: 'Хороший пароль', passStrong: 'Надёжный пароль', showPassword: 'Показать пароль', hidePassword: 'Скрыть пароль', samePassword: 'Новый пароль должен отличаться от текущего',
            cancel: 'Отмена', add: 'Добавить', save: 'Сохранить',
            newHabit: 'Новая привычка', habit: 'Привычка', addToDay: 'Добавить в день',
            newTab: 'Новая', fromList: 'Из списка',
            name: 'Название', color: 'Цвет', icon: 'Значок', repeat: 'Повторять', delete: 'Удалить…',
            editNote: 'Изменения действуют с сегодняшнего дня. Прошлые дни не меняются.',
            listHint: 'Выберите привычку, которую нужно добавить в этот день.',
            allAdded: 'Все привычки уже добавлены в этот день.',
            once: 'Один раз', everyDay: 'Каждый день', weekdays: 'По будням', weekends: 'По выходным',
            selectAll: 'Все дни', onlyThisDayQuick: 'Только этот день', onlyTodayQuick: 'Только сегодня', onlyTomorrowQuick: 'Только завтра',
            notRepeat: 'Не повторяется, только',
            calendar: 'Календарь', todayBtn: 'Сегодня',
            copyTitle: 'Копирование', copyBtn: 'Копировать',
            quickSelect: 'Быстрый выбор', dates: 'Даты',
            ifExists: 'Если на день уже есть план', merge: 'Добавить к плану', replace: 'Заменить план',
            tomorrow: 'Завтра', restOfWeek: 'Остаток недели', nextWeek: 'Следующая неделя', allDaysQuick: 'Все дни',
            planFor: 'План на',
            mergeHint: 'Привычки добавятся к уже запланированным. ',
            replaceHint: 'Остальные привычки на выбранные дни уберутся из плана, выполненные сегодня останутся. ',
            notCopied: 'Выполнение не копируется. ', selectDays: 'Выберите дни.', selected: 'Выбрано:',
            copyPlan: 'Скопировать план дня…', clearDay: 'Очистить день',
            onlyToday: 'Только сегодня', onlyThisDay: 'Только в этот день',
            todayAndBeyond: 'Сегодня и далее', thisDayAndBeyond: 'В этот день и далее',
            deleteHabit: 'Удалить привычку', removeFromDay: 'Убрать из дня',
            repeats: 'Привычка повторяется', edit: 'Изменить',
            removedFromDay: 'Убрано из дня', habitDeleted: 'Привычка удалена',
            dayCleared: 'День очищен', addedToDay: 'Добавлено в день',
            planCopied: 'План скопирован:', saveFailed: 'Не удалось сохранить',
            undo: 'Отменить',
            markOnlyToday: 'Отметить можно только в сам день', pastClosed: 'Прошлые дни закрыты для изменений',
            empty: 'Пока пусто', freeDay: 'Свободный день', noPlans: 'Планов не было',
            allDone: 'Всё выполнено', left: 'Осталось ', missed: 'Пропущено ',
            doneOf: 'Выполнено ', of: ' из ',
            markInDay: 'Отметить можно будет в этот день', addHabitsDay: 'Добавьте привычки на этот день',
            nothingScheduled: 'Ничего не запланировано', nothingPlanned: 'На этот день ничего не планировалось',
            noRecords: 'Нет записей', noHabitsDay: 'В этот день привычки не планировались.',
            onTodayNothing: 'На сегодня ничего нет', onDayNothing: 'На этот день ничего нет',
            addFirstHabit: 'Добавьте первую привычку, например стакан воды по утрам.',
            addOrCopy: 'Добавьте привычку или скопируйте план другого дня.',
            addHabitBtn: 'Добавить привычку', habits: 'Привычки', hab1: 'привычка', hab2: 'привычки', hab5: 'привычек',
            done: 'Выполнено', missedL: 'Пропущено',
            streakAria: 'Серия', day: 'день', days2: 'дня', days5: 'дней',
            mark: 'отметить', futureDay: 'будущий день', pastDay: 'прошлый день',
            actions: 'Действия', delete2: 'Удалить',
            pastClosedNote: 'Прошлые дни закрыты для изменений: их можно смотреть и копировать.',
            futureNote: 'Отмечать выполнение можно только в сам день. Заранее можно составить план.',
            noData: 'Нет данных', noDataHint: 'Добавьте привычки и отмечайте их, здесь появится прогресс.',
            done7days: 'выполнено за 7 дней', bestStreakDays: 'Лучшая серия, дн.',
            totalChecks: 'Всего отметок', perfectDays: 'Идеальных дней',
            currentStreak: 'Текущая серия', bestStreak: 'Лучшая серия', over30days: 'За 30 дней',
            needConfig: 'Ошибка',
            needConfigHint: 'Произошёл сбой, мы уже в процессе починки.',
            signInSub: 'Войдите, чтобы синхронизировать данные между устройствами',
            signUpSub: 'Создайте аккаунт — все привычки сохранятся в облаке',
            signIn: 'Войти', signUpTab: 'Регистрация', create: 'Создать', createAccount: 'Создать аккаунт', haveAccount: 'Уже есть аккаунт?',
            gateCopy: 'Синхронизация между устройствами.<br>Данные только ваши.',
            gateF1: 'Серии и статистика по каждой привычке', gateF2: 'План на любой день вперёд', gateF3: 'Данные защищены и доступны только вам',
            authErr: 'Введите email и пароль',
            passMismatch: 'Пароли не совпадают', passRepeat: 'Повторите пароль',
            wrongCreds: 'Неверный email или пароль', emailExists: 'Пользователь с таким email уже есть',
            confirmEmail: 'Подтвердите email по ссылке из письма',
            signupSuccess: 'Регистрация прошла успешно. Проверьте почту для подтверждения.',
            tooMany: 'Слишком много попыток. Попробуйте позже.', lockedFor: 'Слишком много попыток. Повторите через ', secShort: ' с',
            networkErr: 'Нет соединения. Проверьте интернет.',
            recoveryHint: 'Введите новый пароль для вашего аккаунта.',
            error: 'Ошибка',
            clockNote: 'Часы устройства отстают от последней даты в приложении. Используется последняя известная дата.',
            language: 'Язык', russian: 'Русский', english: 'English', by: 'by futuroarchaic', password: 'Пароль', loadFailed: 'Не удалось загрузить данные. Проверьте подключение.', dayActions: 'Действия с днём', openCalendar: 'Открыть календарь', prevWeek: 'Предыдущая неделя', nextWeek: 'Следующая неделя', prevMonth: 'Предыдущий месяц', nextMonth: 'Следующий месяц', prevYear: 'Предыдущий год', nextYear: 'Следующий год', resetDemo: 'Сбросить демо', rmToday: 'Убрать только сегодня', rmThisDay: 'Убрать только из этого дня', delFromToday: 'Удалить привычку с сегодня', delFromThisDay: 'Удалить привычку с этого дня'
        },
        en: {
            appName: 'Habits', today: 'Today', dayTab: 'Day', yesterday: 'Yesterday', tomorrow: 'Tomorrow',
            stats: 'Stats', settings: 'Settings', progressSub: 'Your progress', appearanceSub: 'Profile and appearance',
            appearance: 'Appearance', theme: 'Theme', themeAuto: 'Auto', themeLight: 'Light', themeDark: 'Dark',
            behavior: 'Behavior', animations: 'Animations',
            account: 'Account', yourProfile: 'Your profile', personalData: 'Personal data', nickname: 'Nickname', email: 'Email', emailFull: 'Email', signOut: 'Sign out', changeEmail: 'Change email', newEmail: 'New email', saveEmail: 'Save email', emailChanged: 'Email updated. Check your inbox to confirm.', emailInvalid: 'Enter a valid email', emailHint: 'We will send a confirmation link to the new address.', changePassword: 'Change password', changePasswordHint: 'Change password', oldPassword: 'Current password', rememberSession: 'Stay signed in on this device', forgotPassword: 'Forgot password?', resetSent: 'Password reset email sent', fillAll: 'Fill in all fields', nickRequired: 'Enter a nickname', nickHint: '2–24 characters.', nickShort: 'Nickname must be 2–24 characters', profileSaved: 'Saved', wrongOldPass: 'Wrong current password', newPassword: 'New password', savePassword: 'Save password', passChanged: 'Password updated', passShort: 'At least 8 characters', passLong: 'No more than 72 characters', passRules: 'At least 8 characters, a letter and a number', passNeedMix: 'Add a letter and a number', passCommon: 'This password is too common', passPersonal: 'Password must not contain your email or nickname', passFair: 'Weak but acceptable', passGood: 'Good password', passStrong: 'Strong password', showPassword: 'Show password', hidePassword: 'Hide password', samePassword: 'New password must be different',
            cancel: 'Cancel', add: 'Add', save: 'Save',
            newHabit: 'New habit', habit: 'Habit', addToDay: 'Add to day',
            newTab: 'New', fromList: 'From list',
            name: 'Name', color: 'Color', icon: 'Icon', repeat: 'Repeat', delete: 'Delete…',
            editNote: 'Changes apply from today. Past days are not affected.',
            listHint: 'Pick a habit to add to this day.',
            allAdded: 'All habits are already on this day.',
            once: 'Once', everyDay: 'Every day', weekdays: 'Weekdays', weekends: 'Weekends',
            selectAll: 'All days', onlyThisDayQuick: 'Only this day', onlyTodayQuick: 'Only today', onlyTomorrowQuick: 'Only tomorrow',
            notRepeat: "Doesn't repeat, only",
            calendar: 'Calendar', todayBtn: 'Today',
            copyTitle: 'Copy', copyBtn: 'Copy',
            quickSelect: 'Quick select', dates: 'Dates',
            ifExists: 'If a day already has a plan', merge: 'Add to plan', replace: 'Replace plan',
            tomorrow: 'Tomorrow', restOfWeek: 'Rest of week', nextWeek: 'Next week', allDaysQuick: 'All days',
            planFor: 'Plan for',
            mergeHint: 'Habits will be added to existing ones. ',
            replaceHint: 'Other habits on selected days will be removed from the plan, today\'s completions stay. ',
            notCopied: 'Completions are not copied. ', selectDays: 'Select days.', selected: 'Selected:',
            copyPlan: 'Copy day plan…', clearDay: 'Clear day',
            onlyToday: 'Only today', onlyThisDay: 'Only this day',
            todayAndBeyond: 'Today and beyond', thisDayAndBeyond: 'This day and beyond',
            deleteHabit: 'Delete habit', removeFromDay: 'Remove from day',
            repeats: 'Habit repeats', edit: 'Edit',
            removedFromDay: 'Removed from day', habitDeleted: 'Habit deleted',
            dayCleared: 'Day cleared', addedToDay: 'Added to day',
            planCopied: 'Plan copied:', saveFailed: 'Failed to save',
            undo: 'Undo',
            markOnlyToday: 'You can only mark on the day itself', pastClosed: 'Past days are closed for changes',
            empty: 'Nothing yet', freeDay: 'Free day', noPlans: 'No plans',
            allDone: 'All done', left: 'Left ', missed: 'Missed ',
            doneOf: 'Done ', of: ' of ',
            markInDay: 'You can mark on this day', addHabitsDay: 'Add habits for this day',
            nothingScheduled: 'Nothing scheduled', nothingPlanned: 'Nothing was planned for this day',
            noRecords: 'No records', noHabitsDay: 'No habits were planned for this day.',
            onTodayNothing: 'Nothing for today', onDayNothing: 'Nothing for this day',
            addFirstHabit: 'Add your first habit, e.g. a glass of water in the morning.',
            addOrCopy: 'Add a habit or copy another day\'s plan.',
            addHabitBtn: 'Add habit', habits: 'Habits', hab1: 'habit', hab2: 'habits', hab5: 'habits',
            done: 'Done', missedL: 'Missed',
            streakAria: 'Streak', day: 'day', days2: 'days', days5: 'days',
            mark: 'mark', futureDay: 'future day', pastDay: 'past day',
            actions: 'Actions', delete2: 'Delete',
            pastClosedNote: 'Past days are closed for changes: you can view and copy them.',
            futureNote: 'You can only mark completion on the day itself. You can plan ahead.',
            noData: 'No data', noDataHint: 'Add habits and mark them — your progress will appear here.',
            done7days: 'completed in 7 days', bestStreakDays: 'Best streak, days',
            totalChecks: 'Total checks', perfectDays: 'Perfect days',
            currentStreak: 'Current streak', bestStreak: 'Best streak', over30days: 'Last 30 days',
            needConfig: 'Error',
            needConfigHint: 'Something went wrong. We are already fixing it.',
            signInSub: 'Sign in to sync data across devices',
            signUpSub: 'Create an account — all habits are saved to the cloud',
            signIn: 'Sign in', signUpTab: 'Sign up', create: 'Create', createAccount: 'Create account', haveAccount: 'Already have an account?',
            gateCopy: 'Sync across your devices.<br>Your data stays yours.',
            gateF1: 'Streaks and stats for every habit', gateF2: 'Plan any day ahead', gateF3: 'Your data is protected and visible only to you',
            authErr: 'Enter email and password',
            passMismatch: 'Passwords do not match', passRepeat: 'Repeat password',
            wrongCreds: 'Wrong email or password', emailExists: 'A user with this email already exists',
            confirmEmail: 'Confirm your email via the link in the message',
            signupSuccess: 'Signup successful. Check your email to confirm.',
            tooMany: 'Too many attempts. Try again later.', lockedFor: 'Too many attempts. Try again in ', secShort: ' s',
            networkErr: 'No connection. Check your internet.',
            recoveryHint: 'Enter a new password for your account.',
            error: 'Error',
            clockNote: 'Device clock is behind the latest date in the app. Using the latest known date.',
            language: 'Language', russian: 'Русский', english: 'English', by: 'by futuroarchaic', password: 'Password', loadFailed: 'Failed to load data. Check your connection.', dayActions: 'Day actions', openCalendar: 'Open calendar', prevWeek: 'Previous week', nextWeek: 'Next week', prevMonth: 'Previous month', nextMonth: 'Next month', prevYear: 'Previous year', nextYear: 'Next year', resetDemo: 'Reset demo', rmToday: 'Remove for today only', rmThisDay: 'Remove for this day only', delFromToday: 'Delete habit from today', delFromThisDay: 'Delete habit from this day'
        }
    };
    const t = k => { const d = LANG[settings.lang] || LANG.ru; return (d[k] != null ? d[k] : LANG.ru[k]) || k; };
    const locale = () => settings.lang === 'en' ? 'en-US' : 'ru-RU';
    const tp = (n, one, few, many) => {
        if (settings.lang === 'en') return n === 1 ? one : many;
        return plural(n, one, few, many);
    };
    let sb = null, sessionUser = null, saveTimer = 0, saving = false, saveAgain = false;
    let remote = null; // снимок того, что сейчас лежит в БД
    let authMode = 'signin', bootStarted = false;
    let recoveryPending = false, editRecovery = false;

    // ---------- supabase + auth ----------
    function rememberEnabled() {
        try { return localStorage.getItem('habits_remember') !== '0'; } catch (e) { return true; }
    }
    function setRemember(on) {
        try { localStorage.setItem('habits_remember', on ? '1' : '0'); } catch (e) { }
    }
    // Хранилище сессии: «запомнить» → localStorage, иначе sessionStorage (очищается при закрытии браузера).
    // Один клиент на всё время жизни страницы, выбор хранилища динамический.
    const authStore = {
        getItem(k) {
            try {
                const pref = rememberEnabled() ? localStorage : sessionStorage;
                const other = rememberEnabled() ? sessionStorage : localStorage;
                const v = pref.getItem(k);
                return v != null ? v : other.getItem(k);
            } catch (e) { return null; }
        },
        setItem(k, v) {
            try {
                const pref = rememberEnabled() ? localStorage : sessionStorage;
                const other = rememberEnabled() ? sessionStorage : localStorage;
                pref.setItem(k, v);
                other.removeItem(k);
            } catch (e) { }
        },
        removeItem(k) {
            try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) { }
        }
    };
    function initSupabase() {
        const cfg = window.HABITS_CONFIG || {};
        if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || cfg.supabaseUrl.includes('YOUR_')) return null;
        if (!window.supabase) return null;
        return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: authStore,
                storageKey: 'habits-auth'
            }
        });
    }
    let profile = { nickname: '' };
    let profileOpen = false;
    let editKind = null;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const PASS_MAX = 72; // предел bcrypt в Supabase Auth
    const COMMON_PASS = new Set([
        'password', 'password1', 'password12', 'password123', 'passw0rd', 'p@ssw0rd', '12345678', '123456789', '1234567890', '123123123',
        'qwerty123', 'qwertyui', 'qwertyuiop', 'qwerty12', '1q2w3e4r', '1qaz2wsx', 'iloveyou', '11111111', '00000000', '12341234',
        'admin123', 'welcome1', 'welcome123', 'abc12345', 'abcd1234', 'monkey12', 'letmein1', 'asdfghjk', 'asdf1234', 'zxcvbnm1',
        'qwertyuiop1', 'football1', 'baseball1', 'dragon123', 'master123', 'sunshine1', 'princess1', 'superman1', 'trustno1',
        'привет123', 'пароль123', 'йцукен123', 'qazwsx123'
    ]);
    function nickOk(s) {
        const v = String(s || '').trim();
        return v.length >= 2 && v.length <= 24;
    }
    // Контекст для проверки «пароль не содержит email / ник»
    function passCtx() {
        if (!$('#auth').hidden) return { email: $('#authEmail').value, nick: $('#authNick').value };
        return { email: sessionUser && sessionUser.email, nick: profile.nickname };
    }
    function scorePassword(pw, ctx) {
        const s = String(pw || '');
        ctx = ctx || {};
        if (!s) return { score: 0, ok: false, hint: t('passRules') };
        const low = s.toLowerCase();
        const hasLetter = /[a-zA-Zа-яА-ЯёЁ]/.test(s);
        const hasDigit = /\d/.test(s);
        const common = COMMON_PASS.has(low) || /^[0-9]+$/.test(s) || /^(.)\1+$/.test(s);
        const bits = [ctx.email ? String(ctx.email).split('@')[0] : '', ctx.nick ? String(ctx.nick).trim() : '']
            .map(x => x.toLowerCase()).filter(x => x.length >= 4);
        const personal = bits.some(x => low.includes(x));
        let score = 0;
        if (s.length >= 8) score++;
        if (s.length >= 12) score++;
        if (hasLetter && hasDigit) score++;
        if (/[^a-zA-Zа-яА-ЯёЁ0-9]/.test(s) || (/[A-ZА-ЯЁ]/.test(s) && /[a-zа-яё]/.test(s))) score++;
        if (common || personal) score = Math.min(score, 1);
        const ok = s.length >= 8 && s.length <= PASS_MAX && hasLetter && hasDigit && !common && !personal;
        let hint;
        if (s.length < 8) hint = t('passShort');
        else if (s.length > PASS_MAX) hint = t('passLong');
        else if (!hasLetter || !hasDigit) hint = t('passNeedMix');
        else if (common) hint = t('passCommon');
        else if (personal) hint = t('passPersonal');
        else if (score >= 4) hint = t('passStrong');
        else if (score >= 3) hint = t('passGood');
        else hint = t('passFair');
        return { score: Math.max(0, Math.min(4, score)), ok, hint };
    }
    function paintMeter(el, hintEl, pw) {
        if (!el) return;
        const r = scorePassword(pw, passCtx());
        el.dataset.s = String(pw ? r.score : 0);
        if (hintEl) hintEl.textContent = pw ? r.hint : t('passRules');
        return r;
    }
    let passTogglesBound = false;
    function bindPassToggles() {
        if (passTogglesBound) return;
        passTogglesBound = true;
        document.addEventListener('mousedown', e => { if (e.target.closest('.pass-toggle')) e.preventDefault(); });
        document.addEventListener('click', e => {
            const btn = e.target.closest('.pass-toggle');
            if (!btn) return;
            const input = document.getElementById(btn.getAttribute('data-for'));
            if (!input) return;
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.classList.toggle('on', show);
            btn.setAttribute('aria-label', show ? t('hidePassword') : t('showPassword'));
        });
    }
    function resetPassToggles() {
        document.querySelectorAll('.pass-toggle').forEach(btn => {
            const input = document.getElementById(btn.getAttribute('data-for'));
            if (input) input.type = 'password';
            btn.classList.remove('on');
            btn.setAttribute('aria-label', t('showPassword'));
        });
    }
    async function loadProfile() {
        if (!sb || !sessionUser) return;
        const { data } = await sb.from('profiles').select('nickname').eq('user_id', sessionUser.id).maybeSingle();
        if (data) {
            profile = { nickname: data.nickname || '' };
        } else {
            const meta = sessionUser.user_metadata || {};
            profile = { nickname: meta.nickname || '' };
            await sb.from('profiles').upsert({
                user_id: sessionUser.id,
                nickname: profile.nickname
            });
        }
    }
    async function saveProfilePatch(patch) {
        if (!sb || !sessionUser) return { error: null };
        const next = { ...profile, ...patch };
        const row = {
            user_id: sessionUser.id,
            nickname: next.nickname || '',
            updated_at: new Date().toISOString()
        };
        const res = await sb.from('profiles').upsert(row);
        if (!res.error) profile = next;
        return res;
    }

    // ----- сообщения и состояния формы входа -----
    function authMsg(text, ok) {
        const el = $('#authErr');
        el.textContent = text || '';
        el.classList.toggle('ok', !!ok && !!text);
        el.style.color = '';
    }
    function flagField(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('invalid');
    }
    function clearFlags() {
        document.querySelectorAll('.auth-field.invalid').forEach(el => el.classList.remove('invalid'));
    }
    function setLoading(btn, on) {
        btn.disabled = !!on;
        btn.classList.toggle('loading', !!on);
        btn.setAttribute('aria-busy', on ? 'true' : 'false');
    }
    function authErrText(err) {
        const m = String((err && err.message) || '').toLowerCase();
        const c = String((err && (err.code || err.error_code)) || '').toLowerCase();
        if (m.includes('invalid login') || c === 'invalid_credentials') return t('wrongCreds');
        if (m.includes('not confirmed') || c === 'email_not_confirmed') return t('confirmEmail');
        if (m.includes('already registered') || c === 'user_already_exists' || c === 'email_exists') return t('emailExists');
        if (m.includes('rate limit') || c.includes('rate_limit') || (err && err.status === 429)) return t('tooMany');
        if (c === 'weak_password' || m.includes('weak')) return t('passCommon');
        if (c === 'same_password' || m.includes('same password') || m.includes('different from the old')) return t('samePassword');
        if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')) return t('networkErr');
        return (err && err.message) || t('error');
    }

    // ----- ограничение частоты попыток входа (на клиенте; сервер Supabase тоже лимитирует) -----
    let loginFails = 0, lockUntil = 0;
    const lockLeft = () => Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
    function registerFail() {
        loginFails++;
        if (loginFails >= 5) {
            const step = Math.floor(loginFails / 5);
            lockUntil = Date.now() + Math.min(300, 15 * Math.pow(2, step)) * 1000;
        }
    }
    function showReset() {
        $('#boot').hidden = true;
        $('#setup').hidden = true;
        $('#auth').hidden = true;
        $('#stage').hidden = true;
        $('#reset').hidden = false;
        ['resPass', 'resPass2'].forEach(id => { $('#' + id).value = ''; });
        $('#resErr').textContent = '';
        resetPassToggles();
        paintMeter($('#resMeter'), $('#resHint'), '');
        if (isFine()) setTimeout(() => $('#resPass').focus(), 60);
    }
    function showSetup() {
        $('#boot').hidden = true; $('#reset').hidden = true;
        $('#setup').hidden = false; $('#auth').hidden = true; $('#stage').hidden = true;
    }
    function syncGateLang() {
        document.querySelectorAll('#gateLang button').forEach(b => b.classList.toggle('on', b.dataset.v === settings.lang));
    }
    function setAuthMode(mode, keepMsg) {
        const changed = mode !== authMode;
        authMode = mode;
        const reg = mode === 'signup';
        if (!keepMsg) authMsg('');
        clearFlags();
        $('#authGo').textContent = reg ? t('createAccount') : t('signIn');
        $('#authSub').textContent = reg ? t('signUpSub') : t('signInSub');
        const seg = $('#authSeg');
        if (seg) {
            seg.dataset.mode = mode;
            seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', b.dataset.m === mode ? 'true' : 'false'));
        }
        $('#authForm').classList.toggle('reg', reg);
        $('#nickWrap').toggleAttribute('inert', !reg);
        $('#authRow').toggleAttribute('inert', reg);
        $('#authPass').autocomplete = reg ? 'new-password' : 'current-password';
        $('#authNick').required = reg;
        if (reg) paintMeter($('#passMeter'), $('#passHint'), $('#authPass').value);
        if (changed) {
            ['#authSub', '#authGo'].forEach(s => {
                const el = $(s);
                el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
            });
        }
        syncGateLang();
    }
    function showAuth() {
        $('#boot').hidden = true; $('#reset').hidden = true;
        $('#setup').hidden = true; $('#auth').hidden = false; $('#stage').hidden = true;
        state = emptyState(); pc.clear();
        remote = null;
        closeSheets();
        profileOpen = false;
        ['authPass', 'editPassOld', 'editPassNew', 'editPassNew2'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        resetPassToggles();
        setAuthMode('signin');
        try { $('#authRemember').checked = rememberEnabled(); } catch (e) { }
        if (isFine()) setTimeout(() => $('#authEmail').focus(), 50);
    }
    function showStage() {
        $('#boot').hidden = true; $('#reset').hidden = true;
        $('#setup').hidden = true; $('#auth').hidden = true; $('#stage').hidden = false;
    }
    function showReset() {
        $('#boot').hidden = true;
        $('#setup').hidden = true;
        $('#auth').hidden = true;
        $('#stage').hidden = true;
        $('#reset').hidden = false;
        ['resPass', 'resPass2'].forEach(id => { $('#' + id).value = ''; });
        $('#resErr').textContent = '';
        resetPassToggles();
        paintMeter($('#resMeter'), $('#resHint'), '');
        if (isFine()) setTimeout(() => $('#resPass').focus(), 60);
    }
    async function handleSession(sess) {
        sessionUser = sess ? sess.user : null;
        if (!sessionUser) { recoveryPending = false; showAuth(); return; }
        if (recoveryPending) { showReset(); return; }
        try {
            await Promise.all([loadProfile(), loadRemote()]);
            syncToday(); freezePast(); persist();
            tab = 'today';
            sel = today;
            render();
            showStage();
            try {
                document.querySelectorAll('.tab').forEach(b => {
                    const on = b.dataset.tab === 'today';
                    b.classList.toggle('on', on);
                    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
                });
                const views = { today: $('#viewToday'), stats: $('#viewStats'), settings: $('#viewSettings') };
                Object.keys(views).forEach(k => { if (views[k]) views[k].hidden = k !== 'today'; });
            } catch (e) { }
        } catch (err) {
            console.error(err);
            showAuth();
            authMsg(t('loadFailed'));
        }
    }
    async function start() {
        if (bootStarted) return;
        bootStarted = true;
        if (/type=recovery/.test(location.hash)) recoveryPending = true;
        setAuthMode('signin');
        sb = initSupabase();
        if (!sb) { showSetup(); return; }
        let bootDone = false;
        sb.auth.onAuthStateChange((ev, sess) => {
            if (ev === 'PASSWORD_RECOVERY') {
                recoveryPending = true;
                if (bootDone) handleSession(sess);
                return;
            }
            if (!bootDone) return;
            if (ev === 'SIGNED_OUT') { handleSession(null); return; }
            if (ev === 'SIGNED_IN' || ev === 'USER_UPDATED') {
                if (sess && sess.user && sessionUser && sess.user.id === sessionUser.id) {
                    sessionUser = sess.user;
                    if (tab === 'settings') renderSettings();
                    return;
                }
                handleSession(sess);
            }
        });
        try {
            const { data: { session } } = await sb.auth.getSession();
            bootDone = true;
            await handleSession(session);
        } catch (e) {
            console.error(e);
            bootDone = true;
            showAuth();
        }
    }

    function emptyState() {
        const t = key(today);
        return { v: 2, frozen: t, maxSeen: t, log: {}, over: {}, past: {}, habits: [] };
    }
    function applyAppearance() {
        const mode = settings.theme;
        const resolved = mode === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : mode;
        document.documentElement.setAttribute('data-theme', resolved);
        document.documentElement.setAttribute('data-theme-pref', mode);
        document.documentElement.style.colorScheme = resolved;
        document.documentElement.classList.toggle('no-motion', !settings.motion);
        document.documentElement.lang = settings.lang || 'ru';
        try { localStorage.setItem('habits.theme', settings.theme); } catch (e) { }
        document.title = t('appName') + (typeof DEMO_STORE !== 'undefined' ? (settings.lang === 'en' ? ' — demo' : ' — демо') : '');
        document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.setAttribute('content', resolved === 'dark' ? '#000000' : '#F2F2F7'));
        applyI18n();
    }
    function applyI18n() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const k = el.getAttribute('data-i18n');
            if (k) el.textContent = t(k);
        });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            const k = el.getAttribute('data-i18n-ph');
            if (k) el.setAttribute('placeholder', t(k));
        });
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const k = el.getAttribute('data-i18n-html');
            if (k) el.innerHTML = t(k);
        });
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const k = el.getAttribute('data-i18n-aria');
            if (k) el.setAttribute('aria-label', t(k));
        });
        if (ed) { editorTexts(); renderEditor(); }
    }
    function persist() {
        pc.clear();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveRemote, 220);
    }
    const snap = () => JSON.stringify({ state, settings });

    const SEP = '|';
    const chunk = (arr, n = 500) => {
        const out = [];
        for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
        return out;
    };

    // Текущее состояние в виде плоских наборов ключей
    function buildRemote() {
        const habits = new Map();
        state.habits.forEach((h, i) => habits.set(h.id, JSON.stringify({
            name: h.name, emoji: h.emoji, color: h.color, days: h.days || [],
            created_on: h.created, once: !!h.once, ended_at: h.endedAt || null, sort_index: i
        })));
        const over = new Set(), past = new Set(), log = new Set();
        Object.keys(state.over).forEach(day => {
            const o = state.over[day];
            (o.add || []).forEach(id => over.add(day + SEP + id + SEP + 'add'));
            (o.skip || []).forEach(id => over.add(day + SEP + id + SEP + 'skip'));
        });
        Object.keys(state.past).forEach(day => (state.past[day] || []).forEach(id => past.add(day + SEP + id)));
        Object.keys(state.log).forEach(day => (state.log[day] || []).forEach(id => log.add(day + SEP + id)));
        const settingsStr = JSON.stringify({
            frozen: state.frozen, max_seen: state.maxSeen,
            theme: settings.theme, motion: settings.motion, lang: settings.lang
        });
        return { habits, over, past, log, settings: settingsStr };
    }

    const diffSets = (cur, old) => ({
        add: [...cur].filter(k => !old.has(k)),
        del: [...old].filter(k => !cur.has(k))
    });

    async function saveRemote() {
        if (!sb || !sessionUser) return;
        if (saving) { saveAgain = true; return; }
        saving = true;
        try {
            const uid = sessionUser.id;
            const cur = buildRemote();
            // Если снимка нет (не должно быть после loadRemote) — считаем, что БД пуста,
            // а лишнее удалится при следующей полной загрузке.
            const old = remote || { habits: new Map(), over: new Set(), past: new Set(), log: new Set(), settings: '' };

            // --- настройки ---
            if (cur.settings !== old.settings) {
                const s = JSON.parse(cur.settings);
                const r = await sb.from('user_settings').upsert({ user_id: uid, ...s });
                if (r.error) throw r.error;
            }

            // --- привычки: upsert только изменённых ---
            const habitRows = [];
            cur.habits.forEach((json, id) => {
                if (old.habits.get(id) !== json) habitRows.push({ id, user_id: uid, ...JSON.parse(json) });
            });
            for (const part of chunk(habitRows)) {
                const r = await sb.from('habits').upsert(part);
                if (r.error) throw r.error;
            }

            // --- удаления дочерних строк (до удаления привычек) ---
            // day_overrides: группируем по (day, kind)
            const ov = diffSets(cur.over, old.over);
            const ovGroups = new Map();
            ov.del.forEach(k => {
                const [day, id, kind] = k.split(SEP);
                const g = day + SEP + kind;
                (ovGroups.get(g) || ovGroups.set(g, []).get(g)).push(id);
            });
            for (const [g, ids] of ovGroups) {
                const [day, kind] = g.split(SEP);
                const r = await sb.from('day_overrides').delete()
                    .eq('user_id', uid).eq('day', day).eq('kind', kind).in('habit_id', ids);
                if (r.error) throw r.error;
            }

            // past_plans и completions: группируем по day
            const delByDay = async (table, keys) => {
                const m = new Map();
                keys.forEach(k => {
                    const [day, id] = k.split(SEP);
                    (m.get(day) || m.set(day, []).get(day)).push(id);
                });
                for (const [day, ids] of m) {
                    const r = await sb.from(table).delete().eq('user_id', uid).eq('day', day).in('habit_id', ids);
                    if (r.error) throw r.error;
                }
            };
            const pa = diffSets(cur.past, old.past);
            const lg = diffSets(cur.log, old.log);
            await delByDay('past_plans', pa.del);
            await delByDay('completions', lg.del);

            // --- удаление привычек (каскадом уйдёт всё остальное) ---
            const dropHabits = [...old.habits.keys()].filter(id => !cur.habits.has(id));
            for (const part of chunk(dropHabits)) {
                const r = await sb.from('habits').delete().eq('user_id', uid).in('id', part);
                if (r.error) throw r.error;
            }

            // --- вставки новых строк ---
            const insert = async (table, rows) => {
                for (const part of chunk(rows)) {
                    // upsert с ignoreDuplicates: безопасно, если строка уже есть
                    const r = await sb.from(table).upsert(part, { ignoreDuplicates: true });
                    if (r.error) throw r.error;
                }
            };
            await insert('day_overrides', ov.add.map(k => {
                const [day, habit_id, kind] = k.split(SEP);
                return { user_id: uid, day, habit_id, kind };
            }));
            await insert('past_plans', pa.add.map(k => {
                const [day, habit_id] = k.split(SEP);
                return { user_id: uid, day, habit_id };
            }));
            await insert('completions', lg.add.map(k => {
                const [day, habit_id] = k.split(SEP);
                return { user_id: uid, day, habit_id };
            }));

            // Успех: снимок = то, что только что записали.
            // При ошибке выше remote не меняется, и следующий save повторит дифф.
            remote = cur;
        } catch (err) {
            console.error(err);
            toast(t('saveFailed'));
        }
        saving = false;
        if (saveAgain) { saveAgain = false; saveRemote(); }
    }

    async function loadRemote() {
        const uid = sessionUser.id;
        const [st, habits, over, past, log] = await Promise.all([
            sb.from('user_settings').select('*').eq('user_id', uid).maybeSingle(),
            sb.from('habits').select('*').eq('user_id', uid).order('sort_index'),
            sb.from('day_overrides').select('*').eq('user_id', uid),
            sb.from('past_plans').select('*').eq('user_id', uid),
            sb.from('completions').select('*').eq('user_id', uid)
        ]);
        const err = st.error || habits.error || over.error || past.error || log.error;
        if (err) throw err;
        state = emptyState();
        if (st.data) {
            state.frozen = st.data.frozen;
            state.maxSeen = st.data.max_seen;
            settings = {
                theme: st.data.theme || 'system',
                motion: st.data.motion !== false,
                lang: st.data.lang || 'ru'
            };
        }
        state.habits = (habits.data || []).map(h => ({
            id: h.id, name: h.name, emoji: h.emoji, color: h.color,
            days: h.days || [], created: h.created_on, once: !!h.once, endedAt: h.ended_at || undefined
        }));
        (over.data || []).forEach(r => {
            const o = state.over[r.day] || (state.over[r.day] = { add: [], skip: [] });
            if (r.kind === 'add') o.add.push(r.habit_id); else o.skip.push(r.habit_id);
        });
        (past.data || []).forEach(r => {
            (state.past[r.day] || (state.past[r.day] = [])).push(r.habit_id);
        });
        (log.data || []).forEach(r => {
            (state.log[r.day] || (state.log[r.day] = [])).push(r.habit_id);
        });
        remote = buildRemote();
        if (!st.data) remote.settings = ''; // строки в БД ещё нет, нужно создать
        applyAppearance();
    }

    // Дата «сегодня» никогда не идёт назад: так нельзя вернуть часы и закрыть прошлое.
    function syncToday() {
        const dev = startOfDay(new Date());
        let t = dev;
        clockBehind = false;
        if (state.maxSeen) { const m = parseKey(state.maxSeen); if (m > dev) { t = m; clockBehind = true; } }
        const changed = !same(t, today);
        today = t;
        if (key(t) > (state.maxSeen || '')) state.maxSeen = key(t);
        return changed;
    }

    // ---------- plans ----------
    const byId = id => state.habits.find(h => h.id === id);
    const alive = (h, d) => !h.endedAt || key(d) < h.endedAt;
    const rule = (h, d) => h.days.includes(wd(d)) && key(d) >= h.created;
    const isActive = h => !h.endedAt || h.endedAt > key(today);
    const editable = d => key(d) >= key(today);

    function planned(d) {
        const k = key(d);
        let v = pc.get(k);
        if (v) return v;
        if (k < state.frozen) v = (state.past[k] || []).map(byId).filter(Boolean);
        else {
            const o = state.over[k], add = o ? o.add : [], skip = o ? o.skip : [];
            v = state.habits.filter(h => alive(h, d) && ((rule(h, d) && !skip.includes(h.id)) || add.includes(h.id)));
        }
        pc.set(k, v);
        return v;
    }
    const isPlanned = (h, d) => planned(d).some(x => x.id === h.id);
    const isDone = (h, d) => { const a = state.log[key(d)]; return !!a && a.includes(h.id); };
    function dayStats(d) { const l = planned(d); return { total: l.length, done: l.filter(h => isDone(h, d)).length }; }

    // Прошедшие дни замораживаются: их план больше нельзя менять.
    function freezePast() {
        const t = key(today);
        if (state.frozen >= t) return;
        pc.clear();
        let d = parseKey(state.frozen);
        const limit = addDays(today, -400);
        if (d < limit) d = limit;
        for (; key(d) < t; d = addDays(d, 1)) {
            const k = key(d);
            if (!state.past[k]) { const ids = planned(d).map(h => h.id); if (ids.length) state.past[k] = ids; }
            delete state.over[k];
        }
        state.frozen = t;
        pc.clear();
    }

    function streaks(h) {
        let run = 0, best = 0;
        for (let d = parseKey(h.created); d <= today; d = addDays(d, 1)) {
            if (!isPlanned(h, d)) continue;
            if (isDone(h, d)) { run++; if (run > best) best = run; }
            else if (!same(d, today)) run = 0;
        }
        return { cur: run, best };
    }
    function rate30(h) {
        let due = 0, done = 0;
        for (let i = 0; i < 30; i++) {
            const d = addDays(today, -i);
            if (!isPlanned(h, d)) continue;
            const dn = isDone(h, d);
            if (same(d, today) && !dn) continue;
            due++; if (dn) done++;
        }
        return due ? Math.round(done / due * 100) : null;
    }
    function sched(h) {
        if (!h.days.length) return t('once');
        const d = [...h.days].sort((a, b) => a - b).join();
        if (d === '0,1,2,3,4,5,6') return t('everyDay');
        if (d === '0,1,2,3,4') return t('weekdays');
        if (d === '5,6') return t('weekends');
        return [...h.days].sort((a, b) => a - b).map(i => DOW()[i]).join(', ');
    }
    function relLabel(d) {
        if (same(d, today)) return t('today').toLowerCase();
        if (same(d, addDays(today, 1))) return t('tomorrow').toLowerCase();
        return fmtDay(d);
    }

    // ---------- plan mutations (только сегодня и будущее) ----------
    function ovr(k) { return state.over[k] || (state.over[k] = { add: [], skip: [] }); }
    function clean(k) { const o = state.over[k]; if (o && !o.add.length && !o.skip.length) delete state.over[k]; }
    function dropLog(id, k) {
        if (!state.log[k]) return;
        state.log[k] = state.log[k].filter(x => x !== id);
        if (!state.log[k].length) delete state.log[k];
    }
    function addToDay(id, d) {
        if (!editable(d)) return;
        const h = byId(id), k = key(d), o = ovr(k);
        o.skip = o.skip.filter(x => x !== id);
        if (!rule(h, d) && !o.add.includes(id)) o.add.push(id);
        clean(k);
    }
    function removeFromDay(id, d) {
        if (!editable(d)) return;
        const h = byId(id), k = key(d), o = ovr(k);
        o.add = o.add.filter(x => x !== id);
        if (rule(h, d) && !o.skip.includes(id)) o.skip.push(id);
        clean(k);
        dropLog(id, k);
    }
    function endFrom(id, d) {
        if (!editable(d)) return;
        const h = byId(id), k = key(d);
        h.endedAt = (h.endedAt && h.endedAt < k) ? h.endedAt : k;
        Object.keys(state.over).forEach(x => {
            if (x < k) return;
            const o = state.over[x];
            o.add = o.add.filter(i => i !== id); o.skip = o.skip.filter(i => i !== id); clean(x);
        });
        Object.keys(state.log).forEach(x => { if (x >= k) dropLog(id, x); });
    }

    // ---------- toast / undo ----------
    let toastT = null, undoSnap = null;
    function toast(text, snapStr) {
        undoSnap = snapStr || null;
        $('#toastText').textContent = text;
        $('#undoBtn').hidden = !snapStr;
        $('#toast').classList.add('on');
        clearTimeout(toastT);
        toastT = setTimeout(hideToast, snapStr ? 5500 : 2400);
    }
    function hideToast() { $('#toast').classList.remove('on'); undoSnap = null; }
    function restore(s) {
        const pack = JSON.parse(s);
        state = pack.state || pack;
        if (pack.settings) { settings = pack.settings; applyAppearance(); }
        pc.clear();
        syncToday(); freezePast(); persist(); render();
    }

    // ---------- action sheet (мобильный) + popover-меню (десктоп) ----------
    let actItems = [], menuEl = null, menuAnchor = null, menuItems = [], menuHideT = 0;
    const MI = {
        edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
        copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg>',
        trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
        minus: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>'
    };
    function showActions({ title, message, items, anchor }) {
        if (isFine() && anchor && anchor.isConnected) return showMenu(anchor, { title, items });
        hideMenu();
        actItems = items;
        const head = (title || message) ? `<div class="head">${title ? `<b>${esc(title)}</b>` : ''}${message ? esc(message) : ''}</div>` : '';
        const btn = (it, i) => `<button data-i="${i}" class="${it.danger ? 'dest' : ''}">${esc(it.label)}</button>`;
        $('#agMain').innerHTML = `<div class="ag">${head}${items.map(btn).join('')}</div>`;
        $('#actions').classList.add('open'); $('#scrim2').classList.add('open');
    }
    function hideActions() { $('#actions').classList.remove('open'); $('#scrim2').classList.remove('open'); hideMenu(); }

    function showMenu(anchor, { title, items }) {
        if (menuEl && menuAnchor === anchor) { hideMenu(); return; }
        hideMenu(true);
        menuItems = items; menuAnchor = anchor;
        const el = document.createElement('div');
        el.className = 'menu'; el.setAttribute('role', 'menu');
        el.innerHTML = (title ? `<div class="mhead">${esc(title)}</div>` : '') +
            items.map((it, i) => (it.sep ? '<div class="msep"></div>' : '') +
                `<button type="button" role="menuitem" data-i="${i}" class="${it.danger ? 'dest' : ''}">${MI[it.icon] || ''}<span>${esc(it.label)}</span></button>`).join('');
        document.body.appendChild(el);
        const r = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, M = 8;
        let left = r.right - w, top = r.bottom + 6, oy = '0%';
        if (left < M) left = M;
        if (left + w > innerWidth - M) left = innerWidth - M - w;
        if (top + h > innerHeight - M) { top = r.top - 6 - h; oy = '100%'; if (top < M) top = M; }
        el.style.left = left + 'px'; el.style.top = top + 'px';
        el.style.setProperty('--ox', Math.max(0, Math.min(100, (r.right - left) / w * 100)) + '%');
        el.style.setProperty('--oy', oy);
        const rw = anchor.closest('.rw'); if (rw) rw.classList.add('menu-open');
        menuEl = el;
        // no scrim/blur for desktop popovers
        requestAnimationFrame(() => el.classList.add('open'));
    }
    function hideMenu(instant) {
        if (!menuEl) return;
        const el = menuEl; menuEl = null;
        const rw = menuAnchor && menuAnchor.closest ? menuAnchor.closest('.rw') : null;
        if (rw) rw.classList.remove('menu-open');
        menuAnchor = null;
        if (!$('#actions').classList.contains('open')) $('#scrim2').classList.remove('open');
        el.classList.remove('open');
        if (instant) el.remove(); else setTimeout(() => el.remove(), 240);
    }
    document.addEventListener('pointerdown', e => {
        if (menuEl && !e.target.closest('.menu') && !(menuAnchor && menuAnchor.contains(e.target))) hideMenu();
    }, true);
    document.addEventListener('click', e => {
        if (!menuEl) return;
        const b = e.target.closest('.menu button[data-i]'); if (!b) return;
        const it = menuItems[+b.dataset.i]; hideMenu(); if (it) it.run();
    });
    document.addEventListener('keydown', e => {
        if (!menuEl) return;
        if (e.key === 'Escape') { hideMenu(); return; }
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const bs = [...menuEl.querySelectorAll('button')], i = bs.indexOf(document.activeElement);
        bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus();
    });
    window.addEventListener('scroll', () => hideMenu(), true);
    let lastW = window.innerWidth;
    window.addEventListener('resize', () => {
        hideMenu();
        clearTimeout(window.__heatResize);
        window.__heatResize = setTimeout(() => {
            if (window.innerWidth === lastW) return;
            lastW = window.innerWidth;
            if (tab === 'stats') renderStats();
        }, 120);
    });

    // ---------- rings ----------
    const miniRingPrev = new Map();
    function miniRing(ratio, dash, dayKey) {
        const s = 36, st = 3.5, r = (s - st) / 2, c = 2 * Math.PI * r;
        const target = c * (1 - Math.min(1, Math.max(0, ratio)));
        // always render progress arc so we can animate 0 ↔ value
        return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true">
      <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="${dash ? 'var(--label3)' : 'var(--track)'}" stroke-width="${st}" ${dash ? 'stroke-dasharray="2.4 3.6" stroke-linecap="round"' : ''}/>
      <circle class="marc" data-k="${dayKey || ''}" data-c="${c}" data-target="${target}" cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="url(#gDone)" stroke-width="${st}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" transform="rotate(-90 ${s / 2} ${s / 2})" style="opacity:${ratio > 0.001 ? 1 : 0}"/>
    </svg>`;
    }
    function animateMiniRings() {
        if (!settings.motion) {
            $('#week').querySelectorAll('.marc').forEach(el => {
                el.style.transition = 'none';
                el.style.strokeDashoffset = el.dataset.target;
                el.style.opacity = (+el.dataset.target < +el.dataset.c - 0.5) ? '1' : '0';
                miniRingPrev.set(el.dataset.k, +el.dataset.target);
            });
            return;
        }
        const nodes = [...$('#week').querySelectorAll('.marc')];
        nodes.forEach(el => {
            const c = +el.dataset.c, target = +el.dataset.target, k = el.dataset.k;
            const prev = miniRingPrev.has(k) ? miniRingPrev.get(k) : target;
            el.style.transition = 'none';
            el.style.strokeDashoffset = String(prev);
            el.style.opacity = (prev < c - 0.5 || target < c - 0.5) ? '1' : '0';
        });
        requestAnimationFrame(() => requestAnimationFrame(() => {
            nodes.forEach(el => {
                const c = +el.dataset.c, target = +el.dataset.target, k = el.dataset.k;
                el.style.transition = '';
                el.style.strokeDashoffset = String(target);
                el.style.opacity = target < c - 0.5 ? '1' : '0';
                miniRingPrev.set(k, target);
            });
        }));
    }

    // ---------- render: today ----------
    const relOf = d => key(d) < key(today) ? -1 : key(d) === key(today) ? 0 : 1;

    function renderToday() {
        const rel = relOf(sel);
        const nm = same(sel, today) ? t('today') : same(sel, addDays(today, -1)) ? t('yesterday') : same(sel, addDays(today, 1)) ? t('tomorrow') : null;
        $('#title').textContent = nm || cap(sel.toLocaleDateString(locale(), { weekday: 'long' }));
        const o = { day: 'numeric', month: 'long' };
        if (sel.getFullYear() !== today.getFullYear()) o.year = 'numeric';
        if (nm) o.weekday = 'long';
        $('#subtitle').textContent = sel.toLocaleDateString(locale(), o);

        const list = planned(sel);
        $('#addBtn').hidden = rel < 0;
        $('#moreBtn').hidden = !list.length;
        $('#todayBtn').hidden = rel === 0;
        $('#clockNote').hidden = !clockBehind;

        // week — rebuild only when the displayed week changes; otherwise just update selection
        const ws = mondayOf(sel), mid = addDays(ws, 3);
        $('#weekLabel').innerHTML = `${cap(mid.toLocaleDateString(locale(), { month: 'long' }))} ${mid.getFullYear()} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>`;
        $('#prevWeek').disabled = ws <= addDays(mondayOf(today), -WEEKS_BACK * 7);
        $('#nextWeek').disabled = ws >= addDays(mondayOf(today), WEEKS_AHEAD * 7);
        // always keep prev / current / next week panels in the track
        const weekEl = $('#week');
        const existing = weekEl ? weekEl.querySelectorAll('.day') : [];
        const sameWeek = existing.length === 7 && existing[0].dataset.k === key(ws);
        if (sameWeek && !weekDir) {
            // light update: selection + rings only on current panel
            existing.forEach((b, i) => {
                const d = addDays(ws, i);
                b.classList.toggle('sel', same(d, sel));
                b.classList.toggle('today', same(d, today));
                b.classList.toggle('fut', d > today);
            });
            existing.forEach((b, i) => {
                const d = addDays(ws, i), fut = d > today, st = dayStats(d);
                const ratio = fut || !st.total ? 0 : st.done / st.total;
                const ring = b.querySelector('.dring');
                if (ring) {
                    const dn = ring.querySelector('.dn');
                    const dnHtml = dn ? dn.outerHTML : `<span class="dn">${d.getDate()}</span>`;
                    ring.innerHTML = miniRing(ratio, fut && st.total > 0, key(d)) + dnHtml;
                }
            });
            animateMiniRings();
        } else {
            fillWeekTrack(ws);
        }

        // hero
        const st = dayStats(sel), total = st.total, done = st.done, left = total - done;
        const ratio = rel > 0 ? 0 : (total ? done / total : 0);
        let ht, hs, hp;
        if (rel > 0) {
            ht = total ? `${total} ${tp(total, t('hab1'), t('hab2'), t('hab5'))}` : t('empty');
            hs = total ? t('markInDay') : t('addHabitsDay');
            hp = clockSVG;
        } else if (!total) {
            ht = rel === 0 ? t('freeDay') : t('noPlans');
            hs = rel === 0 ? t('nothingScheduled') : t('nothingPlanned');
            hp = '<span class="dash">–</span>';
        } else if (!left) { ht = t('allDone'); hs = `${done}${t('of')}${total}`; hp = checkSVG; }
        else {
            ht = (rel === 0 ? t('left') : t('missed')) + left;
            hs = `${t('doneOf')}${done}${t('of')}${total}`;
            hp = `<span class="pnum">${Math.round(ratio * 100)}<small>%</small></span>`;
        }
        $('#heroTitle').textContent = ht;
        $('#heroSub').textContent = hs;
        $('#heroPct').innerHTML = hp;
        const arc = $('#heroArc'), off = C * (1 - ratio);
        if (heroFirst) { heroFirst = false; requestAnimationFrame(() => requestAnimationFrame(() => { arc.style.strokeDashoffset = off; })); }
        else arc.style.strokeDashoffset = off;
        if (popId && rel === 0 && total && !left) {
            const rb = $('#ringbox'); rb.classList.remove('cele'); void rb.offsetWidth; rb.classList.add('cele');
        }

        // list
        const lst = $('#list'), foot = $('#listFoot');
        foot.hidden = true;
        if (!list.length) {
            if (rel < 0) {
                lst.innerHTML = `<div class="gap"></div><div class="group empty"><h3>${t('noRecords')}</h3><p>${t('noHabitsDay')}</p></div>`;
            } else {
                const none = !state.habits.some(isActive);
                lst.innerHTML = `<div class="gap"></div><div class="group empty">
          <svg class="e-ring" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="36" r="30" stroke="var(--track)" stroke-width="8"/><path d="M36 6a30 30 0 0 1 26 15" stroke="var(--done)" stroke-width="8" stroke-linecap="round"/></svg>
          <h3>${none ? t('empty') : rel === 0 ? t('onTodayNothing') : t('onDayNothing')}</h3>
          <p>${none ? t('addFirstHabit') : t('addOrCopy')}</p>
          <button class="btn" data-act="add">${t('addHabitBtn')}</button></div>`;
            }
        } else {
            let shown = list;
            lst.innerHTML = `<h2 class="section-title">${t('habits')}</h2><div class="group">` + shown.map(h => rowHTML(h, rel)).join('') + `</div>`;
        }
        if (rel < 0 && list.length) { foot.textContent = t('pastClosedNote'); foot.hidden = false; }
        else if (rel > 0 && list.length) { foot.textContent = t('futureNote'); foot.hidden = false; }
    }

    function rowHTML(h, rel) {
        const dn = isDone(h, sel);
        const cur = rel === 0 ? streaks(h).cur : 0;
        let sub = sched(h), subCls = '';
        if (rel < 0) { sub = dn ? t('done') : t('missedL'); subCls = dn ? '' : ' miss'; }
        const cls = 'check' + (dn ? ' on' : '') + (rel > 0 ? ' lock' : '') + (rel < 0 ? ' past' : '') + (popId === h.id ? ' pop' : '') + (unpopId === h.id ? ' unpop' : '');
        return `<div class="rw" data-id="${h.id}" style="${cs(h.color)};--del:0px">
      <div class="row-clip"><div class="row${dn ? ' done' : ''}">
        <div class="icon">${h.emoji}</div>
        <div class="meta"><div class="name">${esc(h.name)}</div><div class="sub${subCls}">${sub}</div></div>
        ${rel >= 0 ? `<button class="row-more" type="button" aria-label="${t('actions')}"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18.5" cy="12" r="2"/></svg></button>` : ''}
        ${cur >= 2 ? `<span class="streak" aria-label="${t('streakAria')} ${cur} ${tp(cur, t('day'), t('days2'), t('days5'))}">🔥 ${cur}</span>` : ''}
        <button class="${cls}" aria-pressed="${dn}" aria-label="${esc(h.name)}: ${rel === 0 ? t('mark') : rel > 0 ? t('futureDay') : t('pastDay')}"><i>${tickSVG}</i></button>
      </div></div>
      ${rel >= 0 ? `<button class="swipe-del" type="button" tabindex="-1"><span>${t('delete2')}</span></button>` : ''}
    </div>`;
    }

    // ---------- render: stats ----------
    function calcHeatLayout() {
        const isMobile = !window.matchMedia('(min-width: 520px)').matches;
        const isDesktop = window.matchMedia('(min-width: 960px)').matches;
        if (isDesktop) return { cols: 14, cell: 0, gap: 4 };
        if (isMobile) return { cols: 7, cell: 0, gap: 4 };
        return { cols: 9, cell: 0, gap: 4 };
    }
    function renderStats() {
        const el = $('#stats');
        if (!state.habits.some(isActive) && !Object.keys(state.log).length) {
            el.innerHTML = `<div class="group empty"><h3>${t('noData')}</h3><p>${t('noDataHint')}</p></div>`;
            return;
        }
        let due7 = 0, done7 = 0, bars = '';
        for (let i = 6; i >= 0; i--) {
            const d = addDays(today, -i), st = dayStats(d);
            due7 += st.total; done7 += st.done;
            const p = st.total ? st.done / st.total : 0;
            bars += `<div class="bar"><div class="track">${p > 0 ? `<div class="fill" style="height:${p * 100}%;min-height:8px"></div>` : ''}</div><span class="bl${i === 0 ? ' t' : ''}">${DOW()[wd(d)]}</span></div>`;
        }
        const pct7 = due7 ? Math.round(done7 / due7 * 100) : null;
        const rep = state.habits.filter(h => isActive(h) && !h.once);

        let bestAll = 0, totalChecks = 0, perfect = 0;
        rep.forEach(h => { bestAll = Math.max(bestAll, streaks(h).best); });
        Object.keys(state.log).forEach(k => {
            const d = parseKey(k); if (d > today) return;
            totalChecks += state.log[k].length;
            const s = dayStats(d); if (s.total && s.done === s.total) perfect++;
        });

        const { cols: heatCols, cell: heatCell, gap: heatGap } = calcHeatLayout();
        // Last column = current week (Mon–Sun containing today). Past columns = past weeks.
        // When the calendar week rolls over, thisMon moves forward so the grid shifts with it.
        const thisMon = mondayOf(today);
        const gridStart = addDays(thisMon, -(heatCols - 1) * 7);
        const cards = rep.map((h, hi) => {
            const { cur, best } = streaks(h), r = rate30(h);
            let cells = '';
            for (let c = 0; c < heatCols; c++) for (let r2 = 0; r2 < 7; r2++) {
                const d = addDays(gridStart, c * 7 + r2);
                let cls = 'cell';
                if (d > today) cls += ' f';
                else if (isPlanned(h, d)) cls += isDone(h, d) ? ' d' : (same(d, today) ? '' : ' m');
                // Always attach data-k so future days of the current week navigate to that day
                // (without data-k the click bubbles to .scard and opens the editor).
                cells += `<div class="${cls}" data-k="${key(d)}" title="${fmtDay(d)}"></div>`;
            }
            const delay = settings.motion ? `animation-delay:${(0.14 + Math.min(hi, 10) * 0.06).toFixed(2)}s` : '';
            return `<div class="scard" role="button" tabindex="0" data-id="${h.id}" style="${cs(h.color)};${delay}">
        <div class="shead"><div class="icon">${h.emoji}</div>
          <div class="meta"><div class="name">${esc(h.name)}</div><div class="sub">${sched(h)}</div></div></div>
        <div class="heat" style="--cols:${heatCols};--cell:${heatCell}px;--heat-gap:${heatGap}px" aria-hidden="true">${cells}</div>
        <div class="sfoot">
          <div><b>${cur} ${tp(cur, t('day'), t('days2'), t('days5'))}</b><span>${t('currentStreak')}</span></div>
          <div><b>${best} ${tp(best, t('day'), t('days2'), t('days5'))}</b><span>${t('bestStreak')}</span></div>
          <div><b>${r === null ? '–' : r + '%'}</b><span>${t('over30days')}</span></div>
        </div></div>`;
        }).join('');

        el.innerHTML = `
      <div class="card">
        <div class="big">${pct7 === null ? '–' : pct7 + '<small>%</small>'}</div>
        <div class="cap">${t('done7days')}</div>
        <div class="bars">${bars}</div>
      </div>
      <div class="tiles">
        <div class="tile"><b>${bestAll}</b><span>${t('bestStreakDays')}</span></div>
        <div class="tile"><b>${totalChecks}</b><span>${t('totalChecks')}</span></div>
        <div class="tile"><b>${perfect}</b><span>${t('perfectDays')}</span></div>
      </div>
      ${cards ? `<h2 class="section-title">${t('habits')}</h2>${cards}` : ''}`;
    }

    function colorLabel(c) {
        if (c === 'white' && document.documentElement.getAttribute('data-theme') !== 'dark') return settings.lang === 'en' ? 'Black' : 'Чёрный';
        const pack = COLOR_LABELS[settings.lang] || COLOR_LABELS.ru; return pack[c] || c;
    }
    const isPale = c => c === 'yellow' || c === 'pink' || (c === 'white' && document.documentElement.getAttribute('data-theme') === 'dark');
    function displayNick() {
        return profile.nickname || (sessionUser && sessionUser.email ? sessionUser.email.split('@')[0] : '—');
    }
    function setProfileOpen(on) {
        profileOpen = !!on;
        const acc = $('#profileAcc'), head = $('#profileHead'), panel = $('#profilePanel');
        if (!acc || !head || !panel) return;
        acc.classList.toggle('open', profileOpen);
        head.setAttribute('aria-expanded', profileOpen ? 'true' : 'false');
        panel.toggleAttribute('inert', !profileOpen);
    }
    function renderSettings() {
        $('#themeSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === settings.theme));
        $('#langSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === settings.lang));
        $('#motionSw').classList.toggle('on', settings.motion);
        $('#motionSw').setAttribute('aria-checked', settings.motion);
        const nick = displayNick();
        const email = sessionUser ? (sessionUser.email || '—') : '—';
        if ($('#profileCardNick')) $('#profileCardNick').textContent = nick;
        if ($('#profileCardEmail')) $('#profileCardEmail').textContent = email;
        if ($('#profNickVal')) $('#profNickVal').textContent = profile.nickname || nick;
        if ($('#profEmailVal')) $('#profEmailVal').textContent = email;
        const ava = $('#profileAva');
        if (ava) ava.textContent = String(nick).trim().charAt(0).toUpperCase() || '•';
        setProfileOpen(profileOpen);
    }
    function openEditSheet(kind, recovery) {
        if (!sessionUser) return;
        editKind = kind;
        editRecovery = !!recovery && kind === 'password';
        $('#editErr').textContent = '';
        $('#editNickForm').hidden = kind !== 'nickname';
        $('#editEmailForm').hidden = kind !== 'email';
        $('#editPassForm').hidden = kind !== 'password';
        $('#editPassOldWrap').hidden = editRecovery;
        $('#editRecoveryHint').hidden = !editRecovery;
        const titles = { nickname: t('nickname'), email: t('emailFull'), password: t('changePassword') };
        $('#editTitle').textContent = titles[kind] || t('edit');
        if (kind === 'nickname') {
            $('#editNick').value = profile.nickname || '';
        } else if (kind === 'email') {
            $('#editEmail').value = sessionUser.email || '';
        } else {
            $('#editPassOld').value = '';
            $('#editPassNew').value = '';
            $('#editPassNew2').value = '';
            resetPassToggles();
            paintMeter($('#editPassMeter'), $('#editPassHint'), '');
        }
        showSheet(editEl);
        const focusId = kind === 'nickname' ? 'editNick' : kind === 'email' ? 'editEmail' : (editRecovery ? 'editPassNew' : 'editPassOld');
        if (isFine()) setTimeout(() => { const el = $('#' + focusId); if (el) try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }, 60);
    }
    async function commitEditSheet() {
        if (!editKind || !sessionUser || !sb) return;
        const btn = $('#editDone');
        const err = $('#editErr');
        err.textContent = '';
        if (editKind === 'nickname') {
            const val = ($('#editNick').value || '').trim();
            if (!nickOk(val)) { err.textContent = t('nickShort'); return; }
            if (val === (profile.nickname || '')) { closeSheets(); return; }
            btn.disabled = true;
            const { error } = await saveProfilePatch({ nickname: val });
            btn.disabled = false;
            if (error) { err.textContent = authErrText(error); return; }
            closeSheets(); renderSettings(); toast(t('profileSaved'));
        } else if (editKind === 'email') {
            const val = ($('#editEmail').value || '').trim();
            if (!EMAIL_RE.test(val)) { err.textContent = t('emailInvalid'); return; }
            if (val === (sessionUser.email || '')) { closeSheets(); return; }
            btn.disabled = true;
            const { data, error } = await sb.auth.updateUser({ email: val });
            btn.disabled = false;
            if (error) { err.textContent = authErrText(error); return; }
            if (data && data.user) sessionUser = data.user;
            closeSheets(); renderSettings(); toast(t('emailChanged'));
        } else if (editKind === 'password') {
            const oldP = $('#editPassOld').value, p1 = $('#editPassNew').value, p2 = $('#editPassNew2').value;
            const scored = scorePassword(p1, passCtx());
            if (!editRecovery && !oldP) { err.textContent = t('fillAll'); return; }
            if (!scored.ok) { err.textContent = scored.hint; return; }
            if (p1 !== p2) { err.textContent = t('passMismatch'); return; }
            if (!editRecovery && p1 === oldP) { err.textContent = t('samePassword'); return; }
            btn.disabled = true;
            if (!editRecovery) {
                // Повторная проверка текущего пароля перед сменой
                const { error: reErr } = await sb.auth.signInWithPassword({ email: sessionUser.email, password: oldP });
                if (reErr) {
                    btn.disabled = false;
                    err.textContent = authErrText(reErr) === t('wrongCreds') ? t('wrongOldPass') : authErrText(reErr);
                    return;
                }
            }
            const { error } = await sb.auth.updateUser({ password: p1 });
            btn.disabled = false;
            if (error) { err.textContent = authErrText(error); return; }
            closeSheets();
            toast(t('passChanged'));
        }
    }
    function render() {
        if (tab === 'stats') renderStats();
        else if (tab === 'settings') renderSettings();
        else renderToday();
    }

    // ---------- actions ----------
    function toggle(id, btn) {
        // block only while this check is mid-animation
        const existing = document.querySelector(`.rw[data-id="${id}"] .check`);
        if ((btn && btn.dataset.animating === '1') || (existing && existing.dataset.animating === '1')) return;
        if (!same(sel, today)) {
            if (btn) { btn.classList.remove('nudge'); void btn.offsetWidth; btn.classList.add('nudge'); }
            toast(relOf(sel) > 0 ? t('markOnlyToday') : t('pastClosed'));
            return;
        }
        const h = byId(id);
        if (!h || !isPlanned(h, sel)) return;
        const k = key(sel);
        const arr = state.log[k] || (state.log[k] = []);
        const i = arr.indexOf(id);
        if (i >= 0) arr.splice(i, 1); else arr.push(id);
        if (!arr.length) delete state.log[k];
        if (i < 0) { popId = id; unpopId = null; }
        else { unpopId = id; popId = null; }
        persist(); render();
        popId = null; unpopId = null;
        // mark the freshly rendered check so it can't be tapped until anim ends
        const chk = document.querySelector(`.rw[data-id="${id}"] .check`);
        if (chk) {
            chk.dataset.animating = '1';
            setTimeout(() => {
                chk.classList.remove('pop', 'unpop');
                delete chk.dataset.animating;
            }, 380);
        }
    }

    function setTab(t) {
        if (t === 'today' && tab === 'today') { sel = today; render(); return; }
        const prev = tab;
        tab = t;
        const views = { today: $('#viewToday'), stats: $('#viewStats'), settings: $('#viewSettings') };
        Object.keys(views).forEach(k => {
            views[k].hidden = k !== t;
            views[k].classList.remove('stagger');
        });
        document.querySelectorAll('.tab').forEach(b => {
            const on = b.dataset.tab === t;
            b.classList.toggle('on', on);
            if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
        });
        if (t === 'today') renderToday();
        if (t === 'stats') renderStats();
        if (t === 'settings') renderSettings();
        if (prev !== t) {
            const v = views[t];
            if (v && settings.motion) {
                v.style.animation = 'none';
                void v.offsetWidth;
                v.style.animation = '';
                v.classList.add('stagger');
                const clear = () => {
                    // Keep final visual state: remove class only after animations settle
                    requestAnimationFrame(() => v.classList.remove('stagger'));
                };
                let ended = 0;
                const onEnd = () => { if (++ended >= 1) { v.removeEventListener('animationend', onEnd); clear(); } };
                v.addEventListener('animationend', onEnd);
                setTimeout(clear, 1200);
            }
        }
        // Reset scroll only when switching tabs (not when staying / creating)
        if (prev !== t) {
            try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); } catch (e) { window.scrollTo(0, 0); }
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        }
    }


    function buildWeekHTML(ws) {
        let wk = '';
        for (let i = 0; i < 7; i++) {
            const d = addDays(ws, i), fut = d > today, st = dayStats(d);
            const ratio = fut || !st.total ? 0 : st.done / st.total;
            const label = d.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
            wk += `<button class="day${same(d, sel) ? ' sel' : ''}${same(d, today) ? ' today' : ''}${fut ? ' fut' : ''}" data-k="${key(d)}" aria-label="${label}">
        <span class="dow">${DOW()[i]}</span>
        <span class="dring">${miniRing(ratio, fut && st.total > 0, key(d))}<span class="dn">${d.getDate()}</span></span>
      </button>`;
        }
        return wk;
    }
    function fillWeekTrack(ws) {
        const prev = $('#weekPrev'), cur = $('#week'), next = $('#weekNext'), track = $('#weekTrack');
        if (!cur || !track) return;
        prev.innerHTML = buildWeekHTML(addDays(ws, -7));
        cur.innerHTML = buildWeekHTML(ws);
        next.innerHTML = buildWeekHTML(addDays(ws, 7));
        track.classList.add('no-anim');
        track.classList.remove('animating');
        track.style.transform = 'translate3d(-33.3333%,0,0)';
        void track.offsetWidth;
        track.classList.remove('no-anim');
        animateMiniRings();
    }
    function softContentSwap(fn) {
        const hero = document.querySelector('#viewToday .hero');
        const list = $('#list');
        const title = $('#title');
        const sub = $('#subtitle');
        const nodes = [hero, list, title, sub].filter(Boolean);
        nodes.forEach(n => { n.classList.add('view-fade'); n.classList.add('out'); });
        requestAnimationFrame(() => {
            fn();
            requestAnimationFrame(() => {
                nodes.forEach(n => { n.classList.remove('out'); n.classList.add('in'); });
                setTimeout(() => nodes.forEach(n => n.classList.remove('view-fade', 'in')), 320);
            });
        });
    }

    let weekDir = 0;
    function shiftWeek(n) {
        const lo = addDays(today, -WEEKS_BACK * 7), hi = addDays(today, WEEKS_AHEAD * 7 + 6);
        let d = addDays(sel, n * 7);
        if (d < lo) d = lo; if (d > hi) d = hi;
        if (mondayOf(d).getTime() === mondayOf(sel).getTime()) return;
        sel = d;
        weekDir = 0;
        fillWeekTrack(mondayOf(d));
        renderToday();
    }

    // ---------- delete ----------
    function deleteItems(id, d, fromEditor, long) {
        const h = byId(id); if (!h || !editable(d)) return [];
        const here = isPlanned(h, d), rec = here && rule(h, d), T = same(d, today);
        const finish = (text, s) => { persist(); if (fromEditor) closeSheets(); render(); toast(text, s); };
        if (h.once) return [{ label: t('removeFromDay'), icon: 'minus', danger: true, run: () => { const s = snap(); removeFromDay(id, d); finish(t('removedFromDay'), s); } }];
        const items = [];
        if (here) items.push({
            label: rec ? (long ? (T ? t('rmToday') : t('rmThisDay')) : (T ? t('onlyToday') : t('onlyThisDay'))) : (long ? t('removeFromDay') : t('onlyThisDay')),
            icon: 'minus', danger: true,
            run: () => { const s = snap(); removeFromDay(id, d); finish(t('removedFromDay'), s); }
        });
        items.push({
            label: rec ? (long ? (T ? t('delFromToday') : t('delFromThisDay')) : (T ? t('todayAndBeyond') : t('thisDayAndBeyond'))) : t('deleteHabit'),
            icon: 'trash', danger: true,
            run: () => { const s = snap(); endFrom(id, d); finish(t('habitDeleted'), s); }
        });
        return items;
    }
    function askDelete(id, d, fromEditor, anchor) {
        const h = byId(id); if (!h || !editable(d)) return;
        const items = deleteItems(id, d, fromEditor, true);
        if (!items.length) return;
        if (h.once) { items[0].run(); return; }
        const rec = isPlanned(h, d) && rule(h, d);
        showActions({ title: h.name, message: rec ? t('repeats') : '', items });
    }

    // ---------- habit editor ----------
    const sheetEl = $('#sheet'), copyEl = $('#copySheet'), dateEl = $('#dateSheet'), editEl = $('#editSheet'), scrim = $('#scrim'), nameInput = $('#nameInput');
    let ed = null, draft = null, pickMonth = null;

    function showSheet(el) {
        hideMenu(true);
        el.style.transform = '';
        el.style.transition = '';
        const body = el.querySelector('.sheet-body');
        if (body) body.scrollTop = 0;
        el.classList.add('open');
        scrim.style.opacity = '';
        scrim.classList.add('open');
        document.documentElement.style.overflow = 'hidden';
    }
    function closeSheets() {
        [sheetEl, copyEl, dateEl, editEl].forEach(el => {
            if (!el) return;
            el.classList.remove('open');
            el.style.transform = '';
            el.style.transition = '';
            const body = el.querySelector('.sheet-body');
            if (body) body.scrollTop = 0;
        });
        scrim.classList.remove('open');
        scrim.style.opacity = '';
        document.documentElement.style.overflow = ''; nameInput.blur();
        sheetDrag = null;
        editKind = null;
        editRecovery = false;
        ['editPassOld', 'editPassNew', 'editPassNew2'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
    }
    const sheetOpen = () => [sheetEl, copyEl, dateEl, editEl].some(el => el && el.classList.contains('open'));

    // Drag sheet down to dismiss (phone only)
    let sheetDrag = null;
    function bindSheetDrag(el) {
        const bar = el.querySelector('.sheet-bar') || el;
        const onStart = e => {
            if (isFine()) return;
            if (e.target.closest('button, input, a, .wd, .em, .sw, .chip, .dc, .lrow, .seg')) return;
            const body = el.querySelector('.sheet-body');
            if (body && body.scrollTop > 2 && e.target.closest('.sheet-body')) return;
            sheetDrag = { el, y: e.clientY, dy: 0, pid: e.pointerId, active: false };
            try { el.setPointerCapture(e.pointerId); } catch (err) { }
        };
        const onMove = e => {
            if (!sheetDrag || sheetDrag.el !== el || e.pointerId !== sheetDrag.pid) return;
            const dy = Math.max(0, e.clientY - sheetDrag.y);
            sheetDrag.dy = dy;
            if (!sheetDrag.active && dy > 6) {
                sheetDrag.active = true;
                el.style.transition = 'none';
            }
            if (sheetDrag.active) {
                el.style.transform = `translateY(${dy}px)`;
                const op = Math.max(0, 1 - dy / 320);
                scrim.style.opacity = String(op * (scrim.classList.contains('open') ? 1 : 0) || op);
            }
        };
        const onEnd = e => {
            if (!sheetDrag || sheetDrag.el !== el || e.pointerId !== sheetDrag.pid) return;
            const { dy, active } = sheetDrag; sheetDrag = null;
            el.style.transition = '';
            scrim.style.opacity = '';
            if (active && dy > 110) { closeSheets(); }
            else { el.style.transform = ''; }
        };
        bar.addEventListener('pointerdown', onStart);
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onEnd);
        el.addEventListener('pointercancel', onEnd);
    }

    bindSheetDrag(sheetEl); bindSheetDrag(copyEl); bindSheetDrag(dateEl);

    function openAdd() {
        if (!editable(sel)) return;
        ed = { mode: 'new', id: null, anchor: sel, tab: 'new' };
        draft = { name: '', emoji: '💧', color: 'purple', days: [0, 1, 2, 3, 4, 5, 6] };
        nameInput.value = '';
        setupEditor();
        showSheet(sheetEl);
        setTimeout(() => { if (ed && ed.tab === 'new' && ed.mode === 'new') nameInput.focus({ preventScroll: true }); }, 400);
    }
    function openEdit(id) {
        const h = byId(id); if (!h) return;
        ed = { mode: 'edit', id, anchor: editable(sel) ? sel : today, tab: 'new' };
        draft = { name: h.name, emoji: h.emoji, color: h.color, days: [...h.days] };
        nameInput.value = h.name;
        setupEditor();
        showSheet(sheetEl);
    }
    function setupEditor() {
        const isNew = ed.mode === 'new';
        ed.listable = isNew ? state.habits.filter(h => !h.once && isActive(h) && alive(h, ed.anchor) && !isPlanned(h, ed.anchor)) : [];
        $('#seg').hidden = !isNew;
        $('#editNote').hidden = isNew;
        editorTexts();
        ed.tab = 'new';
        renderEditor();
        renderDelGroup();
    }
    function editorTexts() {
        $('#done').textContent = ed.mode === 'new' ? t('add') : t('save');
    }
    function renderDelGroup() {
        const g = $('#delGroup');
        if (!ed || ed.mode === 'new' || !ed.id) {
            g.hidden = true; g.innerHTML = ''; ed && (ed.delRuns = null);
            return;
        }
        const items = deleteItems(ed.id, ed.anchor, true, true);
        if (!items.length) { g.hidden = true; g.innerHTML = ''; ed.delRuns = null; return; }
        // On desktop: always show both options inline. On phone: same — no extra iOS sheet from editor.
        g.hidden = false;
        ed.delRuns = items.map(it => it.run);
        g.innerHTML = items.map((it, i) =>
            `<button type="button" class="danger" data-del="${i}">${esc(it.label)}</button>`
        ).join('');
    }
    function renderEditor() {
        const body = sheetEl.querySelector('.sheet-body');
        const keepY = body ? body.scrollTop : 0;
        const isNew = ed.mode === 'new', inList = ed.tab === 'list';
        $('#sheetTitle').textContent = isNew ? (inList ? t('addToDay') : t('newHabit')) : t('habit');
        $('#seg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === ed.tab));
        $('#formWrap').classList.toggle('is-off', inList);
        $('#listWrap').classList.toggle('is-off', !inList);
        $('#done').hidden = inList;
        if (inList) {
            $('#listGroup').innerHTML = ed.listable.length
                ? ed.listable.map(h => `<button class="lrow" data-id="${h.id}" style="${cs(h.color)}">
        <div class="icon">${h.emoji}</div><div class="meta"><div class="name">${esc(h.name)}</div><div class="sub">${sched(h)}</div></div>
        <span class="plus"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span></button>`).join('')
                : `<div class="empty" style="padding:28px 16px"><p>${t('allAdded')}</p></div>`;
            if (body) body.scrollTop = keepY;
            return;
        }
        const col = `var(--c-${draft.color})`;
        const pv = $('#pv');
        if (pv.textContent !== draft.emoji) pv.textContent = draft.emoji;
        const nextBg = `linear-gradient(150deg, color-mix(in srgb, ${col} 26%, transparent), color-mix(in srgb, ${col} 12%, transparent))`;
        if (pv.style.background !== nextBg) pv.style.background = nextBg;
        // Update selection classes in place when possible to avoid layout jump
        const sw = $('#swatches');
        if (sw.children.length === COLORS.length) {
            [...sw.children].forEach((b, i) => {
                b.classList.toggle('on', COLORS[i] === draft.color);
            });
        } else {
            sw.innerHTML = COLORS.map(c => `<button class="sw${c === draft.color ? ' on' : ''}${isPale(c) ? ' pale' : ''}" data-c="${c}" style="${cs(c)}" aria-label="${colorLabel(c)}"></button>`).join('');
        }
        const em = $('#emojis');
        if (em.children.length === EMOJI.length) {
            [...em.children].forEach((b, i) => b.classList.toggle('on', EMOJI[i] === draft.emoji));
        } else {
            em.innerHTML = EMOJI.map(e => `<button class="em${e === draft.emoji ? ' on' : ''}" data-e="${e}">${e}</button>`).join('');
        }
        const wd = $('#wdays');
        if (wd.children.length === 7) {
            [...wd.children].forEach((b, i) => {
                const on = draft.days.includes(i);
                b.classList.toggle('on', on);
                b.setAttribute('aria-pressed', on);
            });
        } else {
            wd.innerHTML = DOW().map((n, i) => `<button class="wd${draft.days.includes(i) ? ' on' : ''}" data-d="${i}" aria-pressed="${draft.days.includes(i)}">${n}</button>`).join('');
        }
        // quick day presets
        const sorted = [...draft.days].sort((a, b) => a - b).join(',');
        const isAll = sorted === '0,1,2,3,4,5,6';
        const isWeekdays = sorted === '0,1,2,3,4';
        const isWeekends = sorted === '5,6';
        const isOnly = draft.days.length === 0;
        const rel = relOf(ed.anchor);
        const onlyLabel = rel === 0 ? t('onlyTodayQuick') : (rel === 1 ? t('onlyTomorrowQuick') : t('onlyThisDayQuick'));
        const qd = $('#quickDays');
        if (qd) {
            qd.innerHTML = [
                `<button type="button" class="chip${isAll ? ' on' : ''}" data-q="all">${t('selectAll')}</button>`,
                `<button type="button" class="chip${isWeekdays ? ' on' : ''}" data-q="weekdays">${t('weekdays')}</button>`,
                `<button type="button" class="chip${isWeekends ? ' on' : ''}" data-q="weekends">${t('weekends')}</button>`,
                `<button type="button" class="chip${isOnly ? ' on' : ''}" data-q="only">${onlyLabel}</button>`
            ].join('');
        }
        const nextHint = draft.days.length ? sched({ days: draft.days }) : `${t('notRepeat')} ${relLabel(ed.anchor)}`;
        const hintEl = $('#hint');
        if (hintEl.textContent !== nextHint) hintEl.textContent = nextHint;
        const doneBtn = $('#done');
        const shouldDisable = !draft.name.trim();
        if (doneBtn.disabled !== shouldDisable) doneBtn.disabled = shouldDisable;
        if (body) {
            body.scrollTop = keepY;
            requestAnimationFrame(() => { body.scrollTop = keepY; });
        }
    }
    function commitEditor() {
        const name = draft.name.trim();
        if (!name) return;
        const days = [...draft.days].sort((a, b) => a - b), a = ed.anchor;
        if (ed.mode === 'edit') {
            const h = byId(ed.id); if (!h) return closeSheets();
            const was = isPlanned(h, a);
            Object.assign(h, { name, emoji: draft.emoji, color: draft.color, days, once: days.length === 0 });
            pc.clear();
            if (!days.length && was) addToDay(h.id, a);
        } else {
            const h = { id: uid(), name, emoji: draft.emoji, color: draft.color, days, created: key(a), once: days.length === 0 };
            state.habits.push(h);
            pc.clear();
            addToDay(h.id, a);
        }
        persist(); closeSheets(); render();
    }

    // ---------- copy day ----------
    let cp = null;
    function quickSets() {
        const sk = key(cp.src), tk = key(today), out = [];
        const mk = (label, arr) => { const ks = arr.map(key).filter(k => k !== sk && k >= tk); if (ks.length) out.push({ label, ks }); };
        const t1 = addDays(today, 1), sun = addDays(mondayOf(today), 6), rest = [];
        for (let d = t1; d <= sun; d = addDays(d, 1)) rest.push(d);
        mk(t('tomorrow'), [t1]);
        if (rest.length > 1) mk(t('restOfWeek'), rest);
        const nm = addDays(mondayOf(today), 7), nw = [];
        for (let i = 0; i < 7; i++) nw.push(addDays(nm, i));
        mk(t('nextWeek'), nw);
        // all days from today to horizon
        const all = [];
        const hi = calHi();
        for (let d = today; d <= hi; d = addDays(d, 1)) all.push(d);
        mk(t('allDaysQuick'), all);
        return out;
    }
    function openCopy() {
        if (!planned(sel).length) return;
        cp = { src: sel, targets: new Set(), mode: 'merge', quick: [], cal: { month: new Date(today.getFullYear(), today.getMonth(), 1), picking: false, year: today.getFullYear() } };
        cp.quick = quickSets();
        renderCopy();
        showSheet(copyEl);
    }
    function renderCopy() {
        const list = planned(cp.src), sk = key(cp.src), tk = key(today);
        $('#srcInfo').innerHTML = `<div class="srctxt"><b>${t('planFor')} ${fmtDay(cp.src)}</b><span>${list.length} ${tp(list.length, t('hab1'), t('hab2'), t('hab5'))}</span></div><div class="emj">${esc(list.slice(0, 6).map(h => h.emoji).join(''))}</div>`;
        $('#chips').innerHTML = cp.quick.map((q, i) => `<button class="chip${q.ks.every(k => cp.targets.has(k)) ? ' on' : ''}" data-i="${i}">${q.label}</button>`).join('');
        calRender($('#cal'), cp.cal, copyCfg);
        $('#modeSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === cp.mode));
        const n = cp.targets.size;
        $('#copyHint').textContent = (cp.mode === 'merge'
            ? t('mergeHint')
            : t('replaceHint'))
            + t('notCopied') + (n ? `${t('selected')} ${n} ${tp(n, t('day'), t('days2'), t('days5'))}.` : t('selectDays'));
        $('#copyDone').disabled = !n;
    }
    function applyCopy() {
        const src = planned(cp.src).slice(), sk = key(cp.src), tk = key(today);
        const s = snap(); let n = 0;
        cp.targets.forEach(k => {
            if (k < tk || k === sk) return;
            const d = parseKey(k), o = ovr(k);
            const want = new Set(src.filter(h => alive(h, d)).map(h => h.id));
            const keep = k === tk ? new Set(state.log[k] || []) : new Set();
            state.habits.forEach(h => {
                if (!alive(h, d)) return;
                const r = rule(h, d);
                if (want.has(h.id)) {
                    o.skip = o.skip.filter(x => x !== h.id);
                    if (!r && !o.add.includes(h.id)) o.add.push(h.id);
                } else if (cp.mode === 'replace' && !keep.has(h.id)) {
                    o.add = o.add.filter(x => x !== h.id);
                    if (r && !o.skip.includes(h.id)) o.skip.push(h.id);
                }
            });
            clean(k); n++;
        });
        persist(); closeSheets(); render();
        toast(`${t('planCopied')} ${n} ${tp(n, t('day'), t('days2'), t('days5'))}`, s);
    }

    // ---------- events ----------
    $('#addBtn').addEventListener('click', openAdd);
    $('#moreBtn').addEventListener('click', () => {
        const rel = relOf(sel), list = planned(sel);
        const items = [{ label: t('copyPlan'), icon: 'copy', run: openCopy }];
        if (rel >= 0 && list.some(h => !(rel === 0 && isDone(h, sel)))) {
            items.push({
                label: t('clearDay'), icon: 'trash', danger: true, sep: true, run: () => {
                    const s = snap();
                    planned(sel).slice().forEach(h => { if (!(rel === 0 && isDone(h, sel))) removeFromDay(h.id, sel); });
                    persist(); render(); toast(t('dayCleared'), s);
                }
            });
        }
        showActions({ title: cap(sel.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })), items, anchor: $('#moreBtn') });
    });
    $('#prevWeek').addEventListener('click', () => shiftWeek(-1));
    $('#nextWeek').addEventListener('click', () => shiftWeek(1));

    $('#todayBtn').addEventListener('click', () => { sel = today; renderToday(); });
    $('#weekLabel').addEventListener('click', openDatePick);
    let prevSelKey = null;
    $('#week').addEventListener('click', e => {
        const b = e.target.closest('.day'); if (!b) return;
        const nk = b.dataset.k;
        if (nk === key(sel)) return;
        prevSelKey = key(sel);
        sel = parseKey(nk);
        renderToday();
        if (settings.motion && prevSelKey) {
            const list = $('#list'), hero = document.querySelector('.hero');
            [list, hero].forEach(el => {
                if (!el) return;
                el.classList.remove('day-in');
                void el.offsetWidth;
                el.classList.add('day-in');
                const clr = () => el.classList.remove('day-in');
                el.addEventListener('animationend', clr, { once: true });
                setTimeout(clr, 320);
            });
        }
    });

    // list: tap, check, swipe, long-press
    let sw = null, suppress = false, pressT = 0;
    const closeRows = except => document.querySelectorAll('.rw.revealed').forEach(r => { if (r !== except) setDel(r, 0, true); });
    function setDel(rw, px, animate) {
        const w = Math.max(0, px);
        rw.style.setProperty('--del', w + 'px');
        rw.classList.toggle('snap', !!animate);
        rw.classList.toggle('revealed', w > 12);
    }

    function rowActions(id, anchor) {
        const h = byId(id); if (!h || !editable(sel)) return;
        const items = [{ label: t('edit'), icon: 'edit', run: () => openEdit(id) }];
        deleteItems(id, sel, false, true).forEach((it, i) => { if (i === 0) it.sep = true; items.push(it); });
        showActions({ title: h.name, items, anchor });
    }

    $('#list').addEventListener('click', e => {
        if (suppress) return;
        if (e.target.closest('[data-act="add"]')) return openAdd();
        const rw = e.target.closest('.rw'); if (!rw) return;
        const id = rw.dataset.id;
        if (e.target.closest('.swipe-del')) { closeRows(); return askDelete(id, sel, false); }
        if (e.target.closest('.row-more')) { closeRows(); return rowActions(id, e.target.closest('.row-more')); }
        if (rw.classList.contains('revealed')) return closeRows();
        const chk = e.target.closest('.check');
        if (chk) {
            if (suppress) return;
            return toggle(id, chk);
        }
        if (editable(sel)) openEdit(id);
        else toast(t('pastClosed'));
    });
    $('#list').addEventListener('contextmenu', e => {
        const rw = e.target.closest('.rw'); if (!rw) return;
        e.preventDefault();
        if (isFine() && editable(sel)) rowActions(rw.dataset.id, rw.querySelector('.row-more'));
    });

    let chkHold = null;
    $('#list').addEventListener('pointerdown', e => {
        const chk = e.target.closest('.check');
        const rw = e.target.closest('.rw');
        if (chk && rw) {
            // Long-press on checkbox → action sheet (no toggle)
            closeRows();
            if (isFine()) return; // desktop uses click/context menu
            chkHold = { id: rw.dataset.id, chk, x: e.clientX, y: e.clientY, pid: e.pointerId, fired: false };
            clearTimeout(pressT);
            pressT = setTimeout(() => {
                if (!chkHold || chkHold.fired) return;
                chkHold.fired = true;
                suppress = true; setTimeout(() => { suppress = false; }, 450);
                rowActions(chkHold.id, chkHold.chk);
                chkHold = null;
            }, 480);
            return;
        }
        if (!rw || e.target.closest('.row-more')) { closeRows(); return; }
        if (!rw.querySelector('.swipe-del')) { closeRows(); return; }
        closeRows(rw);
        if (isFine()) return;
        const open = rw.classList.contains('revealed') ? DEL_W : 0;
        sw = { rw, id: rw.dataset.id, x: e.clientX, y: e.clientY, base: open, t: open, active: false, pid: e.pointerId, hold: true };
        clearTimeout(pressT);
        pressT = setTimeout(() => {
            if (!sw || sw.active || !sw.hold) return;
            sw.hold = false;
            suppress = true; setTimeout(() => { suppress = false; }, 400);
            rowActions(sw.id);
            sw = null;
        }, 500);
    });
    document.addEventListener('pointerdown', e => { if (!e.target.closest('#list')) closeRows(); }, true);
    document.addEventListener('pointermove', e => {
        if (chkHold && e.pointerId === chkHold.pid) {
            const dx = e.clientX - chkHold.x, dy = e.clientY - chkHold.y;
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) { clearTimeout(pressT); chkHold = null; }
            return;
        }
        if (!sw || e.pointerId !== sw.pid) return;
        const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) { sw.hold = false; clearTimeout(pressT); }
        if (isFine()) return;
        if (!sw.active) {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.15) {
                sw.active = true;
                try { sw.rw.setPointerCapture(sw.pid); } catch (err) { }
            } else if (Math.abs(dy) > 10) { clearTimeout(pressT); sw = null; return; }
            else return;
        }
        let w = sw.base - dx;
        if (w < 0) w *= .2;
        if (w > DEL_W + 36) w = DEL_W + 36;
        sw.t = w;
        setDel(sw.rw, w, false);
    });
    function endSwipe(cancel) {
        clearTimeout(pressT);
        if (chkHold) { chkHold = null; }
        if (!sw) return;
        const { rw, t, active, id, hold } = sw; sw = null;
        if (hold && !active) return;
        if (!active) return;
        suppress = true; setTimeout(() => { suppress = false; }, 80);
        if (!cancel && t > DEL_W * 1.35) { setDel(rw, 0, true); askDelete(id, sel, false); }
        else if (!cancel && t > DEL_W * .45) { setDel(rw, DEL_W, true); }
        else setDel(rw, 0, true);
    }
    document.addEventListener('pointerup', e => {
        if (chkHold && e.pointerId === chkHold.pid) {
            clearTimeout(pressT);
            // short tap → let click handler toggle; long-press already suppressed
            chkHold = null;
            return;
        }
        if (sw && e.pointerId === sw.pid) endSwipe(false);
    });
    document.addEventListener('pointercancel', e => {
        if (chkHold && e.pointerId === chkHold.pid) { clearTimeout(pressT); chkHold = null; }
        if (sw && e.pointerId === sw.pid) endSwipe(true);
    });

    $('#stats').addEventListener('click', e => {
        const cell = e.target.closest('.cell[data-k]');
        if (cell) {
            e.preventDefault();
            e.stopPropagation();
            sel = parseKey(cell.dataset.k);
            setTab('today');
            return;
        }
        const c = e.target.closest('.scard'); if (c) openEdit(c.dataset.id);
    });
    $('#stats').addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const c = e.target.closest('.scard'); if (c) { e.preventDefault(); openEdit(c.dataset.id); }
    });
    document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
    $('#ringbox').addEventListener('animationend', () => $('#ringbox').classList.remove('cele'));

    // editor
    scrim.addEventListener('click', closeSheets);
    $('#cancel').addEventListener('click', closeSheets);
    $('#done').addEventListener('click', commitEditor);
    $('#delGroup').addEventListener('click', e => {
        const b = e.target.closest('[data-del]'); if (!b || !ed || !ed.delRuns) return;
        const fn = ed.delRuns[+b.dataset.del]; if (fn) fn();
    });
    nameInput.addEventListener('input', () => { draft.name = nameInput.value; $('#done').disabled = !draft.name.trim(); });
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commitEditor(); } });
    $('#swatches').addEventListener('click', e => { const b = e.target.closest('.sw'); if (b) { e.preventDefault(); draft.color = b.dataset.c; renderEditor(); } });
    $('#emojis').addEventListener('click', e => { const b = e.target.closest('.em'); if (b) { e.preventDefault(); draft.emoji = b.dataset.e; renderEditor(); } });
    $('#wdays').addEventListener('click', e => {
        const b = e.target.closest('.wd'); if (!b) return;
        const i = +b.dataset.d, at = draft.days.indexOf(i);
        if (at >= 0) draft.days.splice(at, 1); else draft.days.push(i);
        renderEditor();
    });
    $('#quickDays').addEventListener('click', e => {
        const b = e.target.closest('[data-q]'); if (!b) return;
        const q = b.dataset.q;
        if (q === 'all') draft.days = [0, 1, 2, 3, 4, 5, 6];
        else if (q === 'weekdays') draft.days = [0, 1, 2, 3, 4];
        else if (q === 'weekends') draft.days = [5, 6];
        else if (q === 'only') draft.days = [];
        renderEditor();
    });
    $('#seg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { ed.tab = b.dataset.m; renderEditor(); } });
    $('#listGroup').addEventListener('click', e => {
        const b = e.target.closest('.lrow'); if (!b || !editable(ed.anchor)) return;
        const s = snap(); addToDay(b.dataset.id, ed.anchor);
        persist(); closeSheets(); render(); toast(t('addedToDay'), s);
    });

    // copy
    $('#copyCancel').addEventListener('click', closeSheets);
    $('#copyDone').addEventListener('click', applyCopy);
    $('#chips').addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        const q = cp.quick[+b.dataset.i], on = q.ks.every(k => cp.targets.has(k));
        q.ks.forEach(k => on ? cp.targets.delete(k) : cp.targets.add(k));
        renderCopy();
    });
    $('#modeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cp.mode = b.dataset.m; renderCopy(); } });

    // actions / toast
    $('#agMain').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        const it = actItems[+b.dataset.i]; hideActions(); if (it) it.run();
    });
    $('#agCancel').addEventListener('click', hideActions);
    $('#scrim2').addEventListener('click', hideActions);
    $('#undoBtn').addEventListener('click', () => { const s = undoSnap; hideToast(); if (s) restore(s); });
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (menuEl) return;
        if ($('#actions').classList.contains('open')) hideActions();
        else if (sheetOpen()) closeSheets();
    });

    // смена суток
    function tick() {
        const prev = today;
        if (syncToday()) {
            const wasToday = same(sel, prev);
            freezePast();
            if (wasToday) sel = today;
            persist(); render();
        }
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
    setInterval(tick, 30000);

    // ---------- auth form ----------
    $('#authForm').addEventListener('submit', async e => {
        e.preventDefault();
        if (!sb) return;
        clearFlags();
        const email = $('#authEmail').value.trim();
        const pass = $('#authPass').value;
        const nick = ($('#authNick').value || '').trim();
        const btn = $('#authGo');
        if (btn.disabled) return;

        if (authMode === 'signin') {
            if (!EMAIL_RE.test(email)) { flagField('emailField'); authMsg(t('emailInvalid')); return; }
            if (!pass) { flagField('passField'); authMsg(t('authErr')); return; }
            const left = lockLeft();
            if (left > 0) { authMsg(t('lockedFor') + left + t('secShort')); return; }
        } else {
            if (!nickOk(nick)) { flagField('nickField'); authMsg(t('nickShort')); return; }
            if (!EMAIL_RE.test(email)) { flagField('emailField'); authMsg(t('emailInvalid')); return; }
            const scored = scorePassword(pass, { email, nick });
            if (!scored.ok) { flagField('passField'); authMsg(scored.hint); return; }
        }

        setLoading(btn, true); authMsg('');
        try {
            if (authMode === 'signin') {
                setRemember($('#authRemember').checked);
                const { error } = await sb.auth.signInWithPassword({ email, password: pass });
                if (error) {
                    const m = String(error.message || '').toLowerCase();
                    if (m.includes('invalid login') || String(error.code || '') === 'invalid_credentials') {
                        registerFail();
                        flagField('emailField'); flagField('passField');
                    }
                    authMsg(authErrText(error));
                } else {
                    loginFails = 0; lockUntil = 0;
                    // дальше работает onAuthStateChange → handleSession
                }
            } else {
                const { data, error } = await sb.auth.signUp({
                    email, password: pass,
                    options: {
                        data: { nickname: nick },
                        emailRedirectTo: window.location.origin + window.location.pathname
                    }
                });
                if (error) { authMsg(authErrText(error)); return; }
                // Supabase при включённом подтверждении почты не выдаёт ошибку для занятого email,
                // но возвращает пользователя без identities
                if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
                    flagField('emailField'); authMsg(t('emailExists')); return;
                }
                if (data && data.session && data.user) {
                    try { await sb.from('profiles').upsert({ user_id: data.user.id, nickname: nick }); } catch (err) { }
                    try { await sb.auth.signOut(); } catch (err) { }
                }
                setAuthMode('signin');
                $('#authEmail').value = email;
                $('#authPass').value = '';
                resetPassToggles();
                authMsg(t('signupSuccess'), true);
            }
        } catch (err) {
            console.error(err);
            authMsg(authErrText(err));
        } finally {
            setLoading(btn, false);
        }
    });
    // снимаем красную рамку при вводе
    $('#authForm').addEventListener('input', e => {
        const f = e.target.closest('.auth-field'); if (f) f.classList.remove('invalid');
        if (authMode === 'signup' && ['authPass', 'authEmail', 'authNick'].includes(e.target.id)) {
            paintMeter($('#passMeter'), $('#passHint'), $('#authPass').value);
        }
    });
    $('#authSeg').addEventListener('click', e => {
        const b = e.target.closest('button[data-m]'); if (!b || b.dataset.m === authMode) return;
        setAuthMode(b.dataset.m);
    });
    $('#gateTheme').addEventListener('click', () => {
        const root = document.documentElement;
        const dark = root.getAttribute('data-theme') === 'dark';
        settings.theme = dark ? 'light' : 'dark';
        root.classList.add('theme-anim');
        applyAppearance();
        setTimeout(() => root.classList.remove('theme-anim'), 450);
    });
    $('#authRemember').addEventListener('change', e => {
        const row = $('#rememberRow');
        row.classList.remove('pop');
        if (e.target.checked) { void row.offsetWidth; row.classList.add('pop'); }
    });

    $('#resPass').addEventListener('input', () => paintMeter($('#resMeter'), $('#resHint'), $('#resPass').value));
    $('#resetForm').addEventListener('submit', async e => {
        e.preventDefault();
        if (!sb) return;
        const p1 = $('#resPass').value, p2 = $('#resPass2').value;
        const err = $('#resErr'), btn = $('#resGo');
        err.textContent = '';
        const scored = scorePassword(p1, passCtx());
        if (!scored.ok) { err.textContent = scored.hint; return; }
        if (p1 !== p2) { err.textContent = t('passMismatch'); return; }
        setLoading(btn, true);
        try {
            const { error } = await sb.auth.updateUser({ password: p1 });
            if (error) { err.textContent = authErrText(error); return; }
            recoveryPending = false;
            try { history.replaceState(null, '', location.pathname); } catch (x) { }
            const { data: { session } } = await sb.auth.getSession();
            await handleSession(session);
            toast(t('passChanged'));
        } catch (x) {
            err.textContent = authErrText(x);
        } finally {
            setLoading(btn, false);
        }
    });
    $('#resCancel').addEventListener('click', async () => {
        recoveryPending = false;
        try { history.replaceState(null, '', location.pathname); } catch (x) { }
        if (sb) await sb.auth.signOut();
    });
    $('#gateLang').addEventListener('click', e => {
        const b = e.target.closest('button[data-v]'); if (!b || b.dataset.v === settings.lang) return;
        settings.lang = b.dataset.v;
        try { localStorage.setItem('habits.lang', settings.lang); } catch (err) { }
        applyAppearance();
        setAuthMode(authMode);
    });
    $('#forgotBtn').addEventListener('click', async () => {
        if (!sb) return;
        const email = $('#authEmail').value.trim();
        if (!EMAIL_RE.test(email)) { flagField('emailField'); authMsg(t('emailInvalid')); $('#authEmail').focus(); return; }
        authMsg(''); clearFlags();
        const btn = $('#forgotBtn'); btn.disabled = true;
        try {
            const { error } = await sb.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + window.location.pathname
            });
            // Не раскрываем, существует ли аккаунт: сообщение одинаковое
            if (error && !/not found|no user/i.test(error.message || '')) { authMsg(authErrText(error)); return; }
            authMsg(t('resetSent'), true);
        } catch (err) {
            authMsg(authErrText(err));
        } finally {
            btn.disabled = false;
        }
    });

    // ---------- settings ----------
    $('#themeSeg').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        settings.theme = b.dataset.v; applyAppearance(); persist(); renderSettings();
    });
    $('#langSeg').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.v === settings.lang) return;
        settings.lang = b.dataset.v;
        try { localStorage.setItem('habits.lang', settings.lang); } catch (e) { }
        applyAppearance(); persist(); renderSettings(); render();
    });
    let motionBusy = false;
    $('#motionSw').addEventListener('click', () => {
        if (motionBusy) return;
        const sw = $('#motionSw');
        const turningOff = settings.motion;
        motionBusy = true;
        sw.style.pointerEvents = 'none';
        if (turningOff) {
            // Play switch OFF animation while motion still allowed, then lock no-motion
            settings.motion = false;
            sw.classList.remove('on');
            sw.setAttribute('aria-checked', 'false');
            const finish = () => {
                document.documentElement.classList.add('no-motion');
                persist();
                motionBusy = false;
                sw.style.pointerEvents = '';
            };
            const knob = sw.querySelector('i');
            let done = false;
            const once = () => { if (done) return; done = true; finish(); };
            if (knob) knob.addEventListener('transitionend', once, { once: true });
            setTimeout(once, 340);
        } else {
            // Enable motion without re-render and without replaying tab enter animation
            settings.motion = true;
            const views = document.querySelectorAll('.app > main');
            views.forEach(v => v.classList.remove('stagger'));
            document.documentElement.classList.remove('no-motion');
            sw.classList.add('on');
            sw.setAttribute('aria-checked', 'true');
            persist();
            const once = () => { motionBusy = false; sw.style.pointerEvents = ''; };
            const knob = sw.querySelector('i');
            if (knob) knob.addEventListener('transitionend', once, { once: true });
            setTimeout(once, 340);
        }
    });
    $('#profileHead').addEventListener('click', () => setProfileOpen(!profileOpen));
    $('#profilePanel').addEventListener('click', e => {
        const b = e.target.closest('.profile-action'); if (!b) return;
        openEditSheet(b.dataset.edit);
    });
    $('#editCancel').addEventListener('click', closeSheets);
    $('#editDone').addEventListener('click', () => commitEditSheet());
    $('#editPassNew').addEventListener('input', () => paintMeter($('#editPassMeter'), $('#editPassHint'), $('#editPassNew').value));
    ['editNick', 'editEmail', 'editPassOld', 'editPassNew', 'editPassNew2'].forEach(id => {
        $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commitEditSheet(); } });
    });
    $('#signOutBtn').addEventListener('click', async () => {
        if (!sb) return;
        await sb.auth.signOut();
    });

    // ---------- calendar widget (месяц + быстрый выбор месяца и года) ----------
    const CAL_CHEV = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
    const calArrow = dir => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;
    const calLo = () => addDays(today, -WEEKS_BACK * 7);
    const calHi = () => addDays(today, WEEKS_AHEAD * 7 + 6);

    function calRender(el, st, cfg, dir) {
        const lo = calLo(), hi = calHi();
        const y = st.month.getFullYear(), m = st.month.getMonth();
        let head, body = '';
        if (st.picking) {
            const py = st.year, minY = lo.getFullYear(), maxY = hi.getFullYear();
            head = `<div class="calhead"><button type="button" class="calttl on" data-a="ttl" aria-expanded="true">${py}${CAL_CHEV}</button>
        <div class="nav"><button type="button" data-a="py-" ${py <= minY ? 'disabled' : ''} aria-label="${t('prevYear')}">${calArrow(-1)}</button><button type="button" data-a="py+" ${py >= maxY ? 'disabled' : ''} aria-label="${t('nextYear')}">${calArrow(1)}</button></div></div>`;
            body = '<div class="cal-clip"><div class="calbody"><div class="mpick">';
            for (let i = 0; i < 12; i++) {
                const first = new Date(py, i, 1), last = new Date(py, i + 1, 0);
                const dis = last < lo || first > hi;
                const lab = cap(first.toLocaleDateString(locale(), { month: 'short' }).replace('.', ''));
                body += `<button type="button" data-a="mon" data-m="${i}" class="${py === y && i === m ? 'on' : ''}${py === today.getFullYear() && i === today.getMonth() ? ' td' : ''}${dis ? ' dis' : ''}" ${dis ? 'disabled' : ''}>${lab}</button>`;
            }
            body += '</div></div></div>';
        } else {
            const title = cap(new Date(y, m, 1).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }));
            const prevOff = new Date(y, m, 0) < lo, nextOff = new Date(y, m + 1, 1) > hi;
            head = `<div class="calhead"><button type="button" class="calttl" data-a="ttl" aria-expanded="false">${title}${CAL_CHEV}</button>
        <div class="nav"><button type="button" data-a="prev" ${prevOff ? 'disabled' : ''} aria-label="${t('prevMonth')}">${calArrow(-1)}</button><button type="button" data-a="next" ${nextOff ? 'disabled' : ''} aria-label="${t('nextMonth')}">${calArrow(1)}</button></div></div>`;
            const startWd = wd(new Date(y, m, 1));
            let cells = DOW().map(n => `<div class="h">${n}</div>`).join('');
            for (let i = 0; i < 42; i++) {
                const d = new Date(y, m, 1 - startWd + i), k = key(d);
                const r = cfg.cell(d) || {};
                cells += `<button type="button" class="dc${d.getMonth() !== m ? ' out' : ''}${r.dis ? ' dis' : ''}${r.cls || ''}" data-k="${k}" ${r.dis || r.off ? 'disabled' : ''} aria-label="${fmtDay(d)}">${d.getDate()}</button>`;
            }
            body = `<div class="cal-clip"><div class="calbody"><div class="ios-cal">${cells}</div></div></div>`;
        }
        el.innerHTML = head + body;
        if (dir && settings.motion) {
            const bodyEl = el.querySelector('.calbody');
            if (bodyEl) {
                bodyEl.classList.remove('slide-left', 'slide-right', 'fade-in');
                void bodyEl.offsetWidth;
                if (dir === 'fade') bodyEl.classList.add('fade-in');
                else bodyEl.classList.add(dir > 0 ? 'slide-left' : 'slide-right');
                const clr = () => bodyEl.classList.remove('slide-left', 'slide-right', 'fade-in');
                bodyEl.addEventListener('animationend', clr, { once: true });
                setTimeout(clr, 450);
            }
        }
    }
    function calBind(el, getSt, cfg) {
        el.addEventListener('click', e => {
            const st = getSt(); if (!st) return;
            const b = e.target.closest('[data-a], .dc'); if (!b || b.disabled) return;
            if (b.classList.contains('dc')) { cfg.pick(parseKey(b.dataset.k)); return; }
            const a = b.dataset.a, y = st.month.getFullYear(), m = st.month.getMonth();
            let dir = 0;
            if (a === 'ttl') { st.picking = !st.picking; st.year = y; dir = 'fade'; }
            else if (a === 'prev') { st.month = new Date(y, m - 1, 1); dir = -1; }
            else if (a === 'next') { st.month = new Date(y, m + 1, 1); dir = 1; }
            else if (a === 'py-') { st.year--; dir = -1; }
            else if (a === 'py+') { st.year++; dir = 1; }
            else if (a === 'mon') { st.month = new Date(st.year, +b.dataset.m, 1); st.picking = false; dir = 'fade'; }
            calRender(el, st, cfg, dir);
        });
    }

    // date picker
    let dcal = null;
    const dateCfg = {
        cell(d) { const k = key(d); return { dis: d < calLo() || d > calHi(), cls: (k === key(sel) ? ' on' : '') + (k === key(today) ? ' td' : '') }; },
        pick(d) { sel = d; renderToday(); closeSheets(); }
    };
    function openDatePick() {
        dcal = { month: new Date(sel.getFullYear(), sel.getMonth(), 1), picking: false, year: sel.getFullYear() };
        calRender($('#iosCal'), dcal, dateCfg);
        showSheet(dateEl);
    }
    calBind($('#iosCal'), () => dcal, dateCfg);
    $('#dateCancel').addEventListener('click', closeSheets);
    $('#dateToday').addEventListener('click', () => { sel = today; renderToday(); closeSheets(); });

    // copy picker
    const copyCfg = {
        cell(d) {
            const k = key(d), tk = key(today);
            const bad = k < tk || d > calHi(), src = k === key(cp.src);
            return { dis: bad, off: src, cls: (src ? ' src' : '') + (cp.targets.has(k) ? ' on' : '') + (k === tk ? ' td' : '') };
        },
        pick(d) {
            const k = key(d);
            if (k < key(today) || k === key(cp.src) || d > calHi()) return;
            cp.targets.has(k) ? cp.targets.delete(k) : cp.targets.add(k);
            renderCopy();
        }
    };
    calBind($('#cal'), () => cp && cp.cal, copyCfg);

    // ---------- init ----------
    applyAppearance();
    bindPassToggles(document);
    // Запрет приближения жестами (iOS Safari игнорирует user-scalable=no)
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => {
        document.addEventListener(ev, e => e.preventDefault());
    });
    document.addEventListener('touchmove', e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
    document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (settings.theme === 'system') applyAppearance();
        });
    } catch (e) { }
    state = emptyState();
    start();
})();