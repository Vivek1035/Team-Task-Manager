import api from "./axiosInstance";

export const getProjects   = ()              => api.get("/projects");
export const createProject = (data)          => api.post("/projects", data);
export const updateProject = (id, data)      => api.patch(`/projects/${id}`, data);
export const deleteProject = (id)            => api.delete(`/projects/${id}`);
export const addMember     = (id, data)      => api.post(`/projects/${id}/members`, data);
export const getMyRole     = (id)            => api.get(`/projects/${id}/my-role`);
