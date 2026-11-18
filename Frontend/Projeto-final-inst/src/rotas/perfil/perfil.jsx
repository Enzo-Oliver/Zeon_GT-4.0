import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Header from "../../componentes_globais/Header"
import Cabecalho from "./Cabecalho"
import Informacaes from "./Informacaes"
import Galeria from "./Galeria"

import { URL_API, usuarioLogado } from '../../api'

// /perfil mostra o seu perfil; /perfil/:nome mostra o perfil de outra pessoa
function Perfil() {
  const { nome } = useParams()
  const logado = JSON.parse(localStorage.getItem('usuario'))
  const quem = nome || logado.nome

  // a "key" faz o perfil recomeçar do zero quando muda de pessoa
  return <ConteudoPerfil key={quem} nome={quem} />
}

function ConteudoPerfil({ nome }) {
  const [usuario, setUsuario] = useState(null)
  const [posts, setPosts] = useState([])
  const [naoExiste, setNaoExiste] = useState(false)

  useEffect(() => {
    // manda o token: o perfil da conta de moderação só abre para ela mesma
    const token = usuarioLogado()?.token
    fetch(`${URL_API}/usuarios/${encodeURIComponent(nome)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (r.status === 404) {
          setNaoExiste(true)
          return null
        }
        return r.json()
      })
      .then((dados) => dados && setUsuario(dados))

    fetch(`${URL_API}/posts`)
      .then((r) => r.json())
      .then((todos) => setPosts(todos.filter((p) => p.usuario === nome)))
  }, [nome])

  if (naoExiste) {
    return (
      <>
        <Header />
        <main className="perfil">
          <p className="vazio">Usuário @{nome} não encontrado.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="perfil">
        <Cabecalho
          foto={usuario ? usuario.foto : 'https://placehold.co/300x300'}
          capa={usuario ? usuario.capa : ''}
        />
        {usuario && <Informacaes usuario={usuario} totalPosts={posts.length} />}
        <Galeria posts={posts} />
      </main>
    </>
  )
}

export default Perfil
