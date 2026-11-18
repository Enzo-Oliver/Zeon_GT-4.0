export const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function usuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem('usuario'))
  } catch {
    return null
  }
}

// Chama o backend já mandando o token de quem está logado.
// Se o servidor disser que a sessão acabou (401), sai e volta para o login.
export async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const logado = usuarioLogado()
  const headers = {}
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  if (logado?.token) headers.Authorization = `Bearer ${logado.token}`

  const resposta = await fetch(`${URL_API}${caminho}`, {
    method: metodo,
    headers,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  })

  if (resposta.status === 401 && logado) {
    localStorage.removeItem('usuario')
    window.location.hash = '#/login'
  }

  const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null)
  return { ok: resposta.ok, status: resposta.status, dados }
}
