import { API_BASE_URL } from '../config'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json()
}

export function checkApiStatus() {
  return request('/')
}

export function predictRisk(data) {
  return request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function predictLandslide(data) {
  return predictRisk(data)
}
