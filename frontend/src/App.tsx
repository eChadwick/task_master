import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CreateTaskPage } from './pages/CreateTaskPage';
import { ViewTaskPage } from './pages/ViewTaskPage'
import { ViewAllTasksPage } from './pages/ViewAllTasksPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<CreateTaskPage />} />
          <Route path="/tasks/create" element={<CreateTaskPage />} />
          <Route path="/tasks/:task_name" element={<ViewTaskPage />} />
          <Route path="/tasks" element={<ViewAllTasksPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;