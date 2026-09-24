import { io } from 'socket.io-client'

/**
 * Per-payment M-PESA room on the UKO sockets relay - the scheme UKOshop uses. A random key goes to the API with the
 * STK push; the API signs it into the callback URL and the relay emits the callback only into
 * "<MerchantRequestID>$<key>", refusing unsigned posts. The callback only prompts the page: the API still asks
 * Safaricom whether the payment went through (back-end mpesa.js stkQuery) before anything is marked paid.
 */
export function newSocketKey(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Join the room and call onCallback with the stkCallback once it is relayed. Returns a function that leaves. */
export function joinMpesaRoom(socketsUrl: string | undefined, merchantRequestId: string | undefined, key: string,
  onCallback: (data: any) => void): () => void {
  if (!socketsUrl || !merchantRequestId || !key) return () => {}
  const socket = io(socketsUrl, { transports: ['websocket', 'polling'] })
  socket.on('connect', () => socket.emit('user', `${merchantRequestId}$${key}`))
  socket.on('callback', ({ data }: { data?: any } = {}) => {
    if (data && data.MerchantRequestID === merchantRequestId) onCallback(data)
  })
  return () => { socket.disconnect() }
}
