import { io } from 'socket.io-client'
import { API_BASE_URL } from '../config'

const socket = io(API_BASE_URL, { withCredentials: true })

socket.on('new-alert', (data) => {
  window.dispatchEvent(new CustomEvent('bhu-live-alert', { detail: data }))
})

socket.on('new-prediction', (data) => {
  window.dispatchEvent(new CustomEvent('bhu-live-prediction', { detail: data }))
})

export default socket
