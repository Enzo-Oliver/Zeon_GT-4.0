import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Lixeira } from '../../Icones'
import { tempoRelativo } from '../../tempo'
import { api } from '../../api'

const LIMITE = 500

// Lista de comentários de um post + campo para comentar
function Comentarios({ post, logado, aoMudarTotal }) {
  const [lista, setLista] = useState(null) // null = carregando
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api(`/posts/${post.id}/comentarios`)
      .then((r) => {
        if (!r.ok) throw new Error()
        setLista(r.dados)
        aoMudarTotal(r.dados.length)
      })
      .catch(() => setErro('Não consegui carregar os comentários.'))
  }, [post.id, aoMudarTotal])

  // pode apagar: quem escreveu, o dono do post ou um admin
  function podeApagar(c) {
    if (!logado) return false
    return c.usuarioId === logado.id || post.usuario === logado.nome || logado.admin === true
  }

  async function enviar(e) {
    e.preventDefault()
    if (texto.trim() === '') return

    setEnviando(true)
    setErro('')
    const resposta = await api(`/posts/${post.id}/comentarios`, { metodo: 'POST', corpo: { texto } })
    setEnviando(false)

    if (!resposta.ok) {
      setErro(resposta.dados?.erro || 'Não consegui enviar o comentário.')
      return
    }
    const nova = [...lista, resposta.dados]
    setLista(nova)
    aoMudarTotal(nova.length)
    setTexto('')
  }

  async function apagar(c) {
    const deOutro = c.usuarioId !== logado.id
    const pergunta = deOutro ? `Apagar o comentário de @${c.usuario}?` : 'Apagar seu comentário?'
    if (!window.confirm(pergunta)) return

    const resposta = await api(`/comentarios/${c.id}`, { metodo: 'DELETE' })
    if (!resposta.ok) {
      setErro(resposta.dados?.erro || 'Não consegui apagar o comentário.')
      return
    }
    const nova = lista.filter((x) => x.id !== c.id)
    setLista(nova)
    aoMudarTotal(nova.length)
  }

  function linkPerfil(nome) {
    return nome === logado?.nome ? '/perfil' : `/perfil/${encodeURIComponent(nome)}`
  }

  return (
    <section className="comentarios">
      {lista === null && !erro && <p className="comentarios-vazio">Carregando...</p>}
      {lista && lista.length === 0 && <p className="comentarios-vazio">Seja o primeiro a comentar.</p>}

      {lista && lista.length > 0 && (
        <ul className="comentarios-lista">
          {lista.map((c) => (
            <li key={c.id} className="comentario">
              <Link to={linkPerfil(c.usuario)}>
                <img src={c.foto} alt={c.usuario} />
              </Link>
              <div className="comentario-corpo">
                <p>
                  <Link to={linkPerfil(c.usuario)} className="comentario-nome">@{c.usuario}</Link>{' '}
                  {c.texto}
                </p>
                <span className="comentario-tempo">{tempoRelativo(c.criadoEm)}</span>
              </div>
              {podeApagar(c) && (
                <button
                  type="button"
                  className="icone-btn comentario-apagar"
                  onClick={() => apagar(c)}
                  aria-label="Apagar comentário"
                  title="Apagar comentário"
                >
                  <Lixeira tamanho={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {erro && <p className="erro">{erro}</p>}

      {logado && !logado.admin && (
        <form className="comentar" onSubmit={enviar}>
          <img src={logado.foto} alt="" />
          <input
            className="input"
            placeholder="Adicione um comentário..."
            value={texto}
            maxLength={LIMITE}
            onChange={(e) => setTexto(e.target.value)}
            aria-label="Escreva um comentário"
          />
          <button type="submit" className="btn btn-primario" disabled={enviando || texto.trim() === ''}>
            {enviando ? '...' : 'Enviar'}
          </button>
        </form>
      )}
    </section>
  )
}

export default Comentarios
