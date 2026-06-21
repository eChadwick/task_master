import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export interface Task {
  name: string;
  details?: string | null;
  deadline?: string | null;
}

export interface CreateTaskPayload extends Task {
  is_part_of: string[];
  depends_on: string[];
  blocks: string[];
  is_blocked_by: string[]
}

export const taskApi = {
  getAll: async (): Promise<Task[]> => {
    const response = await axios.get<Task[]>(`${API_BASE_URL}/tasks`);
    return response.data;
  },

  create: async (payload: CreateTaskPayload): Promise<{ id: string }> => {
    const response = await axios.post(`${API_BASE_URL}/tasks`, payload);
    return response.data;
  }
};