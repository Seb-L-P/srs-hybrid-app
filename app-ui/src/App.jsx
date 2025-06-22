// App.jsx
import React, { useEffect, useState } from 'react';

// Extract deckId from URL hash "#/deck/<id>"
function getDeckIdFromHash() {
  const m = window.location.hash.match(/^#\/deck\/(\d+)$/);
  return m ? Number(m[1]) : null;
}

function App() {
  const [mode, setMode] = useState('main');
  const [deckId, setDeckId] = useState(null);

  useEffect(() => {
    const onHashChange = () => {
      const id = getDeckIdFromHash();
      if (id !== null) {
        setMode('deck');
        setDeckId(id);
      } else {
        setMode('main');
        setDeckId(null);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return mode === 'deck'
    ? <DeckView deckId={deckId} />
    : <MainView />;
}

function MainView() {
  const [folders, setFolders] = useState([]);
  const [decks, setDecks] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    window.electronAPI.fetchFolders().then(setFolders);
  }, []);

  useEffect(() => {
    if (selectedFolder !== null) {
      window.electronAPI.fetchDecks(selectedFolder).then(setDecks);
    } else {
      setDecks([]);
    }
  }, [selectedFolder]);

  const addFolder = () => {
    if (!newName.trim()) return;
    window.electronAPI
      .createFolder(newName, null)
      .then(() => window.electronAPI.fetchFolders())
      .then(data => {
        setFolders(data);
        setNewName('');
      });
  };

  const addDeck = () => {
    if (!newName.trim() || selectedFolder === null) return;
    window.electronAPI
      .createDeck(newName, selectedFolder)
      .then(() => window.electronAPI.fetchDecks(selectedFolder))
      .then(data => {
        setDecks(data);
        setNewName('');
      });
  };

  return (
    <div style={{ display: 'flex', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ width: 200, marginRight: 40 }}>
        <h2>Folders</h2>
        <ul>
          {folders.map(f => (
            <li key={f.id}>
              <button
                onClick={() => setSelectedFolder(f.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: selectedFolder === f.id ? '#06f' : '#000'
                }}
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
        <button onClick={addFolder} style={{ marginLeft: 8 }}>
          + Folder
        </button>
      </div>

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
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#06f',
                      cursor: 'pointer'
                    }}
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
            <button onClick={addDeck} style={{ marginLeft: 8 }}>
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
  const [back, setBack] = useState('');
  const [mediaPaths, setMediaPaths] = useState([]);
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFront, setShowFront] = useState(true);

  useEffect(() => {
    window.electronAPI.fetchCards(deckId).then(data => {
      setCards(data);
      setCurrentIndex(0);
      setShowFront(true);
    });
  }, [deckId]);

  const addCard = () => {
    if (!front.trim() || !back.trim()) return;
    window.electronAPI
      .createCard(front, back, deckId, mediaPaths)
      .then(() => window.electronAPI.fetchCards(deckId))
      .then(data => {
        setCards(data);
        setFront('');
        setBack('');
        setMediaPaths([]);
      });
  };

  const pickMedia = async () => {
    const paths = await window.electronAPI.selectMedia();
    setMediaPaths(paths);
  };

  const flipCard = () => setShowFront(prev => !prev);
  const nextCard = () => {
    setCurrentIndex(i => (i + 1) % cards.length);
    setShowFront(true);
  };
  const prevCard = () => {
    setCurrentIndex(i => (i - 1 + cards.length) % cards.length);
    setShowFront(true);
  };

  // Study (flashcard) mode
  if (studyMode) {
    if (cards.length === 0) {
      return (
        <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
          <button onClick={() => setStudyMode(false)}>← Back</button>
          <p><em>No cards to study.</em></p>
        </div>
      );
    }
    const card = cards[currentIndex];
    const media = JSON.parse(card.media_json || '[]');

    return (
      <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
        <button onClick={() => setStudyMode(false)}>← Back</button>
        <div
          onClick={flipCard}
          style={{
            margin: '40px auto',
            padding: 60,
            width: 400,
            textAlign: 'center',
            border: '2px solid #333',
            borderRadius: 8,
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <h2>{showFront ? card.front_text : card.back_text}</h2>
          {!showFront && media.map((p, i) => {
            if (/\.(png|jpe?g|gif)$/i.test(p)) {
              return <img key={i} src={`file://${p}`} style={{ maxWidth: '100%', marginTop: 16 }} />;
            }
            if (/\.(mp3|wav)$/i.test(p)) {
              return <audio key={i} controls src={`file://${p}`} style={{ display: 'block', margin: '16px auto' }} />;
            }
            if (/\.(mp4|mov)$/i.test(p)) {
              return <video key={i} controls src={`file://${p}`} style={{ width: '100%', marginTop: 16 }} />;
            }
            return null;
          })}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button onClick={prevCard} disabled={cards.length <= 1} style={{ marginRight: 8 }}>
            ‹ Prev
          </button>
          <button onClick={nextCard} disabled={cards.length <= 1} style={{ marginLeft: 8 }}>
            Next ›
          </button>
          <p style={{ marginTop: 10 }}>
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>
      </div>
    );
  }

  // Deck CRUD view
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Deck #{deckId}</h1>
      <button onClick={() => setStudyMode(true)} disabled={cards.length === 0}>
        ▶ Start Flashcards
      </button>
      <ul>
        {cards.map(c => {
          const media = JSON.parse(c.media_json || '[]');
          return (
            <li key={c.id} style={{ marginBottom: 8 }}>
              <strong>{c.front_text}</strong> → {c.back_text}
              {media.map((p, i) => (
                p.match(/\.(png|jpe?g|gif)$/i) ? (
                  <img key={i} src={`file://${p}`} style={{ maxWidth: 50, marginLeft: 8 }} />
                ) : p.match(/\.(mp3|wav)$/i) ? (
                  <audio key={i} controls src={`file://${p}`} style={{ marginLeft: 8 }} />
                ) : (
                  <video key={i} controls src={`file://${p}`} style={{ width: 80, marginLeft: 8 }} />
                )
              ))}
            </li>
          );
        })}
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
        <button onClick={pickMedia} style={{ marginLeft: 8 }}>
          {mediaPaths.length ? `${mediaPaths.length} file(s)` : 'Attach Media'}
        </button>
        <button onClick={addCard} style={{ marginLeft: 8 }}>
          + Card
        </button>
      </div>
    </div>
  );
}

export default App;
