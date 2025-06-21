// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Folders
  fetchFolders:   ()              => ipcRenderer.invoke('db-fetch-folders'),
  createFolder:   (name, pid)     => ipcRenderer.invoke('db-create-folder', name, pid),

  // Decks
  fetchDecks:     folderId        => ipcRenderer.invoke('db-fetch-decks', folderId),
  createDeck:     (name, fid)     => ipcRenderer.invoke('db-create-deck', name, fid),
  openDeckWindow: deckId          => ipcRenderer.invoke('open-deck-window', deckId),

  // Cards
  fetchCards:     deckId          => ipcRenderer.invoke('db-fetch-cards', deckId),
  createCard:     (front, back, deckId) =>
    ipcRenderer.invoke('db-create-card', front, back, deckId)
});
