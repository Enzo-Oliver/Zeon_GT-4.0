import { useState } from 'react'
import PulseHeart from '../../componentes_globais/PulseHeart'
import { Comentario, Enviar, Mais, Lixeira } from '../../Icones'
import { tempoRelativo } from '../../tempo'

const URL_API = 'http://localhost:3000'

function Posts({ post, aoCurtir }) {
  const logado = JSON.parse(localStorage.getItem('usuario'))
  const [menuAberto, setMenuAberto] = useState(false)

  // posts criados antes de existir "criadoEm" usam o id (que era a data)
  const quando = tempoRelativo(post.criadoEm || (post.id > 1e12 ? post.id : null))
  const ehMeu = logado && logado.nome === post.usuario

  // o PulseHeart chama isso quando a pessoa curte ou descurte
  async function curtir() {
    if (!logado) return
    try {
      await fetch(`${URL_API}/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: logado.id }),
      })
    } catch {
      // sem servidor: o coração só muda na tela
    }
  }

  async function apagar() {
    setMenuAberto(false)
    if (!window.confirm('Apagar este post?')) return
    await fetch(`${URL_API}/posts/${post.id}`, { method: 'DELETE' })
    aoCurtir()
  }

  return (
    <article className="post">
      <header className="post-topo">
        <img
          className="post-avatar"
          src={post.foto || 'https://placehold.co/100x100'}
          alt={post.usuario}
        />
        <div className="post-quem">
          <span className="post-nome">@{post.usuario}</span>
          {quando && <span className="post-tempo">{quando}</span>}
        </div>

        {ehMeu && (
          <div className="post-menu-area">
            <button
              type="button"
              className="icone-btn"
              onClick={() => setMenuAberto(!menuAberto)}
              aria-label="Opções do post"
            >
              <Mais />
            </button>

            {menuAberto && (
              <>
                <div className="post-menu-fundo" onClick={() => setMenuAberto(false)} />
                <div className="post-menu">
                  <button type="button" className="post-menu-item perigo" onClick={apagar}>
                    <Lixeira size={18} />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      <img className="post-imagem" src={post.imagem} alt={post.texto || 'Post'} />

      <div className="post-acoes">
        <PulseHeart
          count={post.curtidas}
          defaultLiked={post.curtiu}
          onChange={curtir}
          disabled={!logado}
          size={24}
          corner={20}
          likedColor="#ff4d6d"
          idleColor="#8b93a7"
          pillColor="#171d2d"
          textColor="#e6e9f0"
          label="Curtir"
        />
        <button type="button" className="icone-btn" aria-label="Comentar">
          <Comentario />
        </button>
        <button type="button" className="icone-btn" aria-label="Compartilhar">
          <Enviar />
        </button>
      </div>

      {post.texto && (
        <div className="post-rodape">
          <p className="post-legenda">
            <b>{post.usuario}</b> {post.texto}
          </p>
        </div>
      )}
    </article>
  )
}

export default Posts
