import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, doc, getDoc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmoqvxsbdLr0zhO1Uz2bULC5KScKqImPI",
  authDomain: "knoll-dashboard-1593f.firebaseapp.com",
  projectId: "knoll-dashboard-1593f",
  storageBucket: "knoll-dashboard-1593f.firebasestorage.app",
  messagingSenderId: "557194331262",
  appId: "1:557194331262:web:90a3b55b9704362518442f",
  measurementId: "G-KEKKLX41J5"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const sharedDocRef = doc(db, "dashboard", "shared");
const legacySharedDocRef = doc(db, "dashboard", "schoolData");
const privateStorageKey = "knoll-private-v2";

const sourceSchedules = {
  6: [['Homeroom', '8:10', '8:13'], ['DEAR', '8:13', '8:23'], ['SOAR / Flex / Clubs', '8:25', '8:55'], ['1st Period · Core', '8:58', '9:53'], ['2nd Period · Core', '9:56', '10:51'], ['3rd / Lunch', '10:53', '11:38'], ['4th Period · Core', '11:41', '12:37'], ['Related Arts', '12:40', '1:36'], ['6th Period · Core', '1:40', '2:21'], ['Related Arts', '2:25', '3:07'], ['Announcements', '3:07', '3:10']],
  7: [['Homeroom', '8:10', '8:13'], ['DEAR', '8:13', '8:23'], ['SOAR / Flex / Clubs', '8:25', '8:55'], ['1st Period · Core', '8:58', '9:54'], ['2nd Period · Core', '9:57', '10:53'], ['3rd Period · Related Arts', '10:58', '11:39'], ['4th / Lunch', '11:40', '12:25'], ['5th / Lunch', '12:27', '1:11'], ['6th Period · Core', '1:14', '2:09'], ['7th Period · Core', '2:12', '3:07'], ['Announcements', '3:07', '3:10']],
  8: [['Homeroom', '8:10', '8:13'], ['DEAR', '8:13', '8:23'], ['SOAR / Flex / Clubs', '8:25', '8:55'], ['1st Period · Related Arts', '9:00', '9:40'], ['2nd Period · Related Arts', '9:44', '10:24'], ['3rd Period · Core', '10:30', '11:26'], ['4th Period · Core', '11:29', '12:25'], ['5th Period · Core', '12:40', '1:36'], ['6th Period · Related Arts', '1:40', '2:21'], ['7th Period · Related Arts', '2:25', '3:07'], ['Announcements', '3:07', '3:10']]
};

const baseSchedules = Object.fromEntries(Object.entries(sourceSchedules).map(([grade, rows]) => [grade, rows.map((row, index) => ({ id: `g${grade}-${index}`, name: row[0], start: row[1], end: row[2] }))]));
const makeLunch = (date, entrees, alternates, sides, fruit) => ({ id: `lunch-${date}`, date, entrees, alternates, sides, fruit, milk: 'Choice of 1% or fat-free chocolate milk' });
const initialLunchMenu = [
  makeLunch('2026-08-12', ['Chicken Tenders', 'Cheese Pizza'], ['Pineapple Parfait'], ['Seasoned Fries', 'Fresh Broccoli'], ['Applesauce', 'Gala Apple']),
  makeLunch('2026-08-13', ['Chicken Alfredo', 'Pizza Dippers'], ['Taco Salad with Chicken'], ['Dinner Roll', 'Cucumber Coins'], ['Banana']),
  makeLunch('2026-08-14', ["General Tso's Chicken", 'Pepperoni Pizza'], ['GF Hummus Lunch Box'], ['Brown Rice Pilaf', 'Baby Carrots', 'Celery Sticks', 'Roasted Cauliflower with Parmesan'], ['Grapes', 'South Carolina Fresh Peach']),
  makeLunch('2026-08-17', ['Chicken Fillet Sandwich', 'Spicy Chicken Fillet Sandwich', 'Pepperoni Pizza'], ['Nacho Bar'], ['Corn', 'Seasoned Fries'], ['Fresh Orange', 'Strawberry Craisins']),
  makeLunch('2026-08-18', ['Corn Dog', 'Pizza Dippers'], ['Baked Potato Bar'], ['Dinner Roll', 'Seasoned Pinto Beans', 'Sweet Potato Waffle Fries'], ['Applesauce', 'Grapefruit']),
  makeLunch('2026-08-19', ['Chicken Drumstick', 'Mac & Cheese', 'Cheese Pizza'], ['Orange Dreamsicle Parfait'], ['California Veggie Blend', 'Green Peas'], ['Grapes', 'Sliced Peaches']),
  makeLunch('2026-08-20', ['Chicken and Waffles', 'Pizza Dippers'], ['Chicken Tender Salad'], ['Cucumber Coins', 'Side Salad'], ['Banana', 'Orange']),
  makeLunch('2026-08-21', ['Mandarin Orange Chicken', 'Pepperoni Pizza'], ['Yogurt Lunchbox'], ['Brown Rice Pilaf', 'Baby Carrots', 'Celery Sticks'], ['Pineapple Juice', 'Strawberries']),
  makeLunch('2026-08-24', ['Buffalo Chicken Dip', 'Pepperoni Pizza'], ['Chicken Tender Wrap'], ['Baby Carrots', 'Roasted Broccoli with Parmesan'], ['Granny Smith Apple', 'Pear Slices']),
  makeLunch('2026-08-25', ['Beefy Taco Bar', 'Pizza Dippers'], ['Baked Potato Bar'], ['Dinner Roll', 'Seasoned Black Beans', 'Corn', 'Shredded Lettuce'], ['Fresh Orange', 'Pineapple Tidbits']),
  makeLunch('2026-08-26', ['French Toast', 'Sausage Link', 'Pepperoni Pizza'], ['Blueberry Parfait'], ['Tater Tots'], ['Baked Apples', 'Banana']),
  makeLunch('2026-08-27', ["General Tso's Chicken", 'Pizza Dippers'], ['Spring Mix Salad with Roasted Chicken'], ['Ramen Noodles', 'Roasted Green Beans', 'Side Salad', 'Grape Tomatoes'], ['Red Apple', 'South Carolina Fresh Peach']),
  makeLunch('2026-08-28', ['Chicken Fillet Sandwich', 'Spicy Chicken Fillet Sandwich', 'Cheese Pizza'], ['Buffalo Chicken Flatbread'], ['Baby Carrots', 'Seasoned Fries'], ['Red Apple', 'Orange Juice', 'Strawberries']),
  makeLunch('2026-08-31', ['Chicken Tenders', 'Pepperoni Pizza'], ['Yogurt Lunchbox'], ['Green Beans', 'Seasoned Fries'], ['Applesauce', 'Grape Juice'])
];

