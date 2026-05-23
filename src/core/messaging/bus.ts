import type { Action, AnyRequest, Request, Response } from './messages'

export function sendMessage<K extends Action>(req: Request<K>): Promise<Response<K>> {
  return chrome.runtime.sendMessage(req) as Promise<Response<K>>
}

export function sendTabMessage<K extends Action>(
  tabId: number,
  req: Request<K>,
): Promise<Response<K>> {
  return chrome.tabs.sendMessage(tabId, req) as Promise<Response<K>>
}

type Handler<K extends Action> = (
  req: Request<K>,
  sender: chrome.runtime.MessageSender,
) => Response<K> | Promise<Response<K>> | void | Promise<void>

export type Handlers = { [K in Action]?: Handler<K> }

/** Internal dispatch signature — the per-action `Handler<K>` types are erased
 *  to one concrete callable so the union map can be invoked. */
type AnyHandler = (req: AnyRequest, sender: chrome.runtime.MessageSender) => unknown

/**
 * Register a set of per-action handlers. Returns a disposer that removes the
 * listener. Unhandled actions are ignored (returns false so other listeners
 * may respond).
 */
export function createMessageRouter(handlers: Handlers): () => void {
  const listener = (
    message: AnyRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ): boolean => {
    const handler = handlers[message.action] as AnyHandler | undefined
    if (!handler) return false

    Promise.resolve(handler(message, sender))
      .then((res) => sendResponse(res ?? { success: true }))
      .catch((err: unknown) =>
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }),
      )

    return true // keep the channel open for the async response
  }

  chrome.runtime.onMessage.addListener(listener)
  return () => chrome.runtime.onMessage.removeListener(listener)
}
