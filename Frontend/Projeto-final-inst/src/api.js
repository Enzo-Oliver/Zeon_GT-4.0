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

// Manda uma foto (a prévia em base64 que o reduzirImagem gera) para o servidor,
// que guarda no Vercel Blob e devolve o link. Só o link vai para o banco.
export async function enviarImagem(dataUrl) {
  const arquivo = await (await fetch(dataUrl)).blob()
  const logado = usuarioLogado()

  const resposta = await fetch(`${URL_API}/imagens`, {
    method: 'POST',
    headers: { 'Content-Type': arquivo.type, Authorization: `Bearer ${logado?.token}` },
    body: arquivo,
  })
  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) throw new Error(dados?.erro || 'Não consegui enviar a foto.')
  return dados.url
}
