import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Timeline from './components/Timeline';


function App() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h1>政治シミュレーション（仮）</h1>
      <Timeline />
    </div>
  );
}

export default App;