const privateDefaults = { version: 2, grade: 7, notes: '', goals: [], personalEvents: [], focus: 25, rest: 5, theme: 'light', music: { volume: 0.35, wasPlaying: false } };
const sharedDefaults = { schemaVersion: 2, events: [], breaks: [], announcements: [], bellSchedules: structuredClone(baseSchedules), lunchMenu: structuredClone(initialLunchMenu) };
const privateKeys = new Set(['grade', 'notes', 'goals', 'personalEvents', 'focus', 'rest', 'theme', 'music']);
const oldDefaultGoals = new Set(['Bring my reading book home', 'Finish science vocabulary', 'Practice kind words']);

let privateData = loadData();
let sharedData = structuredClone(sharedDefaults);
let timer = null;
let seconds = privateData.focus * 60;
let activeAdminTab = 'events';
let activeAdminGrade = privateData.grade;
let isAdmin = false;
let stopSharedListener = null;
let classroomLoaded = false;
let classroomLoading = false;

const data = new Proxy({}, {
  get: (_, key) => privateKeys.has(key) ? privateData[key] : sharedData[key],
  set: (_, key, value) => { if (privateKeys.has(key)) privateData[key] = value; else sharedData[key] = value; return true; }
});
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

function safeParse(value) { try { return JSON.parse(value); } catch { return null; } }
function normalizeList(value) { return Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : []; }
function normalizeBellSchedules(value) {
  const schedules = {};
  for (const grade of [6, 7, 8]) {
    const rows = value?.[grade] || value?.[String(grade)];
    schedules[grade] = Array.isArray(rows) && rows.length ? rows.map((row, index) => Array.isArray(row) ? ({ id: `g${grade}-${index}`, name: row[0], start: row[1], end: row[2] }) : ({ id: row.id || `g${grade}-${index}`, name: row.name || 'Untitled period', start: row.start || '8:10', end: row.end || '8:13' })) : structuredClone(baseSchedules[grade]);
  }
  return schedules;
}
function normalizeLunchMenu(value) {
  if (!Array.isArray(value)) return structuredClone(initialLunchMenu);
  return value.filter(item => item && /^\d{4}-\d{2}-\d{2}$/.test(item.date)).map(item => ({ id: item.id || `lunch-${item.date}`, date: item.date, entrees: normalizeList(item.entrees), alternates: normalizeList(item.alternates), sides: normalizeList(item.sides), fruit: normalizeList(item.fruit), milk: String(item.milk || 'Choice of milk').trim() || 'Choice of milk' })).sort((first, second) => first.date.localeCompare(second.date));
}
function normalizeShared(value = {}) {
  return {
    schemaVersion: 2,
    events: Array.isArray(value.events) ? value.events.filter(event => event?.kind !== 'Personal event').map(event => ({ id: event.id || uid('event'), title: String(event.title || '').trim(), date: event.date, kind: 'School event' })).filter(event => event.title && /^\d{4}-\d{2}-\d{2}$/.test(event.date)) : [],
    breaks: Array.isArray(value.breaks) ? value.breaks.map(item => ({ id: item.id || uid('break'), title: String(item.title || '').trim(), start: item.start, end: item.end })).filter(item => item.title && /^\d{4}-\d{2}-\d{2}$/.test(item.start) && /^\d{4}-\d{2}-\d{2}$/.test(item.end)) : [],
    announcements: Array.isArray(value.announcements) ? value.announcements.map(item => ({ id: item.id || uid('announcement'), message: String(item.message || '').trim(), createdAt: item.createdAt || todayIso() })).filter(item => item.message) : [],
    bellSchedules: normalizeBellSchedules(value.bellSchedules),
    lunchMenu: normalizeLunchMenu(value.lunchMenu)
  };
}
function loadData() {
  const stored = safeParse(localStorage.getItem(privateStorageKey));
  if (!stored) return structuredClone(privateDefaults);
  return {
    ...structuredClone(privateDefaults),
    grade: [6, 7, 8].includes(Number(stored.grade)) ? Number(stored.grade) : 7,
    notes: typeof stored.notes === 'string' ? stored.notes : '',
    goals: Array.isArray(stored.goals) ? stored.goals.filter(goal => goal && !oldDefaultGoals.has(goal.text)).map(goal => ({ id: goal.id || uid('goal'), text: String(goal.text || '').trim(), done: Boolean(goal.done) })).filter(goal => goal.text) : [],
    personalEvents: Array.isArray(stored.personalEvents) ? stored.personalEvents.map(event => ({ id: event.id || uid('personal-event'), title: String(event.title || '').trim(), date: event.date, kind: 'Personal event' })).filter(event => event.title && /^\d{4}-\d{2}-\d{2}$/.test(event.date)) : [],
    focus: Number.isFinite(Number(stored.focus)) ? Math.min(90, Math.max(1, Number(stored.focus))) : 25,
    rest: Number.isFinite(Number(stored.rest)) ? Math.min(30, Math.max(1, Number(stored.rest))) : 5,
    theme: stored.theme === 'dark' ? 'dark' : 'light',
    music: { volume: Math.min(1, Math.max(0, Number(stored.music?.volume ?? 0.35))), wasPlaying: Boolean(stored.music?.wasPlaying) }
  };
}
function savePersonal() {
  try { localStorage.setItem(privateStorageKey, JSON.stringify(privateData)); } catch { /* Local persistence can fail without affecting shared data. */ }
}
function sharedPayload() {
  return { schemaVersion: 2, events: sharedData.events, breaks: sharedData.breaks, announcements: sharedData.announcements, bellSchedules: sharedData.bellSchedules, lunchMenu: sharedData.lunchMenu };
}
async function saveSharedData() {
  if (!isAdmin) return false;
  try { await setDoc(sharedDocRef, sharedPayload()); return true; } catch { return false; }
}
async function commitShared(change) {
  const before = structuredClone(sharedData);
  change();
  if (await saveSharedData()) { renderAll(); return true; }
  sharedData = before;
  renderAll();
  alert('The school-wide change could not be published. Please verify your admin access and try again.');
  return false;
}
async function loadSharedData() {
  try {
    const snapshot = await getDoc(sharedDocRef);
    if (snapshot.exists()) { sharedData = normalizeShared(snapshot.data()); return; }
    const legacySnapshot = await getDoc(legacySharedDocRef);
    if (legacySnapshot.exists()) sharedData = normalizeShared(legacySnapshot.data());
  } catch { /* Keep local defaults so the dashboard remains usable offline. */ }
}
function startSharedDataListener() {
  stopSharedListener?.();
  stopSharedListener = onSnapshot(sharedDocRef, snapshot => {
    if (!snapshot.exists()) return;
    sharedData = normalizeShared(snapshot.data());
    renderAll();
  }, () => { /* The last known school data remains on screen. */ });
}

