import React, { useEffect, useState } from 'react';

function App() {
  const [folders, setFolders] = useState([]);
  const [newName, setNewName] = useState('');

  // Load folders on mount
  useEffect(() => {
    reload();
  }, []);

  const reload = () =>
    window.electronAPI
      .fetchFolders()
      .then(setFolders)
      .catch(console.error);

  const addFolder = () => {
    if (!newName.trim()) return;
    window.electronAPI
      .createFolder(newName.trim(), null)
      .then(() => {
        setNewName('');
        reload();
      })
      .catch(console.error);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Your Folders</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="New folder name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button onClick={addFolder} style={{ marginLeft: 8 }}>
          + Add Folder
        </button>
      </div>

      {folders.length === 0 ? (
        <p style={{ fontStyle: 'italic' }}>No folders yet.</p>
      ) : (
        <ul>
          {folders.map(f => (
            <li key={f.id}>{f.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
