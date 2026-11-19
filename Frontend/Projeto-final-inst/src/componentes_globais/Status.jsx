import { useState, useEffect } from 'react'
import { reduzirImagem } from '../imagem'
import { Adicionar } from '../Icones'
import StoryViewer from './StoryViewer'

import { api, enviarImagem } from '../api'

function lerVistos() {
  try {
    return JSON.parse(localStorage.getItem('storiesVistos')) || []
  } catch {
    return []
  }
}

function Status() {
  const logado = JSON.parse(localStorage.getItem('usuario'))

  const [grupos, setGrupos] = useState([])
  const [vistos, setVistos] = useState(lerVistos())
  const [aberto, setAberto] = useState(null) // posição do grupo aberto no visualizador
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function carregar() {
    try {
      const resposta = await api('/stories')
      if (resposta.ok) setGrupos(resposta.dados)
    } catch {
      setErro('Não consegui carregar os stories.')
    }
  }

  useEffect(() => {
    api('/stories')
      .then((r) => r.ok && setGrupos(r.dados))
      .catch(() => setErro('Não consegui carregar os stories.'))
  }, [])

  function marcarVisto(id) {
    setVistos((atual) => {
      if (atual.includes(id)) return atual
      const novos = [...atual, id]
      localStorage.setItem('storiesVistos', JSON.stringify(novos))
      return novos
    })
  }

  async function adicionar(e) {
    const arquivo = e.target.files[0]
    e.target.value = ''
    if (!arquivo) return

    setEnviando(true)
    setErro('')
    try {
      // reduz a foto no navegador, manda para o Blob e guarda só o link
      const imagem = await enviarImagem(await reduzirImagem(arquivo, 1080))
      const resposta = await api('/stories', { metodo: 'POST', corpo: { imagem } })
      if (!resposta.ok) {
        setErro(resposta.dados?.erro || 'Não consegui publicar o story.')
        return
      }
      await carregar()
    } catch (err) {
      setErro(err.message || 'Não consegui publicar o story.')
    } finally {
      setEnviando(false)
    }
  }

  async function apagar(story) {
    if (!window.confirm('Apagar este story?')) return
    const resposta = await api(`/stories/${story.id}`, { metodo: 'DELETE' })
    if (!resposta.ok) {
      setErro(resposta.dados?.erro || 'Não consegui apagar o story.')
      return
    }
    setAberto(null)
    carregar()
  }

  return (
    <>
      <div className="stories">
        {/* primeiro círculo: adicionar um story novo */}
        {logado && !logado.admin && (
          <label className={enviando ? 'story story-novo enviando' : 'story story-novo'} title="Adicionar story">
            <span className="story-anel visto">
              <img src={logado.foto} alt="Seu story" />
              <span className="story-mais"><Adicionar tamanho={14} /></span>
            </span>
            <span className="story-nome">{enviando ? 'Enviando...' : 'Seu story'}</span>
            <input type="file" accept="image/*" hidden disabled={enviando} onChange={adicionar} />
          </label>
        )}

        {grupos.map((grupo, i) => {
          const tudoVisto = grupo.itens.every((s) => vistos.includes(s.id))
          return (
            <button type="button" key={grupo.usuarioId} className="story" onClick={() => setAberto(i)}>
              <span className={tudoVisto ? 'story-anel visto' : 'story-anel'}>
                <img src={grupo.foto} alt={grupo.usuario} />
              </span>
              <span className="story-nome">{grupo.usuarioId === logado?.id ? 'Você' : grupo.usuario}</span>
            </button>
          )
        })}
      </div>

      {erro && <p className="erro">{erro}</p>}

      {aberto !== null && grupos[aberto] && (
        <StoryViewer
          grupos={grupos}
          inicio={aberto}
          vistos={vistos}
          logadoId={logado?.id}
          ehAdmin={logado?.admin === true}
          aoVer={marcarVisto}
          aoApagar={apagar}
          aoFechar={() => setAberto(null)}
        />
      )}
    </>
  )
}

export default Status