function toMin(time) { let [hour, minute] = time.split(':').map(Number); if (hour < 7) hour += 12; return hour * 60 + minute; }
function displayTime(time) { const [hour, minute] = time.split(':'); const numeric = Number(hour); return `${numeric > 12 ? numeric - 12 : numeric}:${minute} ${numeric >= 12 ? 'PM' : 'AM'}`; }
function scheduleFor(grade = data.grade) { return data.bellSchedules[grade] || []; }
function getPeriod() { const now = new Date(), minutes = now.getHours() * 60 + now.getMinutes(), list = scheduleFor(); const current = list.find(period => minutes >= toMin(period.start) && minutes < toMin(period.end)); const next = list.find(period => minutes < toMin(period.start)); return { current, next, minutes, list }; }
function todayIso() { const date = new Date(); const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 10); }
function dateLabel(date) { const value = new Date(`${date}T12:00:00`); return { day: value.getDate(), mon: value.toLocaleDateString([], { month: 'short' }).toUpperCase() }; }
function formatDate(date) { return new Date(`${date}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); }

function renderSchedule() {
  const { current, next, list, minutes } = getPeriod();
  $('#gradeChip').textContent = `${data.grade}th grade`;
  $('#scheduleList').innerHTML = list.slice(0, 8).map(period => `<div class="schedule-row ${current?.id === period.id ? 'current' : ''}"><span class="time">${displayTime(period.start).replace(/ (AM|PM)/, '')}</span><i class="bullet"></i><span>${escapeHtml(period.name)}</span><span class="duration">${toMin(period.end) - toMin(period.start)}m</span></div>`).join('');
  $('#fullSchedule').innerHTML = list.map(period => `<div class="full-row ${current?.id === period.id ? 'current' : ''}"><span class="full-time">${displayTime(period.start)}<br>– ${displayTime(period.end)}</span><div><h4>${escapeHtml(period.name)}</h4><p>${toMin(period.end) - toMin(period.start)} minutes</p></div><span>${current?.id === period.id ? 'NOW' : ''}</span></div>`).join('');
  $$('.grade-tabs button').forEach(button => button.classList.toggle('selected', Number(button.dataset.scheduleGrade) === data.grade));
  $('#periodProgress').style.width = `${current ? Math.round((minutes - toMin(current.start)) / (toMin(current.end) - toMin(current.start)) * 100) : 0}%`;
  if (current) {
    $('#currentClass').textContent = current.name;
    $('#currentTimeRange').textContent = `${displayTime(current.start)} – ${displayTime(current.end)}`;
    $('#nowStatus').textContent = 'You’re in class';
    $('#countdown').textContent = `${toMin(current.end) - minutes} min remaining`;
  } else {
    const isAfterSchool = minutes >= toMin(list.at(-1)?.end || '3:10');
    $('#currentClass').textContent = isAfterSchool ? 'School day complete' : 'School day hasn’t started';
    $('#currentTimeRange').textContent = isAfterSchool ? 'Nice work today — see you tomorrow.' : 'Your first class begins at 8:10 AM';
    $('#nowStatus').textContent = isAfterSchool ? 'Time to recharge' : `Up next: ${next?.name || 'Homeroom'}`;
    $('#countdown').textContent = isAfterSchool ? '' : `in ${toMin(next?.start || '8:10') - minutes} min`;
  }
  const upcoming = next || (current ? list[list.indexOf(current) + 1] : list[0]);
  $('#nextClass').textContent = upcoming?.name || 'See you tomorrow';
  $('#nextClassTime').textContent = upcoming ? `${displayTime(upcoming.start)} – ${displayTime(upcoming.end)}` : 'School starts at 8:10 AM';
}
function updateClock() { const now = new Date(); $('#clock').innerHTML = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/ (AM|PM)/, '<span>$1</span>'); $('#dateLine').textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase(); renderSchedule(); }

function renderGoals() {
  $('#goalsList').innerHTML = data.goals.length ? data.goals.map(goal => `<div class="goal ${goal.done ? 'done' : ''}"><input class="check" type="checkbox" data-goal-complete="${goal.id}" ${goal.done ? 'checked' : ''} aria-label="Complete ${escapeHtml(goal.text)}"><span>${escapeHtml(goal.text)}</span><div class="goal-actions"><button class="tiny-action" data-goal-edit="${goal.id}" aria-label="Edit goal">${icon('edit')}</button><button class="tiny-action delete" data-goal-delete="${goal.id}" aria-label="Delete goal">${icon('trash')}</button></div></div>`).join('') : '<p class="empty">No goals yet. Add a small win.</p>';
  $$('[data-goal-complete]').forEach(input => input.onchange = () => { const goal = data.goals.find(item => item.id === input.dataset.goalComplete); if (!goal) return; goal.done = input.checked; savePersonal(); renderGoals(); });
  $$('[data-goal-edit]').forEach(button => button.onclick = () => goalModal(data.goals.find(goal => goal.id === button.dataset.goalEdit)));
  $$('[data-goal-delete]').forEach(button => button.onclick = () => { data.goals = data.goals.filter(goal => goal.id !== button.dataset.goalDelete); savePersonal(); renderGoals(); });
}
function renderEvents() {
  const events = [...data.events].sort((first, second) => first.date.localeCompare(second.date));
  const make = event => { const date = dateLabel(event.date); return `<div class="event"><div class="event-date">${date.mon}<b>${date.day}</b></div><div><h4>${escapeHtml(event.title)}</h4><p>${escapeHtml(event.kind || 'School event')}</p></div></div>`; };
  $('#eventList').innerHTML = events.slice(0, 3).map(make).join('') || '<p class="empty">No upcoming school events.</p>';
  $('#agendaList').innerHTML = [...events, ...data.personalEvents].sort((first, second) => first.date.localeCompare(second.date)).map(make).join('') || '<p class="empty">No upcoming events.</p>';
}
function renderBreak() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const breakItem = [...data.breaks].sort((first, second) => first.start.localeCompare(second.start)).find(item => new Date(`${item.end}T23:59:59`) >= today);
  if (!breakItem) { $('#breakTitle').textContent = 'No break scheduled'; $('#breakDays').textContent = '—'; $('#breakDaysText').innerHTML = 'set a break<br>in admin'; $('#breakDate').textContent = 'Your next school break will appear here.'; return; }
  const start = new Date(`${breakItem.start}T12:00:00`), end = new Date(`${breakItem.end}T12:00:00`);
  $('#breakTitle').textContent = breakItem.title;
  $('#breakDays').textContent = Math.max(0, Math.ceil((start - today) / 86400000));
  $('#breakDaysText').innerHTML = 'days<br>away';
  $('#breakDate').textContent = `${start.toLocaleDateString([], { month: 'long', day: 'numeric' })} – ${end.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}`;
}
function renderAnnouncements() { const latest = data.announcements.at(-1); $('#announcementBanner').classList.toggle('hidden', !latest); $('#announcementText').textContent = latest?.message || ''; }
function renderCalendar() {
  const now = new Date(), year = now.getFullYear(), month = now.getMonth();
  $('#monthName').textContent = new Date(year, month).toLocaleDateString([], { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay(), totalDays = new Date(year, month + 1, 0).getDate(); let grid = '';
  const calendarEvents = [...data.events, ...data.personalEvents];
  for (let index = 0; index < firstDay; index++) grid += '<div></div>';
  for (let day = 1; day <= totalDays; day++) { const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const isBreak = data.breaks.some(item => iso >= item.start && iso <= item.end); const hasEvent = calendarEvents.some(event => event.date === iso); grid += `<div class="day ${day === now.getDate() ? 'today' : ''} ${hasEvent || isBreak ? 'event-day' : ''}">${day}</div>`; }
  $('#monthGrid').innerHTML = grid;
}

function lunchRow(label, values) { return values?.length ? `<div class="lunch-row"><span>${label}</span><p>${values.map(escapeHtml).join(' · ')}</p></div>` : ''; }
function renderLunchMenu() {
  const menus = [...data.lunchMenu].sort((first, second) => first.date.localeCompare(second.date));
  const today = todayIso();
  const current = menus.find(item => item.date === today);
  const upcoming = menus.filter(item => item.date > today).slice(0, 3);
  const todayMarkup = current ? `<p class="lunch-date">${new Date(`${current.date}T12:00:00`).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>${lunchRow('Entrees', current.entrees)}${lunchRow('Alternates', current.alternates)}${lunchRow('Sides', current.sides)}${lunchRow('Fruit', current.fruit)}<div class="lunch-row"><span>Milk</span><p>${escapeHtml(current.milk)}</p></div>` : '<p class="empty">No lunch menu is scheduled for today.</p>';
  $('#lunchToday').innerHTML = todayMarkup;
  $('#lunchUpcoming').innerHTML = upcoming.length ? upcoming.map(item => `<div class="lunch-upcoming"><strong>${formatDate(item.date)}</strong><span>${escapeHtml(item.entrees.join(' · ') || item.alternates.join(' · ') || 'Menu coming soon')}</span></div>`).join('') : '';
}

function renderTimer() { $('#timerDisplay').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; $('#timerMode').textContent = seconds > data.rest * 60 ? 'FOCUS' : 'BREAK'; }
function renderMusic() {
  const audio = $('#studyMusic');
  if (!audio) return;
  $('#musicVolume').value = String(Math.round(data.music.volume * 100));
  audio.volume = data.music.volume;
  const update = () => { $('#musicProgress').max = Number.isFinite(audio.duration) ? String(audio.duration) : '0'; $('#musicProgress').value = Number.isFinite(audio.currentTime) ? String(audio.currentTime) : '0'; $('#musicTime').textContent = `${formatDuration(audio.currentTime)} / ${formatDuration(audio.duration)}`; $('#musicToggle').innerHTML = icon(audio.paused ? 'play' : 'pause'); $('#musicToggle').setAttribute('aria-label', audio.paused ? 'Play study music' : 'Pause study music'); };
  update();
}
function formatDuration(value) { if (!Number.isFinite(value)) return '0:00'; const minutes = Math.floor(value / 60); return `${minutes}:${String(Math.floor(value % 60)).padStart(2, '0')}`; }
function formatClassroomDue(item) {
  if (!item?.dueDate) return 'No due date';
  const date = new Date(Date.UTC(item.dueDate.year, item.dueDate.month - 1, item.dueDate.day));
  let label = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  if (item.dueTime?.hours != null) {
    const hours = Number(item.dueTime.hours || 0);
    const minutes = Number(item.dueTime.minutes || 0);
    const due = new Date(date);
    due.setUTCHours(hours, minutes, Number(item.dueTime.seconds || 0), 0);
    label += ` · ${due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })}`;
  }
  return label;
}
function renderClassroom(dataResponse) {
  const status = $('#classroomStatus');
  const content = $('#classroomContent');
  const signOut = $('#classroomSignOut');
  if (!status || !content) return;
  if (!dataResponse?.connected) {
    content.classList.add('hidden');
    status.classList.remove('hidden');
    signOut?.classList.add('hidden');
    if (dataResponse?.needsReconnect) {
      status.innerHTML = `<div class="classroom-empty"><div class="classroom-logo-large">G</div><h3>Reconnect Google Classroom</h3><p>Your Google Classroom connection needs to be renewed.</p><a class="primary-button classroom-connect" href="/auth/google">Reconnect Google</a></div>`;
    } else if (dataResponse?.error) {
      status.innerHTML = `<div class="classroom-empty"><div class="classroom-logo-large">!</div><h3>Classroom isn't ready yet</h3><p>${escapeHtml(dataResponse.error)}</p><a class="primary-button classroom-connect" href="/auth/google">Try Google sign-in</a></div>`;
    }
    return;
  }
  status.classList.add('hidden');
  content.classList.remove('hidden');
  signOut?.classList.remove('hidden');
  const user = dataResponse.user || {};
  $('#classroomCourses').innerHTML = dataResponse.courses?.length
    ? dataResponse.courses.map(course => `<div class="classroom-course"><div class="classroom-course-icon">${escapeHtml((course.name || 'C').trim().charAt(0).toUpperCase())}</div><div><strong>${escapeHtml(course.name)}</strong><span>${escapeHtml(course.section || 'Google Classroom')}</span></div></div>`).join('')
    : '<p class="empty">No active Google Classroom courses were found.</p>';
  $('#classroomAssignments').innerHTML = dataResponse.assignments?.length
    ? dataResponse.assignments.map(item => `<a class="classroom-assignment" href="${escapeHtml(item.alternateLink || '#')}" target="_blank" rel="noopener noreferrer"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.courseName)}</span></div><time>${escapeHtml(formatClassroomDue(item))}</time></a>`).join('')
    : '<p class="empty">No upcoming assignments were found.</p>';
  const welcome = user.name ? `Connected as ${user.name}` : 'Connected to Google Classroom';
  const heading = $('#classroomContent .card-heading h3');
  if (heading) heading.title = welcome;
}
async function loadClassroom(force = false) {
  if (classroomLoading || (classroomLoaded && !force)) return;
  classroomLoading = true;
  const status = $('#classroomStatus');
  if (status && !classroomLoaded) status.innerHTML = '<div class="classroom-empty"><div class="classroom-spinner"></div><h3>Loading Google Classroom…</h3><p>Checking your connected account and assignments.</p></div>';
  try {
    const response = await fetch('/api/classroom', { credentials: 'same-origin', cache: 'no-store' });
    const payload = await response.json();
    renderClassroom(payload);
    classroomLoaded = true;
  } catch (error) {
    renderClassroom({ connected: false, error: 'We could not reach Google Classroom right now. Please try again.' });
  } finally {
    classroomLoading = false;
  }
}
function renderAll() { renderGoals(); renderEvents(); renderBreak(); renderAnnouncements(); renderCalendar(); renderSchedule(); renderLunchMenu(); renderTimer(); renderMusic(); renderAdmin(); }

