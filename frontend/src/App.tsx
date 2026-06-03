import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CreateTaskPage } from './pages/CreateTaskPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<CreateTaskPage />} />
          <Route path="/tasks/create" element={<CreateTaskPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;