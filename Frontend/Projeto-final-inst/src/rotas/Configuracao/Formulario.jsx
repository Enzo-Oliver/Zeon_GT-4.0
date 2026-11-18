import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { reduzirImagem } from '../../imagem'
import { Camera } from '../../Icones'
import Conta from './Conta'

import { api } from '../../api'

function Formulario() {
  const logado = JSON.parse(localStorage.getItem('usuario'))
  const nomeLogado = logado ? logado.nome : null
  const navegar = useNavigate()

  const [nome, setNome] = useState(logado ? logado.nome : '')
  const [bio, setBio] = useState(logado ? logado.bio : '')
  const [foto, setFoto] = useState(logado ? logado.foto : '')
  const [capa, setCapa] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  // a capa não fica guardada no login (é pesada), então busca no servidor
  useEffect(() => {
    if (!nomeLogado) return
    api(`/usuarios/${encodeURIComponent(nomeLogado)}`)
      .then((r) => r.dados || {})
      .then((dados) => setCapa(dados.capa || ''))
      .catch(() => {})
  }, [nomeLogado])

  if (!logado) {
    return (
      <p className="vazio">
        Você precisa <Link to="/login">fazer login</Link> primeiro.
      </p>
    )
  }

  async function escolherFoto(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return

    try {
      const imagem = await reduzirImagem(arquivo, 500)
      setFoto(imagem)
      setErro('')
    } catch (err) {
      setErro(err.message)
    }
  }

  async function escolherCapa(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return

    try {
      const imagem = await reduzirImagem(arquivo, 1200)
      setCapa(imagem)
      setErro('')
    } catch (err) {
      setErro(err.message)
    }
  }

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    setMensagem('')

    try {
      const resposta = await api(`/usuarios/${logado.id}`, {
        metodo: 'PATCH',
        corpo: { nome: nome, bio: bio, foto: foto, capa: capa },
      })
      const dados = resposta.dados

      if (!resposta.ok) {
        setErro(dados.erro)
        return
      }

      // mantém o token do login junto com os dados novos
      localStorage.setItem('usuario', JSON.stringify({ ...dados, token: logado.token }))
      setMensagem('Alterações salvas!')
      setTimeout(() => navegar('/perfil'), 700)
    } catch {
      setErro('Não consegui falar com o servidor. Ele está ligado?')
    }
  }

  return (
    <main className="coluna">
      <form className="cfg-card" onSubmit={salvar}>
        <h1 className="cfg-titulo">Editar perfil</h1>

        {/* prévia igual ao perfil: capa retangular + foto de perfil por cima */}
        <div className="cfg-previa">
          <label className="cfg-capa" htmlFor="uploadCapa" title="Trocar foto de capa">
            {capa && <img src={capa} alt="Foto de capa" />}
            <span className="cfg-cam cfg-cam-capa">
              <Camera size={22} />
              Trocar capa
            </span>
          </label>
          <input id="uploadCapa" type="file" accept="image/*" hidden onChange={escolherCapa} />

          <label className="cfg-avatar" htmlFor="uploadFoto" title="Trocar foto de perfil">
            <img src={foto} alt="Foto de perfil" />
            <span className="cfg-cam cfg-cam-avatar">
              <Camera size={26} />
            </span>
          </label>
          <input id="uploadFoto" type="file" accept="image/*" hidden onChange={escolherFoto} />

          <div className="cfg-previa-rodape">
            <span className="cfg-dica">Capa: imagem retangular (ideal 1200 × 400)</span>
            {capa && (
              <button type="button" className="cfg-remover" onClick={() => setCapa('')}>
                Remover capa
              </button>
            )}
          </div>
        </div>

        <div className="campo">
          <label htmlFor="nomeUsuario">Nome de usuário</label>
          <input
            className="input"
            type="text"
            id="nomeUsuario"
            placeholder="Novo nome de usuário"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="bioUsuario">Bio</label>
          <textarea
            className="input"
            id="bioUsuario"
            placeholder="Escreva sua bio"
            rows="4"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {erro && <p className="erro">{erro}</p>}
        {mensagem && <p className="sucesso">{mensagem}</p>}

        <div className="cfg-acoes">
          <button type="button" className="btn btn-fantasma" onClick={() => navegar('/perfil')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario">
            Salvar alterações
          </button>
        </div>
      </form>

      <Conta />
    </main>
  )
}

export default Formulario