function renderAdmin() {
  if (!isAdmin) { $('#adminWorkspace').innerHTML = '<p class="empty admin-empty">Sign in with an authorized administrator account to manage school-wide information.</p>'; return; }
  $('#adminEventCount').textContent = data.events.length;
  $('#adminBreakCount').textContent = data.breaks.length;
  $('#adminBellCount').textContent = scheduleFor(activeAdminGrade).length;
  $('#adminAnnouncementCount').textContent = data.announcements.length;
  $$('.admin-tabs button').forEach(button => button.classList.toggle('active', button.dataset.adminTab === activeAdminTab));
  const workspace = $('#adminWorkspace');
  if (activeAdminTab === 'events') workspace.innerHTML = adminHeading('School calendar', 'Add, update, or remove school events.', 'Add event') + adminList([...data.events].sort((first, second) => first.date.localeCompare(second.date)), event => `<strong>${escapeHtml(event.title)}</strong><span>${formatDate(event.date)}</span>`, 'event');
  else if (activeAdminTab === 'bells') workspace.innerHTML = `<div class="admin-section-head"><div><h3>Bell schedules</h3><p>Changes update student schedules immediately.</p></div><button class="primary-button compact" id="adminAddBell">${icon('plus')} Add period</button></div><div class="admin-grade-tabs">${[6, 7, 8].map(grade => `<button class="${grade === activeAdminGrade ? 'active' : ''}" data-admin-grade="${grade}">${grade}th grade</button>`).join('')}</div>${adminList(scheduleFor(activeAdminGrade), period => `<strong>${escapeHtml(period.name)}</strong><span>${displayTime(period.start)} – ${displayTime(period.end)}</span>`, 'bell')}`;
  else if (activeAdminTab === 'breaks') workspace.innerHTML = adminHeading('Break dates', 'Manage school breaks shown in the student dashboard.', 'Add break') + adminList([...data.breaks].sort((first, second) => first.start.localeCompare(second.start)), item => `<strong>${escapeHtml(item.title)}</strong><span>${formatDate(item.start)} – ${formatDate(item.end)}</span>`, 'break');
  else if (activeAdminTab === 'lunch') workspace.innerHTML = adminHeading('Lunch menu', 'Add or edit a school lunch for each date. Changes publish to every student dashboard.', 'Add lunch') + adminList([...data.lunchMenu].sort((first, second) => first.date.localeCompare(second.date)), item => `<strong>${formatDate(item.date)}</strong><span>${escapeHtml(item.entrees.join(' · ') || item.alternates.join(' · ') || 'Menu coming soon')}</span>`, 'lunch');
  else workspace.innerHTML = adminHeading('Announcements', 'The newest announcement appears at the top of the student dashboard.', 'Add announcement') + adminList(data.announcements, item => `<strong>${escapeHtml(item.message)}</strong><span>${item.createdAt ? formatDate(item.createdAt) : 'Published'}</span>`, 'announcement');
  wireAdminWorkspace();
}
function adminHeading(title, description, action) { return `<div class="admin-section-head"><div><h3>${title}</h3><p>${description}</p></div><button class="primary-button compact" id="adminAdd">${icon('plus')} ${action}</button></div>`; }
function adminList(items, content, type) { return items.length ? `<div class="admin-list">${items.map(item => `<div class="admin-row"><div>${content(item)}</div><div class="row-actions"><button class="tiny-action" data-admin-edit="${type}:${item.id}" aria-label="Edit">${icon('edit')}</button><button class="tiny-action delete" data-admin-delete="${type}:${item.id}" aria-label="Delete">${icon('trash')}</button></div></div>`).join('')}</div>` : '<p class="empty admin-empty">Nothing here yet.</p>'; }
function wireAdminWorkspace() {
  $('#adminAdd')?.addEventListener('click', () => ({ events: () => eventModal(), breaks: () => breakModal(), announcements: () => announcementModal(), lunch: () => lunchModal() }[activeAdminTab]()));
  $('#adminAddBell')?.addEventListener('click', () => bellModal());
  $$('[data-admin-grade]').forEach(button => button.onclick = () => { activeAdminGrade = Number(button.dataset.adminGrade); renderAdmin(); });
  $$('[data-admin-edit]').forEach(button => button.onclick = () => { const [type, id] = button.dataset.adminEdit.split(':'); const item = findAdminItem(type, id); ({ event: eventModal, bell: bellModal, break: breakModal, announcement: announcementModal, lunch: lunchModal }[type])(item); });
  $$('[data-admin-delete]').forEach(button => button.onclick = async () => { const [type, id] = button.dataset.adminDelete.split(':'); await commitShared(() => { if (type === 'event') data.events = data.events.filter(item => item.id !== id); if (type === 'bell') data.bellSchedules[activeAdminGrade] = scheduleFor(activeAdminGrade).filter(item => item.id !== id); if (type === 'break') data.breaks = data.breaks.filter(item => item.id !== id); if (type === 'announcement') data.announcements = data.announcements.filter(item => item.id !== id); if (type === 'lunch') data.lunchMenu = data.lunchMenu.filter(item => item.id !== id); }); });
}
function findAdminItem(type, id) { if (type === 'event') return data.events.find(item => item.id === id); if (type === 'bell') return scheduleFor(activeAdminGrade).find(item => item.id === id); if (type === 'break') return data.breaks.find(item => item.id === id); if (type === 'lunch') return data.lunchMenu.find(item => item.id === id); return data.announcements.find(item => item.id === id); }

