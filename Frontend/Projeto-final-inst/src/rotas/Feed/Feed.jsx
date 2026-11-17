import { useState, useEffect } from 'react'
import Status from "./../../componentes_globais/Status"
import Header from "./../../componentes_globais/Header"
import GradientWaves from "./../../componentes_globais/GradientWaves"
import Posts from "./Posts"
import NovoPost from "./NovoPost"

const URL_API = 'http://localhost:3000'

function Feed() {
  const [posts, setPosts] = useState([])
  const [erro, setErro] = useState('')

  async function carregarPosts() {
    try {
      // manda o id de quem está vendo para saber quais posts já foram curtidos
      const logado = JSON.parse(localStorage.getItem('usuario'))
      const consulta = logado ? `?usuarioId=${logado.id}` : ''
      const resposta = await fetch(`${URL_API}/posts${consulta}`)
      const dados = await resposta.json()
      setPosts(dados)
      setErro('')
    } catch {
      setErro('Não consegui falar com o servidor. Ele está ligado?')
    }
  }

  useEffect(() => {
    carregarPosts()
  }, [])

  return (
    <>
      {/* fundo animado (fica atrás de tudo) */}
      <div className="feed-fundo" aria-hidden="true">
        <GradientWaves
          horizonColor="#090979"
          waveColor="#0EA5E9"
          crestColor="#7DD3FC"
          speed={0.4}
          amplitude={2.5}
          relief={1}
          lightAngle={120}
          opacity={0.8}
          quality="low"
          dpr={1}
          mouseInteraction
          swellOnClick
        />
      </div>

      <Header />
      <main className="coluna">
        <Status />
        <NovoPost aoPostar={carregarPosts} />
        {erro && <p className="erro">{erro}</p>}
        <div className="feed-lista">
          {[...posts].reverse().map((p) => (
            <Posts key={p.id} post={p} aoCurtir={carregarPosts} />
          ))}
        </div>
      </main>
    </>
  )
}

export default Feed
