import React, { useEffect, useState } from 'react';

// Helper to parse deckId from the URL hash (e.g. "#/deck/3")
function getDeckIdFromHash() {
  const match = window.location.hash.match(/^#\/deck\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function App() {
  const [mode, setMode] = useState('main');       // 'main' or 'deck'
  const [deckId, setDeckId] = useState(null);

  // On mount and when hash changes, switch mode
  useEffect(() => {
    function updateMode() {
      const id = getDeckIdFromHash();
      if (id !== null) {
        setMode('deck');
        setDeckId(id);
      } else {
        setMode('main');
        setDeckId(null);
      }
    }
    window.addEventListener('hashchange', updateMode);
    updateMode();
    return () => window.removeEventListener('hashchange', updateMode);
  }, []);

  return mode === 'deck'
    ? <DeckView deckId={deckId} />
    : <MainView />;
}

function MainView() {
  const [folders, setFolders] = useState([]);
  const [decks, setDecks]     = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newName, setNewName]  = useState('');

  // Load folders on mount
  useEffect(() => {
    window.electronAPI.fetchFolders().then(setFolders);
  }, []);

  // Load decks when folder changes
  useEffect(() => {
    if (selectedFolder != null) {
      window.electronAPI.fetchDecks(selectedFolder).then(setDecks);
    } else {
      setDecks([]);
    }
  }, [selectedFolder]);

  const addFolder = () => {
    if (!newName.trim()) return;
    window.electronAPI.createFolder(newName, null)
      .then(() => window.electronAPI.fetchFolders())
      .then(data => {
        setFolders(data);
        setNewName('');
      });
  };

  const addDeck = () => {
    if (!newName.trim() || selectedFolder == null) return;
    window.electronAPI.createDeck(newName, selectedFolder)
      .then(() => window.electronAPI.fetchDecks(selectedFolder))
      .then(data => {
        setDecks(data);
        setNewName('');
      });
  };

  return (
    <div style={{ display: 'flex', padding: 20, fontFamily: 'sans-serif' }}>
      {/* Sidebar: Folders */}
      <div style={{ width: 200, marginRight: 40 }}>
        <h2>Folders</h2>
        <ul>
          {folders.map(f => (
            <li key={f.id}>
              <button
                onClick={() => setSelectedFolder(f.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedFolder===f.id?'#06f':'#000' }}
              >
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
        <button onClick={addFolder} style={{ marginLeft: 8 }}>+ Folder</button>
      </div>

      {/* Main Panel: Decks */}
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
                <li key={d.id}>
                  <button
                    onClick={() => window.electronAPI.openDeckWindow(d.id)}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#06f', cursor: 'pointer' }}
                  >
                    {d.name}
                  </button>
                </li>
              ))}
            </ul>
            <input
              type="text"
              placeholder="New deck"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button onClick={addDeck} style={{ marginLeft: 8 }}>+ Deck</button>
          </>
        )}
      </div>
    </div>
  );
}

function DeckView({ deckId }) {
  const [cards, setCards] = useState([]);
  const [front, setFront] = useState('');
  const [back, setBack]   = useState('');

  // Load cards when deckId changes
  useEffect(() => {
    window.electronAPI.fetchCards(deckId).then(setCards);
  }, [deckId]);

  const addCard = () => {
    if (!front.trim() || !back.trim()) return;
    window.electronAPI.createCard(front, back, deckId)
      .then(() => window.electronAPI.fetchCards(deckId))
      .then(data => {
        setCards(data);
        setFront('');
        setBack('');
      });
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Deck #{deckId}</h1>
      <ul>
        {cards.map(c => (
          <li key={c.id}>
            <strong>{c.front_text}</strong> → {c.back_text}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 20 }}>
        <input
          type="text"
          placeholder="Front text"
          value={front}
          onChange={e => setFront(e.target.value)}
        />
        <input
          type="text"
          placeholder="Back text"
          value={back}
          onChange={e => setBack(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <button onClick={addCard} style={{ marginLeft: 8 }}>+ Card</button>
      </div>
    </div>
  );
}

export default App;