function openModal(content) { $('#modalContent').innerHTML = content; $('#modal').classList.remove('hidden'); }
function closeModal() { $('#modal').classList.add('hidden'); }
function goalModal(goal = null) {
  openModal(`<h3>${goal ? 'Edit' : 'Add'} goal</h3><label>Goal</label><input id="goalText" value="${escapeHtml(goal?.text)}" placeholder="e.g., Finish science vocabulary"><button class="primary-button" id="saveGoal">${goal ? 'Save goal' : 'Add goal'}</button>`);
  $('#saveGoal').onclick = () => { const text = $('#goalText').value.trim(); if (!text) return; if (goal) goal.text = text; else data.goals.push({ id: uid('goal'), text, done: false }); savePersonal(); renderGoals(); closeModal(); };
}
function eventModal(event = null, isPersonal = false) {
  openModal(`<h3>${event ? 'Edit' : 'Add'} ${isPersonal ? 'personal' : 'school'} event</h3><label>Event name</label><input id="eventTitle" value="${escapeHtml(event?.title)}" placeholder="e.g., Curriculum Night"><label>Date</label><input id="eventDate" type="date" value="${event?.date || ''}"><button class="primary-button" id="saveEvent">${event ? 'Save event' : 'Add to calendar'}</button>`);
  $('#saveEvent').onclick = async () => { const title = $('#eventTitle').value.trim(), date = $('#eventDate').value; if (!title || !date) return; if (isPersonal) { if (event) Object.assign(event, { title, date }); else data.personalEvents.push({ id: uid('personal-event'), title, date, kind: 'Personal event' }); savePersonal(); renderEvents(); renderCalendar(); closeModal(); return; } const saved = await commitShared(() => { if (event) Object.assign(event, { title, date }); else data.events.push({ id: uid('event'), title, date, kind: 'School event' }); }); if (saved) closeModal(); };
}
function breakModal(item = null) {
  openModal(`<h3>${item ? 'Edit' : 'Add'} break</h3><label>Break name</label><input id="breakTitleInput" value="${escapeHtml(item?.title)}" placeholder="e.g., Winter break"><label>First day</label><input id="breakStart" type="date" value="${item?.start || ''}"><label>Last day</label><input id="breakEnd" type="date" value="${item?.end || ''}"><button class="primary-button" id="saveBreak">${item ? 'Save break' : 'Add break'}</button>`);
  $('#saveBreak').onclick = async () => { const title = $('#breakTitleInput').value.trim(), start = $('#breakStart').value, end = $('#breakEnd').value; if (!title || !start || !end || end < start) return; const saved = await commitShared(() => { if (item) Object.assign(item, { title, start, end }); else data.breaks.push({ id: uid('break'), title, start, end }); }); if (saved) closeModal(); };
}
function bellModal(period = null) {
  openModal(`<h3>${period ? 'Edit' : 'Add'} bell period</h3><label>Period name</label><input id="bellName" value="${escapeHtml(period?.name)}" placeholder="e.g., 1st Period · Core"><div class="modal-two"><label>Starts<input id="bellStart" type="time" value="${period?.start || ''}"></label><label>Ends<input id="bellEnd" type="time" value="${period?.end || ''}"></label></div><button class="primary-button" id="saveBell">${period ? 'Save period' : 'Add period'}</button>`);
  $('#saveBell').onclick = async () => { const name = $('#bellName').value.trim(), start = $('#bellStart').value, end = $('#bellEnd').value; if (!name || !start || !end || toMin(end) <= toMin(start)) return; const saved = await commitShared(() => { if (period) Object.assign(period, { name, start, end }); else data.bellSchedules[activeAdminGrade].push({ id: uid('bell'), name, start, end }); data.bellSchedules[activeAdminGrade].sort((first, second) => toMin(first.start) - toMin(second.start)); }); if (saved) closeModal(); };
}
function announcementModal(item = null) {
  openModal(`<h3>${item ? 'Edit' : 'Add'} announcement</h3><label>Student message</label><textarea id="announcementInput" placeholder="e.g., Spirit week starts Monday!">${escapeHtml(item?.message)}</textarea><button class="primary-button" id="saveAnnouncement">${item ? 'Save announcement' : 'Publish announcement'}</button>`);
  $('#saveAnnouncement').onclick = async () => { const message = $('#announcementInput').value.trim(); if (!message) return; const saved = await commitShared(() => { if (item) item.message = message; else data.announcements.push({ id: uid('announcement'), message, createdAt: todayIso() }); }); if (saved) closeModal(); };
}
function listFromTextarea(selector) { return $(selector).value.split('\n').map(value => value.trim()).filter(Boolean); }
function lunchModal(item = null) {
  openModal(`<h3>${item ? 'Edit' : 'Add'} lunch</h3><p class="modal-help">Use one item per line. These fields are school-wide.</p><label>Date</label><input id="lunchDate" type="date" value="${item?.date || ''}"><label>Main entrees</label><textarea id="lunchEntrees" placeholder="Chicken tenders\nPepperoni pizza">${escapeHtml(item?.entrees?.join('\n'))}</textarea><label>Alternate entrees</label><textarea id="lunchAlternates" placeholder="Yogurt lunchbox">${escapeHtml(item?.alternates?.join('\n'))}</textarea><label>Sides</label><textarea id="lunchSides" placeholder="Green beans\nSeasoned fries">${escapeHtml(item?.sides?.join('\n'))}</textarea><label>Fruit</label><textarea id="lunchFruit" placeholder="Apple slices">${escapeHtml(item?.fruit?.join('\n'))}</textarea><label>Milk</label><input id="lunchMilk" value="${escapeHtml(item?.milk || 'Choice of 1% or fat-free chocolate milk')}"><button class="primary-button" id="saveLunch">${item ? 'Save lunch' : 'Add lunch'}</button>`);
  $('#saveLunch').onclick = async () => { const date = $('#lunchDate').value, entrees = listFromTextarea('#lunchEntrees'), alternates = listFromTextarea('#lunchAlternates'), sides = listFromTextarea('#lunchSides'), fruit = listFromTextarea('#lunchFruit'), milk = $('#lunchMilk').value.trim(); if (!date || (!entrees.length && !alternates.length)) return; const saved = await commitShared(() => { const record = { id: item?.id || `lunch-${date}`, date, entrees, alternates, sides, fruit, milk: milk || 'Choice of milk' }; if (item) Object.assign(item, record); else { data.lunchMenu = data.lunchMenu.filter(menu => menu.date !== date); data.lunchMenu.push(record); } data.lunchMenu.sort((first, second) => first.date.localeCompare(second.date)); }); if (saved) closeModal(); };
}

