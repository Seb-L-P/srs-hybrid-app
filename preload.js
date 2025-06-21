// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Folder APIs
  fetchFolders: ()          => ipcRenderer.invoke('db-fetch-folders'),
  createFolder: (name, pid) => ipcRenderer.invoke('db-create-folder', name, pid),

  // Deck APIs
  fetchDecks:   folderId    => ipcRenderer.invoke('db-fetch-decks', folderId),
  createDeck:   (name, fid) => ipcRenderer.invoke('db-create-deck', name, fid),
  
  openDeckWindow: deckId => ipcRenderer.invoke('open-deck-window', deckId)
  // (Later you can add cards, reviews, settings, etc.)
});
