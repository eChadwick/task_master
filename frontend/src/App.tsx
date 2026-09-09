import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CreateTaskPage } from './pages/CreateTaskPage';
import { ViewTaskPage } from './pages/ViewTaskPage';
import { ViewAllTasksPage } from './pages/ViewAllTasksPage';
import { EditTaskPage } from './pages/EditTaskPage';
import './App.css';
import { TaskFormPage } from './pages/TaskFormPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<TaskFormPage />} />
          <Route path="/tasks/create" element={<TaskFormPage />} />
          <Route path="/tasks/:task_name" element={<ViewTaskPage />} />
          <Route path="/tasks/:task_name/edit" element={<TaskFormPage />} />
          <Route path="/tasks" element={<ViewAllTasksPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;