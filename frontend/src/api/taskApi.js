import api from "./axiosInstance";

export const getTasks   = (projectId, page = 0, size = 20) =>
  api.get("/tasks", { params: { projectId, page, size } });

export const createTask = (data) => api.post("/tasks", data);
export const deleteTask = (id)   => api.delete(`/tasks/${id}`);
export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data);
export const getStats   = () => api.get("/tasks/stats");
