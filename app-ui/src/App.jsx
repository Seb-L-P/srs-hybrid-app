import React, { useEffect, useState } from 'react';

// Parse deckId from URL hash (e.g. "#/deck/3")
function getDeckIdFromHash() {
  const m = window.location.hash.match(/^#\/deck\/(\d+)$/);
  return m ? +m[1] : null;
}

function App() {
  const [mode, setMode] = useState('main');
  const [deckId, setDeckId] = useState(null);

  useEffect(() => {
    const onHash = () => {
      const id = getDeckIdFromHash();
      if (id != null) {
        setMode('deck');
        setDeckId(id);
      } else {
        setMode('main');
        setDeckId(null);
      }
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return mode === 'deck'
    ? <DeckView deckId={deckId} />
    : <MainView />;
}

function MainView() {
  const [folders, setFolders]       = useState([]);
  const [decks, setDecks]           = useState([]);
  const [selectedFolder, setFolder] = useState(null);
  const [newName, setNewName]       = useState('');

  useEffect(() => {
    window.electronAPI.fetchFolders().then(setFolders);
  }, []);

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
      .then(f => {
        setFolders(f);
        setNewName('');
      });
  };

  const addDeck = () => {
    if (!newName.trim() || selectedFolder == null) return;
    window.electronAPI.createDeck(newName, selectedFolder)
      .then(() => window.electronAPI.fetchDecks(selectedFolder))
      .then(d => {
        setDecks(d);
        setNewName('');
      });
  };

  return (
    <div style={{ display:'flex', padding:20, fontFamily:'sans-serif' }}>
      <div style={{ width:200, marginRight:40 }}>
        <h2>Folders</h2>
        <ul>
          {folders.map(f => (
            <li key={f.id}>
              <button onClick={() => setFolder(f.id)}>
                {f.name}
              </button>
            </li>
          ))}
        </ul>
        <input
          type="text" placeholder="New folder"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button onClick={addFolder} style={{ marginLeft:8 }}>
          + Folder
        </button>
      </div>

      <div style={{ flex:1 }}>
        <h2>
          {selectedFolder
            ? `Decks in "${folders.find(f=>f.id===selectedFolder)?.name}"`
            : 'Select a folder'}
        </h2>
        {selectedFolder && (
          <>
            <ul>
              {decks.map(d => (
                <li key={d.id}>
                  <button
                    onClick={() => window.electronAPI.openDeckWindow(d.id)}
                  >
                    {d.name}
                  </button>
                </li>
              ))}
            </ul>
            <input
              type="text" placeholder="New deck"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button onClick={addDeck} style={{ marginLeft:8 }}>
              + Deck
            </button>
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

  useEffect(() => {
    window.electronAPI.fetchCards(deckId).then(setCards);
  }, [deckId]);

  const addCard = () => {
    if (!front.trim() || !back.trim()) return;
    window.electronAPI.createCard(front, back, deckId)
      .then(() => window.electronAPI.fetchCards(deckId))
      .then(c => {
        setCards(c);
        setFront('');
        setBack('');
      });
  };

  return (
    <div style={{ padding:20, fontFamily:'sans-serif' }}>
      <h1>Deck #{deckId}</h1>
      <ul>
        {cards.map(c => (
          <li key={c.id}>
            <strong>{c.front_text}</strong> → {c.back_text}
          </li>
        ))}
      </ul>
      <div style={{ marginTop:20 }}>
        <input
          type="text" placeholder="Front text"
          value={front}
          onChange={e => setFront(e.target.value)}
        />
        <input
          type="text" placeholder="Back text"
          value={back}
          onChange={e => setBack(e.target.value)}
          style={{ marginLeft:8 }}
        />
        <button onClick={addCard} style={{ marginLeft:8 }}>
          + Card
        </button>
      </div>
    </div>
  );
}

export default App;
