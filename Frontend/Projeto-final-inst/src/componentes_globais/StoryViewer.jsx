import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Fechar, Lixeira } from '../Icones'
import { tempoRelativo } from '../tempo'

const DURACAO = 5000 // cada story fica 5 segundos na tela
const PASSO = 50

// começa no primeiro story que a pessoa ainda não viu
function primeiroNaoVisto(grupo, vistos) {
  const i = grupo.itens.findIndex((s) => !vistos.includes(s.id))
  return i === -1 ? 0 : i
}

function StoryViewer({ grupos, inicio, vistos, logadoId, ehAdmin, aoVer, aoApagar, aoFechar }) {
  const [g, setG] = useState(inicio)
  const [s, setS] = useState(() => primeiroNaoVisto(grupos[inicio], vistos))
  const [progresso, setProgresso] = useState(0)
  const [pausado, setPausado] = useState(false)
  const apertouEm = useRef(0)
  const decorrido = useRef(0)
  const proximoRef = useRef(null)

  const grupo = grupos[g]
  const story = grupo?.itens[s]

  function zerar() {
    decorrido.current = 0
    setProgresso(0)
  }

  const proximo = useCallback(() => {
    zerar()
    if (s < grupo.itens.length - 1) return setS(s + 1)
    if (g < grupos.length - 1) {
      setG(g + 1)
      setS(primeiroNaoVisto(grupos[g + 1], vistos))
      return
    }
    aoFechar()
  }, [g, s, grupo, grupos, vistos, aoFechar])

  function anterior() {
    zerar()
    if (s > 0) return setS(s - 1)
    if (g > 0) {
      setG(g - 1)
      setS(grupos[g - 1].itens.length - 1)
    }
  }

  // marca como visto assim que aparece
  useEffect(() => {
    if (story) aoVer(story.id)
  }, [story, aoVer])

  useEffect(() => {
    proximoRef.current = proximo
  })

  // barra de tempo: quando enche, passa para o próximo
  useEffect(() => {
    if (pausado) return
    const timer = setInterval(() => {
      decorrido.current += PASSO
      if (decorrido.current >= DURACAO) proximoRef.current()
      else setProgresso(decorrido.current / DURACAO)
    }, PASSO)
    return () => clearInterval(timer)
  }, [pausado])

  // teclado: Esc fecha, setas navegam; a página de trás não rola
  useEffect(() => {
    function aoApertar(e) {
      if (e.key === 'Escape') aoFechar()
      if (e.key === 'ArrowRight') proximo()
      if (e.key === 'ArrowLeft') anterior()
    }
    window.addEventListener('keydown', aoApertar)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoApertar)
      document.body.style.overflow = ''
    }
  })

  // segurar pausa; soltar rápido (um toque) navega
  function segurar() {
    apertouEm.current = Date.now()
    setPausado(true)
  }
  function soltar(acao) {
    setPausado(false)
    if (Date.now() - apertouEm.current < 250) acao()
  }

  if (!story) return null
  const meu = grupo.usuarioId === logadoId

  // vai direto para o <body> para ficar por cima do menu do site
  return createPortal(
    <div className="story-viewer" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="story-tela">
        <div className="story-barras">
          {grupo.itens.map((item, i) => (
            <span key={item.id} className="story-barra">
              <span style={{ width: `${i < s ? 100 : i === s ? Math.min(progresso, 1) * 100 : 0}%` }} />
            </span>
          ))}
        </div>

        <div className="story-topo">
          <img src={grupo.foto} alt={grupo.usuario} />
          <b>{meu ? 'Você' : grupo.usuario}</b>
          <span>{tempoRelativo(story.criadoEm)}</span>
          <div className="story-acoes">
            {(meu || ehAdmin) && (
              <button type="button" className="icone-btn" aria-label={meu ? 'Apagar story' : 'Apagar story (admin)'} onClick={() => aoApagar(story)}>
                <Lixeira tamanho={20} />
              </button>
            )}
            <button type="button" className="icone-btn" aria-label="Fechar" onClick={aoFechar}>
              <Fechar tamanho={20} />
            </button>
          </div>
        </div>

        <img className="story-imagem" src={story.imagem} alt={`Story de ${grupo.usuario}`} />

        {/* metade esquerda volta, metade direita avança; segurar pausa */}
        <button
          type="button"
          className="story-toque esquerda"
          aria-label="Story anterior"
          onPointerDown={segurar}
          onPointerUp={() => soltar(anterior)}
          onPointerLeave={() => setPausado(false)}
        />
        <button
          type="button"
          className="story-toque direita"
          aria-label="Próximo story"
          onPointerDown={segurar}
          onPointerUp={() => soltar(proximo)}
          onPointerLeave={() => setPausado(false)}
        />
      </div>
    </div>,
    document.body
  )
}

export default StoryViewer
