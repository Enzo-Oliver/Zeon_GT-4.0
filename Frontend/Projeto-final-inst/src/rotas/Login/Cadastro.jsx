import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Foto_cadrastro from './Foto_cadrastro'
import { Olho, OlhoFechado } from '../../Icones'

const URL_API = 'http://localhost:3000'

function Cadastro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const navegar = useNavigate()

  async function cadastrar(e) {
    e.preventDefault()
    setErro('')

    try {
      const resposta = await fetch(`${URL_API}/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome, email: email, senha: senha }),
      })
      const dados = await resposta.json()

      if (!resposta.ok) {
        setErro(dados.erro)
        return
      }

      // já entra direto depois de criar a conta
      localStorage.setItem('usuario', JSON.stringify(dados))
      navegar('/feed')
    } catch {
      setErro('Não consegui falar com o servidor. Ele está ligado?')
    }
  }

  return (
    <main className="auth">
      <Foto_cadrastro />

      <div className="auth-lado">
        <form className="auth-card" onSubmit={cadastrar}>
          <h1 className="auth-titulo">Criar conta</h1>
          <p className="auth-sub">Leva menos de um minuto.</p>

          <div className="campo">
            <label htmlFor="nome">Nome de usuário</label>
            <input
              className="input"
              id="nome"
              type="text"
              placeholder="seu_usuario"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              type="email"
              placeholder="usuario@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <div className="input-senha">
              <input
                className="input"
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button
                type="button"
                className="olho"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? <OlhoFechado size={20} /> : <Olho size={20} />}
              </button>
            </div>
          </div>

          {erro && <p className="erro">{erro}</p>}

          <button type="submit" className="btn btn-primario btn-bloco">
            Criar conta
          </button>

          <p className="auth-rodape">
            Já tem uma conta? <Link to="/login">Entrar</Link>
          </p>
        </form>
      </div>
    </main>
  )
}

export default Cadastro
