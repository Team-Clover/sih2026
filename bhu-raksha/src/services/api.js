import { API_BASE_URL } from '../config'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'Something went wrong. Please try again.')
  return body
}
export const signup = (data) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) })
export const login = (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) })
export const logout = () => request('/api/auth/logout', { method: 'POST' })
export const getCurrentUser = () => request('/api/auth/me')
export const getAlerts = () => request('/api/alerts')
export const getActiveAlerts = () => request('/api/alerts/active')
export const markAlertRead = (id) => request(`/api/alerts/${id}/read`, { method: 'PATCH' })
export const markAllAlertsRead = () => request('/api/alerts/read-all', { method: 'PATCH' })
export const getContacts = () => request('/api/contacts')
export const addContact = (data) => request('/api/contacts', { method: 'POST', body: JSON.stringify(data) })
export const deleteContact = (id) => request(`/api/contacts/${id}`, { method: 'DELETE' })
export const getLocations = () => request('/api/locations')
export const addLocation = (data) => request('/api/locations', { method: 'POST', body: JSON.stringify(data) })
export const deleteLocation = (id) => request(`/api/locations/${id}`, { method: 'DELETE' })
export const createSOS = (data) => request('/api/sos', { method: 'POST', body: JSON.stringify(data) })
