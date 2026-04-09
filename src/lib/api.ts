const URLS = {
  auth: 'https://functions.poehali.dev/531c1dbc-7197-4a1e-9d5a-2d772f755951',
  calls: 'https://functions.poehali.dev/f4d37006-7f8a-4538-90b1-946a45119191',
  contacts: 'https://functions.poehali.dev/403c87b5-d2f3-4b87-8b51-e4bf4c4b6d96',
  messages: 'https://functions.poehali.dev/b8e46868-c0b8-41d0-821d-371a1d19aeaa',
}

function getToken() {
  return localStorage.getItem('session_token') || ''
}

function authHeaders() {
  return { 'Content-Type': 'application/json', 'X-Session-Token': getToken() }
}

export const api = {
  register: (name: string, password: string) =>
    fetch(`${URLS.auth}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, password }) }).then(r => r.json()),

  login: (user_number: number, password: string) =>
    fetch(`${URLS.auth}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_number, password }) }).then(r => r.json()),

  me: () =>
    fetch(`${URLS.auth}/me`, { headers: authHeaders() }).then(r => r.json()),

  getContacts: () =>
    fetch(URLS.contacts, { headers: authHeaders() }).then(r => r.json()),

  addContact: (user_number: number, alias: string) =>
    fetch(URLS.contacts, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ user_number, alias }) }).then(r => r.json()),

  getChats: () =>
    fetch(URLS.messages, { headers: authHeaders() }).then(r => r.json()),

  getMessages: (with_id: number) =>
    fetch(`${URLS.messages}?with=${with_id}`, { headers: authHeaders() }).then(r => r.json()),

  sendMessage: (receiver_id: number, content: string) =>
    fetch(URLS.messages, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ receiver_id, content }) }).then(r => r.json()),

  getCalls: () =>
    fetch(URLS.calls, { headers: authHeaders() }).then(r => r.json()),

  createInvite: () =>
    fetch(`${URLS.calls}/invite`, { method: 'POST', headers: authHeaders() }).then(r => r.json()),

  startCall: (callee_id: number) =>
    fetch(`${URLS.calls}/start`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ callee_id }) }).then(r => r.json()),

  updateCall: (call_id: number, status: string) =>
    fetch(URLS.calls, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ call_id, status }) }).then(r => r.json()),

  joinCall: (token: string) =>
    fetch(`${URLS.calls}/join?token=${token}`).then(r => r.json()),
}
