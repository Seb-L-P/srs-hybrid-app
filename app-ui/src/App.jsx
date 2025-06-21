import React, { useEffect, useState } from 'react';

function App() {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [decks, setDecks] = useState([]);
  const [newName, setNewName] = useState('');

  // Load folders on mount
  useEffect(() => {
    window.electronAPI.fetchFolders().then(setFolders);
  }, []);

  // Load decks whenever folder changes
  useEffect(() => {
    if (selectedFolder !== null) {
      window.electronAPI.fetchDecks(selectedFolder).then(setDecks);
    } else {
      setDecks([]);
    }
  }, [selectedFolder]);

  const addFolder = () => {
    if (!newName.trim()) return;
    window.electronAPI.createFolder(newName, null).then(() => {
      setNewName('');
      return window.electronAPI.fetchFolders();
    }).then(setFolders);
  };

  const addDeck = () => {
    if (!newName.trim() || selectedFolder === null) return;
    window.electronAPI.createDeck(newName, selectedFolder).then(() => {
      setNewName('');
      return window.electronAPI.fetchDecks(selectedFolder);
    }).then(setDecks);
  };

  return (
    <div style={{ display: 'flex', padding: 20, fontFamily: 'sans-serif' }}>
      {/* Sidebar: Folders */}
      <div style={{ width: 200, marginRight: 40 }}>
        <h2>Folders</h2>
        <ul>
          {folders.map(f => (
            <li key={f.id}>
              <button onClick={() => setSelectedFolder(f.id)}>
                {f.name}
              </button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          placeholder="New folder"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button onClick={addFolder}>+ Folder</button>
      </div>

      {/* Main: Decks */}
      <div style={{ flex: 1 }}>
        <h2>
          {selectedFolder
            ? `Decks in "${folders.find(f => f.id === selectedFolder)?.name}"`
            : 'Select a folder'}
        </h2>

        {selectedFolder && (
          <>
            <ul>
              {decks.map(d => (
                <li key={d.id}>{d.name}</li>
              ))}
            </ul>
            <input
              type="text"
              placeholder="New deck"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button onClick={addDeck}>+ Deck</button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
