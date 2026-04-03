import React from 'react'
import Webcam from './src/Webcam'

import { Routes,Route } from 'react-router-dom';
import Profile from './Profile';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Webcam />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  )
}

export default App
