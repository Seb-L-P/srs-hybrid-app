// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  fetchFolders: ()          => ipcRenderer.invoke('db-fetch-folders'),
  createFolder: (name, pid) => ipcRenderer.invoke('db-create-folder', name, pid)
  // later: fetchDecks, createDeck, fetchCards, etc.
});
