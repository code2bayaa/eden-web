import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { io, type Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { BadgeDollarSign, CheckCircle2, Circle, Wallet } from 'lucide-react'

/**
 * Eden Studio wallet withdrawal - M-PESA B2C to the studio's login number.
 * POST /withdraw sends the payout; Daraja posts the Result to the UKO sockets relay, which emits it into the rooms
 * "<ConversationID>$<key>" / "<OriginatorConversationID>$<key>" (key = the random socket_key sent here). Hearing it
 * only prompts GET /withdraw/:id - the API settles from the relay's verified copy, never from what the browser saw.
 * A slow poll covers a missed socket event.
 */
export type Withdrawal = {
  id: number
  ref: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | string
  phone: string
  receipt: string
  error: string
  time: string
  conversation_id: string
  originator_conversation_id: string
}
//monetized: every monetization rule passes (worked out by the API) - withdrawals stay closed until then
export type Payout = { phone: string; min: number; withdrawals: Withdrawal[]; monetized: boolean; earnings?: Earnings }
//wallet earnings by source: paid (bought credits), ad (Google ads), ukoshop (UKOshop ads)
export type Earnings = Record<string, { views: number; credits: number; amount: number }>

const WITHDRAW_URL: string =
  import.meta.env.VITE_ENVIRONMENT === 'development' ? import.meta.env.VITE_WITHDRAW : import.meta.env.VITE_WITHDRAW_LIVE

const headers = { 'Content-Type': 'application/json', 'x-api-key': import.meta.env.VITE_API_KEY }

function newSocketKey(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function WithdrawCard({ wallet, setWallet, payout, setPayout }: {
  wallet: number
  setWallet: Dispatch<SetStateAction<number>>
  payout: Payout
  setPayout: Dispatch<SetStateAction<Payout>>
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const watch = useRef<{ socket?: Socket; timer?: number; stop?: number }>({})

  const pending = payout.withdrawals.find((w) => w.status === 'pending')

  const stopWatching = () => {
    const w = watch.current
    w.socket?.disconnect()
    if (w.timer) window.clearInterval(w.timer)
    if (w.stop) window.clearTimeout(w.stop)
    watch.current = {}
  }
  useEffect(() => stopWatching, [])

  const upsert = (w: Withdrawal) =>
    setPayout((p) => ({ ...p, withdrawals: [w, ...p.withdrawals.filter((x) => x.id !== w.id)].slice(0, 10) }))

  //ask the API - it checks the relay and settles the payout when M-PESA has answered
  const check = async (id: number) => {
    try {
      const res = await fetch(`${WITHDRAW_URL}/${id}`, { method: 'GET', credentials: 'include', headers })
      const { status, data, balance } = await res.json()
      if (!status) return
      upsert(data)
      if (typeof balance === 'number') setWallet(balance)
      if (data.status === 'completed') {
        stopWatching()
        toast.success(`KES ${data.amount} sent to ${data.phone}${data.receipt ? ` · M-PESA ${data.receipt}` : ''}`)
      } else if (data.status === 'failed') {
        stopWatching()
        toast.error(data.error || 'The payout failed. The amount is back in your wallet.')
      }
    } catch {
      //offline or the API is down - the next tick tries again
    }
  }

  const follow = (w: Withdrawal, key: string, socketsUrl: string) => {
    stopWatching()
    const ids = [w.conversation_id, w.originator_conversation_id].filter(Boolean)
    if (key && socketsUrl && ids.length) {
      const socket = io(socketsUrl, { transports: ['websocket', 'polling'] })
      socket.on('connect', () => ids.forEach((id) => socket.emit('user', `${id}$${key}`)))
      const heard = (payload: { data?: { ConversationID?: string; OriginatorConversationID?: string } }) => {
        const r = payload?.data
        if (r && (ids.includes(r.ConversationID || '') || ids.includes(r.OriginatorConversationID || ''))) void check(w.id)
      }
      socket.on('results', heard)
      socket.on('timeout', heard)
      watch.current.socket = socket
    }
    watch.current.timer = window.setInterval(() => void check(w.id), 8000)
    watch.current.stop = window.setTimeout(stopWatching, 5 * 60 * 1000)
  }

  //a payout left pending from an earlier visit - check on it once
  useEffect(() => {
    if (pending) void check(pending.id)
  }, [pending?.id])

  const submit = async () => {
    if (!payout.monetized) return toast.error('Withdrawals open once this studio is monetized')
    const value = Number(amount)
    if (!Number.isInteger(value) || value <= 0) return toast.error('Enter a whole number of shillings')
    if (value < payout.min) return toast.error(`The minimum withdrawal is KES ${payout.min}`)
    if (value > wallet) return toast.error(`Your wallet holds KES ${wallet}`)
    setBusy(true)
    try {
      const socket_key = newSocketKey()
      const res = await fetch(WITHDRAW_URL, {
        method: 'POST', credentials: 'include', headers, body: JSON.stringify({ amount: value, socket_key }),
      })
      const { status, message, data } = await res.json()
      if (!status) return toast.error(message || 'Withdrawal failed')
      toast.success(message)
      upsert(data)
      setWallet((b) => b - value)
      setAmount('')
      setOpen(false)
      follow(data, socket_key, data.sockets_url)
    } catch (error: any) {
      toast.error(error?.message || 'Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-teal-300/20 bg-teal-300/10 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-100/70">Wallet account</p>
          <p className="mt-2 text-3xl font-semibold text-white">KES {wallet}</p>
        </div>
        <Wallet className="size-8 text-teal-200" />
      </div>

      {open ? (
        <div className="mt-6 space-y-3">
          <label className="block text-xs text-sand-100/70">
            Amount (KES) - paid by M-PESA to {payout.phone || 'your account number'}
            <input
              type="number" inputMode="numeric" min={payout.min} max={wallet} step={1} value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder={`Min ${payout.min}`}
              className="mt-1 h-10 w-full rounded-md border border-white/10 bg-[#111317] px-3 text-sm text-white outline-none focus:border-teal-300/60"
            />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={submit}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-[#111317] hover:bg-sand-100 disabled:opacity-60">
              <BadgeDollarSign className="size-4" />
              {busy ? 'Sending…' : 'Send to M-PESA'}
            </button>
            <button type="button" disabled={busy} onClick={() => setOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-3 text-sm text-white hover:bg-white/[0.06]">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={!payout.monetized || !!pending || wallet < payout.min} onClick={() => setOpen(true)}
          title={!payout.monetized ? 'Withdrawals open once this studio is monetized' : pending ? 'A withdrawal is still being processed' : wallet < payout.min ? `The minimum withdrawal is KES ${payout.min}` : ''}
          className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-[#111317] hover:bg-sand-100 disabled:opacity-60">
          <BadgeDollarSign className="size-4" />
          {pending ? 'Withdrawal processing…' : 'Withdraw'}
        </button>
      )}
      {!payout.monetized && (
        <p className="mt-3 text-xs text-teal-100/70">
          Withdrawals open once this studio is monetized. That happens by itself when every rule under
          Monetization passes - no deposit or fee.
        </p>
      )}

      {payout.withdrawals.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-white/10 pt-4">
          {payout.withdrawals.slice(0, 5).map((w) => (
            <li key={w.id} className="flex items-start justify-between gap-3 text-xs">
              <span className="flex items-start gap-2 text-sand-100/70">
                {w.status === 'completed' ? <CheckCircle2 className="mt-0.5 size-3.5 text-teal-200" /> : <Circle className={`mt-0.5 size-3.5 ${w.status === 'failed' ? 'text-clay-400' : 'text-sand-100/40'}`} />}
                <span>
                  {w.ref} · {w.status === 'completed' ? (w.receipt ? `M-PESA ${w.receipt}` : 'sent') : w.status}
                  {w.status === 'failed' && w.error ? <span className="block text-sand-100/45">{w.error}</span> : null}
                </span>
              </span>
              <span className="shrink-0 font-semibold text-white">KES {w.amount}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
