import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Olho, OlhoFechado } from '../../Icones'

const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function Form() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const navegar = useNavigate()

  async function entrar(e) {
    e.preventDefault()
    setErro('')

    try {
      const resposta = await fetch(`${URL_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, senha: senha }),
      })
      const dados = await resposta.json()

      if (!resposta.ok) {
        setErro(dados.erro)
        return
      }

      localStorage.setItem('usuario', JSON.stringify(dados))
      navegar('/feed')
    } catch {
      setErro('Não consegui falar com o servidor. Ele está ligado?')
    }
  }

  return (
    <div className="auth-lado">
      <form className="auth-card" onSubmit={entrar}>
        <h1 className="auth-titulo">Entrar</h1>
        <p className="auth-sub">Bem-vindo de volta à Zeon.</p>

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
              placeholder="********"
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
          Entrar
        </button>

        <p className="auth-rodape">
          Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </form>
    </div>
  )
}

export default Form