function applyTheme() { document.body.classList.toggle('dark', data.theme === 'dark'); }
function showView(view) { if (view === 'admin' && !isAdmin) { showAdminLogin(); return; } $$('.nav-item[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view)); $$('.view').forEach(section => section.classList.toggle('active-view', section.id === view)); $('.sidebar').classList.remove('open'); if (view === 'classroom') loadClassroom(); }
async function refreshAdminState(user = auth.currentUser) {
  isAdmin = false;
  if (!user) return;
  try { isAdmin = (await getDoc(doc(db, 'admins', user.uid))).exists(); } catch { isAdmin = false; }
}
function showAdminLogin() {
  if (isAdmin) { showView('admin'); return; }
  openModal(`<h3>Admin sign in</h3><p>Use an authorized school administrator account to manage school-wide information.</p><label>Email</label><input id="adminEmail" type="email" autocomplete="username" placeholder="name@school.org"><label>Password</label><input id="adminPassword" type="password" autocomplete="current-password" placeholder="Password"><p class="form-error hidden" id="adminAuthError"></p><button class="primary-button" id="adminLogin">Sign in</button>`);
  $('#adminLogin').onclick = async () => { const email = $('#adminEmail').value.trim(), password = $('#adminPassword').value; if (!email || !password) return; try { const credential = await signInWithEmailAndPassword(auth, email, password); await refreshAdminState(credential.user); if (!isAdmin) { await signOut(auth); throw new Error('not-authorized'); } closeModal(); showView('admin'); renderAdmin(); } catch { const error = $('#adminAuthError'); error.textContent = 'This account is not authorized to manage school data.'; error.classList.remove('hidden'); } };
}

function initMusicPlayer() {
  const audio = $('#studyMusic');
  const widget = $('#musicWidget');
  if (!audio || !widget) return;
  audio.loop = true;
  audio.volume = data.music.volume;
  const hide = () => widget.classList.add('hidden');
  audio.addEventListener('error', hide);
  audio.addEventListener('loadedmetadata', renderMusic);
  audio.addEventListener('timeupdate', renderMusic);
  audio.addEventListener('play', () => { data.music.wasPlaying = true; savePersonal(); renderMusic(); });
  audio.addEventListener('pause', () => { data.music.wasPlaying = false; savePersonal(); renderMusic(); });
  $('#musicToggle').onclick = async () => { try { if (audio.paused) await audio.play(); else audio.pause(); } catch { hide(); } };
  $('#musicVolume').oninput = event => { data.music.volume = Number(event.target.value) / 100; audio.volume = data.music.volume; savePersonal(); };
  $('#musicProgress').oninput = event => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(event.target.value); };
  renderMusic();
}

async function init() {
  if (localStorage.getItem('knoll-profile')) { $('#welcome').classList.add('hidden'); $('#app').classList.remove('hidden'); }
  applyTheme();
  $('#notesArea').value = data.notes;
  $('#focusMinutes').value = data.focus;
  $('#breakMinutes').value = data.rest;
  await loadSharedData();
  renderAll();
  updateClock();
  setInterval(updateClock, 30000);
  initMusicPlayer();
  startSharedDataListener();
  onAuthStateChanged(auth, async user => { await refreshAdminState(user); renderAdmin(); });

  $$('.grade-card').forEach(button => button.onclick = () => { data.grade = Number(button.dataset.grade); activeAdminGrade = data.grade; savePersonal(); localStorage.setItem('knoll-profile', 'grade-selected'); $('#welcome').classList.add('hidden'); $('#app').classList.remove('hidden'); renderAll(); });
  $$('.nav-item[data-view]').forEach(button => button.onclick = () => showView(button.dataset.view));
  $('#classroomRefresh').onclick = () => loadClassroom(true);
  if (location.hash === '#classroom') showView('classroom');
  $$('[data-go]').forEach(button => button.onclick = () => showView(button.dataset.go));
  $$('.grade-tabs button').forEach(button => button.onclick = () => { data.grade = Number(button.dataset.scheduleGrade); savePersonal(); renderAll(); });
  $('#gradeChip').onclick = () => showView('schedule');
  $('#addGoal').onclick = () => goalModal();
  $('#addEvent').onclick = () => eventModal(null, true);
  $('#adminOpen').onclick = showAdminLogin;
  $('#adminLock').onclick = async () => { await signOut(auth); showView('dashboard'); };
  $$('.admin-tabs button').forEach(button => button.onclick = () => { activeAdminTab = button.dataset.adminTab; renderAdmin(); });
  $('#modalClose').onclick = closeModal;
  $('#modal').onclick = event => { if (event.target === $('#modal')) closeModal(); };
  $('#notesArea').oninput = () => { data.notes = $('#notesArea').value; savePersonal(); $('#saveStatus').textContent = 'Saved just now'; };
  const toggleTheme = () => { data.theme = data.theme === 'dark' ? 'light' : 'dark'; applyTheme(); savePersonal(); };
  $('#themeToggle').onclick = toggleTheme;
  $('#quickTheme').onclick = toggleTheme;
  $('#mobileMenu').onclick = () => $('.sidebar').classList.toggle('open');
  $('#focusMinutes').onchange = () => { data.focus = Number($('#focusMinutes').value); savePersonal(); };
  $('#breakMinutes').onchange = () => { data.rest = Number($('#breakMinutes').value); savePersonal(); };
  $('#timerStart').onclick = () => { if (timer) { clearInterval(timer); timer = null; $('#timerStart').textContent = 'Start focus'; } else { timer = setInterval(() => { if (seconds > 0) { seconds--; renderTimer(); } else { clearInterval(timer); timer = null; seconds = data.rest * 60; renderTimer(); $('#timerStart').textContent = 'Start break'; } }, 1000); $('#timerStart').textContent = 'Pause'; } };
  $('#timerReset').onclick = () => { clearInterval(timer); timer = null; data.focus = Number($('#focusMinutes').value); data.rest = Number($('#breakMinutes').value); seconds = data.focus * 60; savePersonal(); $('#timerStart').textContent = 'Start focus'; renderTimer(); };
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
}

init();
