import { useState } from 'react'
import { reduzirImagem } from '../../imagem'
import { Imagem, Fechar } from '../../Icones'

import { api, enviarImagem } from '../../api'

function NovoPost({ aoPostar }) {
  const logado = JSON.parse(localStorage.getItem('usuario'))

  const [imagem, setImagem] = useState('')
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!logado) return null

  // a conta de moderação não publica: no lugar do campo de post aparece um aviso
  if (logado.admin) {
    return (
      <div className="composer moderacao-aviso">
        <b>Modo moderação</b>
        <span>
          Esta conta não aparece na rede social. Para remover algo impróprio, use o menu ⋯ do post
          ou a lixeira dos comentários e dos stories.
        </span>
      </div>
    )
  }

  async function escolherFoto(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return

    try {
      const reduzida = await reduzirImagem(arquivo, 1080)
      setImagem(reduzida)
      setErro('')
    } catch (err) {
      setErro(err.message)
    }
    e.target.value = ''
  }

  async function publicar(e) {
    e.preventDefault()

    if (!imagem) {
      setErro('Escolha uma foto para postar.')
      return
    }

    setEnviando(true)
    try {
      // primeiro a foto vai para o Blob; o post guarda só o link dela
      const url = await enviarImagem(imagem)
      const resposta = await api('/posts', { metodo: 'POST', corpo: { imagem: url, texto: texto } })
      const dados = resposta.dados

      if (!resposta.ok) {
        setErro(dados.erro)
        return
      }

      setImagem('')
      setTexto('')
      setErro('')
      aoPostar()
    } catch (err) {
      setErro(err.message || 'Não consegui falar com o servidor. Ele está ligado?')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="composer" onSubmit={publicar}>
      <div className="composer-linha">
        <img className="composer-avatar" src={logado.foto} alt={logado.nome} />
        <textarea
          className="composer-texto"
          rows="2"
          placeholder="Compartilhe algo com a Zeon..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </div>

      {imagem && (
        <div className="composer-previa">
          <img src={imagem} alt="Prévia do post" />
          <button
            type="button"
            className="composer-remover"
            onClick={() => setImagem('')}
            aria-label="Remover imagem"
          >
            <Fechar size={18} />
          </button>
        </div>
      )}

      {erro && <p className="erro">{erro}</p>}

      <div className="composer-barra">
        <label className="icone-btn acento" htmlFor="novo-post-foto" title="Adicionar imagem">
          <Imagem />
        </label>
        <input
          id="novo-post-foto"
          type="file"
          accept="image/*"
          hidden
          onChange={escolherFoto}
        />

        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </form>
  )
}

export default NovoPost
