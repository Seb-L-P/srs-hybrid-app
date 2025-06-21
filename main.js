const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

// --- Initialize SQLite in the user data folder ---
const dbPath = path.join(app.getPath('userData'), 'decks.db');
const db = new Database(dbPath);

// --- Create schema if it doesn’t exist ---
db.exec(`
  CREATE TABLE IF NOT EXISTS folders (
    id          INTEGER PRIMARY KEY,
    parent_id   INTEGER,
    name        TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS decks (
    id          INTEGER PRIMARY KEY,
    folder_id   INTEGER NOT NULL,
    name        TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS cards (
    id          INTEGER PRIMARY KEY,
    deck_id     INTEGER NOT NULL,
    front_text  TEXT,
    back_text   TEXT,
    media_json  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id           INTEGER PRIMARY KEY,
    card_id      INTEGER NOT NULL,
    review_date  DATETIME NOT NULL,
    quality      INTEGER NOT NULL,
    interval     REAL NOT NULL,
    ease_factor  REAL NOT NULL,
    is_lapse     BOOLEAN DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS settings (
    id             INTEGER PRIMARY KEY,
    scope          TEXT NOT NULL,
    initial_ease   REAL NOT NULL DEFAULT 2.5,
    min_ease       REAL NOT NULL DEFAULT 1.3,
    max_ease       REAL NOT NULL DEFAULT 2.5,
    ease_step      REAL NOT NULL DEFAULT 0.2,
    box_thresholds TEXT NOT NULL     DEFAULT '[1.2,1.5,1.8,2.2,2.5]'
  );
`);

// --- IPC handlers ---

// Folders
ipcMain.handle('db-fetch-folders', () => {
  return db.prepare('SELECT * FROM folders').all();
});
ipcMain.handle('db-create-folder', (event, name, parentId = null) => {
  const stmt = db.prepare('INSERT INTO folders (name, parent_id) VALUES (?, ?)');
  const info = stmt.run(name, parentId);
  return { id: info.lastInsertRowid, name, parent_id: parentId, created_at: new Date().toISOString() };
});

// Decks
ipcMain.handle('db-fetch-decks', (event, folderId) => {
  return db.prepare('SELECT * FROM decks WHERE folder_id = ?').all(folderId);
});
ipcMain.handle('db-create-deck', (event, name, folderId) => {
  const stmt = db.prepare('INSERT INTO decks (name, folder_id) VALUES (?, ?)');
  const info = stmt.run(name, folderId);
  return { id: info.lastInsertRowid, name, folder_id: folderId, created_at: new Date().toISOString() };
});

// Cards
ipcMain.handle('db-fetch-cards', (event, deckId) => {
  return db.prepare('SELECT * FROM cards WHERE deck_id = ?').all(deckId);
});
ipcMain.handle('db-create-card', (event, frontText, backText, deckId) => {
  const stmt = db.prepare(
    'INSERT INTO cards (front_text, back_text, deck_id) VALUES (?, ?, ?)'
  );
  const info = stmt.run(frontText, backText, deckId);
  return {
    id: info.lastInsertRowid,
    front_text: frontText,
    back_text: backText,
    deck_id: deckId,
    media_json: '[]',
    created_at: new Date().toISOString(),
  };
});

// Open a deck in its own window
ipcMain.handle('open-deck-window', (event, deckId) => {
  const deckWin = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '/app-ui/dist/index.html')}`;

  deckWin.loadURL(`${baseUrl}#/deck/${deckId}`);
});

// --- Create the main Electron window ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const startUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '/app-ui/dist/index.html')}`;

  win.loadURL(startUrl);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
