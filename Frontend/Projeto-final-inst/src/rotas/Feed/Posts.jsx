import { useState } from 'react'
import { Link } from 'react-router-dom'
import PulseHeart from '../../componentes_globais/PulseHeart'
import { Comentario, Enviar, Mais, Lixeira } from '../../Icones'
import { tempoRelativo } from '../../tempo'
import { api } from '../../api'
import Comentarios from './Comentarios'

function Posts({ post, aoCurtir }) {
  const logado = JSON.parse(localStorage.getItem('usuario'))
  const [menuAberto, setMenuAberto] = useState(false)
  const [comentariosAbertos, setComentariosAbertos] = useState(false)
  const [totalComentarios, setTotalComentarios] = useState(post.totalComentarios || 0)

  // posts criados antes de existir "criadoEm" usam o id (que era a data)
  const quando = tempoRelativo(post.criadoEm || (post.id > 1e12 ? post.id : null))
  const ehMeu = logado && logado.nome === post.usuario
  // clicar no nome ou na foto abre o perfil de quem postou
  const linkPerfil = ehMeu ? '/perfil' : `/perfil/${encodeURIComponent(post.usuario)}`
  // o admin pode apagar posts de qualquer pessoa (moderação)
  const ehAdmin = logado?.admin === true

  // o PulseHeart chama isso quando a pessoa curte ou descurte
  async function curtir() {
    if (!logado) return
    try {
      await api(`/posts/${post.id}`, { metodo: 'PATCH' })
    } catch {
      // sem servidor: o coração só muda na tela
    }
  }

  async function apagar() {
    setMenuAberto(false)
    const pergunta = ehMeu ? 'Apagar este post?' : `Apagar o post de @${post.usuario}? (moderação)`
    if (!window.confirm(pergunta)) return
    const resposta = await api(`/posts/${post.id}`, { metodo: 'DELETE' })
    if (!resposta.ok) {
      window.alert(resposta.dados?.erro || 'Não consegui apagar o post.')
      return
    }
    aoCurtir()
  }

  return (
    <article className="post">
      <header className="post-topo">
        <Link to={linkPerfil} className="post-avatar-link" aria-label={`Ver perfil de @${post.usuario}`}>
          <img
            className="post-avatar"
            src={post.foto || 'https://placehold.co/100x100'}
            alt={post.usuario}
          />
        </Link>
        <div className="post-quem">
          <Link to={linkPerfil} className="post-nome">@{post.usuario}</Link>
          {quando && <span className="post-tempo">{quando}</span>}
        </div>

        {(ehMeu || ehAdmin) && (
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
                    {ehMeu ? 'Excluir' : 'Excluir (admin)'}
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
          disabled={!logado || ehAdmin}
          size={24}
          corner={20}
          likedColor="#ff4d6d"
          idleColor="#8b93a7"
          pillColor="#171d2d"
          textColor="#e6e9f0"
          label="Curtir"
        />
        <button
          type="button"
          className={comentariosAbertos ? 'icone-btn post-comentar ativo' : 'icone-btn post-comentar'}
          aria-label="Comentários"
          aria-expanded={comentariosAbertos}
          onClick={() => setComentariosAbertos(!comentariosAbertos)}
        >
          <Comentario />
          {totalComentarios > 0 && <span>{totalComentarios}</span>}
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

      {comentariosAbertos && (
        <Comentarios post={post} logado={logado} aoMudarTotal={setTotalComentarios} />
      )}
    </article>
  )
}

export default Posts
