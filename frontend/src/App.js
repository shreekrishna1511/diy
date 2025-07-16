import React, { useState } from 'react';

function App() {
  const [naca, setNaca] = useState('0012');
  const [chord, setChord] = useState(100);
  const [points, setPoints] = useState(100);
  const [coords, setCoords] = useState([]);
  const [gcode, setGcode] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setError('');
    setCoords([]);
    setGcode('');
    try {
      const res = await fetch('https://diy-5mwu.onrender.com/api/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({naca, chord, points})
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Error generating data');
        return;
      }
      const data = await res.json();
      setCoords(data.coords);
      setGcode(data.gcode);
    } catch (e) {
      setError('Failed to connect to server');
    }
  };

  const downloadGcode = () => {
    const blob = new Blob([gcode], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wing_${naca}.gcode`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSVG = () => {
    if (coords.length === 0) return null;
    const scale = 3;
    const padding = 10;
    const pathData = coords.map(([x, y], i) => {
      const px = x * scale + padding;
      const py = 100 - y * scale + padding;
      return (i === 0 ? "M" : "L") + px.toFixed(2) + " " + py.toFixed(2);
    }).join(" ") + " Z";
    return (
      <svg width="400" height="120" style={{border: '1px solid #ccc'}}>
        <path d={pathData} fill="#90caf9" stroke="#1976d2" strokeWidth="2" />
      </svg>
    );
  };

  return (
    <div style={{maxWidth: '600px', margin: '20px auto', fontFamily: 'Arial'}}>
      <h2>DIY RC Wings - NACA Airfoil Generator</h2>
      <div>
        <label>
          NACA 4-digit code:&nbsp;
          <input value={naca} onChange={e => setNaca(e.target.value)} maxLength={4} />
        </label>
      </div>
      <div>
        <label>
          Chord length (mm):&nbsp;
          <input type="number" value={chord} onChange={e => setChord(Number(e.target.value))} />
        </label>
      </div>
      <div>
        <label>
          Number of points:&nbsp;
          <input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} min={10} max={200} />
        </label>
      </div>
      <button onClick={fetchData} style={{marginTop: '10px', padding: '8px 16px'}}>
        Generate Wing & G-code
      </button>

      {error && <p style={{color: 'red'}}>{error}</p>}

      {coords.length > 0 && (
        <>
          <h3>Wing Profile Preview</h3>
          {renderSVG()}
          <button onClick={downloadGcode} style={{marginTop: '10px'}}>
            Download G-code File
          </button>
          <pre style={{background: '#eee', padding: '10px', maxHeight: '200px', overflow: 'auto'}}>
            {gcode}
