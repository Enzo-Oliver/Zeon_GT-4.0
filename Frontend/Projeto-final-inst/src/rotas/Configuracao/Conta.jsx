import { useState, useEffect } from 'react'
import { api, usuarioLogado } from '../../api'
import { Olho, OlhoFechado } from '../../Icones'

// campo de senha com o "olhinho" para mostrar o que está digitando
function CampoSenha({ id, rotulo, valor, aoMudar, autoComplete }) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <div className="input-senha">
        <input
          className="input"
          id={id}
          type={visivel ? 'text' : 'password'}
          value={valor}
          autoComplete={autoComplete}
          onChange={(e) => aoMudar(e.target.value)}
        />
        <button
          type="button"
          className="olho"
          onClick={() => setVisivel(!visivel)}
          aria-label={visivel ? 'Esconder senha' : 'Mostrar senha'}
        >
          {visivel ? <OlhoFechado size={20} /> : <Olho size={20} />}
        </button>
      </div>
    </div>
  )
}

// Dados da conta: email e troca de senha
function Conta() {
  const [email, setEmail] = useState('')
  const [trocando, setTrocando] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api('/conta').then((r) => {
      if (r.ok) setEmail(r.dados.email)
    })
  }, [])

  function fechar() {
    setTrocando(false)
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmacao('')
    setErro('')
  }

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    setMensagem('')

    if (novaSenha.length < 6) {
      setErro('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmacao) {
      setErro('A confirmação não é igual à nova senha.')
      return
    }

    setSalvando(true)
    const resposta = await api('/conta/senha', { metodo: 'PATCH', corpo: { senhaAtual, novaSenha } })
    setSalvando(false)

    if (!resposta.ok) {
      setErro(resposta.dados?.erro || 'Não consegui trocar a senha.')
      return
    }
    fechar()
    setMensagem('Senha alterada! Os outros aparelhos onde você estava logado foram desconectados.')
  }

  return (
    <section className="cfg-card cfg-conta">
      <h2 className="cfg-subtitulo">Conta</h2>

      <div className="campo">
        <label htmlFor="emailConta">Email</label>
        <input className="input" id="emailConta" type="email" value={email} readOnly />
      </div>

      {!trocando ? (
        <div className="campo">
          <label htmlFor="senhaConta">Senha</label>
          <div className="cfg-senha-linha">
            <input className="input" id="senhaConta" type="password" value="••••••••" readOnly tabIndex={-1} />
            <button type="button" className="btn btn-fantasma" onClick={() => { setMensagem(''); setTrocando(true) }}>
              Trocar senha
            </button>
          </div>
          <span className="cfg-dica">Por segurança, a senha atual nunca é mostrada.</span>
        </div>
      ) : (
        <form onSubmit={salvar}>
          <CampoSenha id="senhaAtual" rotulo="Senha atual" valor={senhaAtual} aoMudar={setSenhaAtual} autoComplete="current-password" />
          <CampoSenha id="novaSenha" rotulo="Nova senha" valor={novaSenha} aoMudar={setNovaSenha} autoComplete="new-password" />
          <CampoSenha id="confirmarSenha" rotulo="Confirme a nova senha" valor={confirmacao} aoMudar={setConfirmacao} autoComplete="new-password" />

          {erro && <p className="erro">{erro}</p>}

          <div className="cfg-acoes">
            <button type="button" className="btn btn-fantasma" onClick={fechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </div>
        </form>
      )}

      {mensagem && <p className="sucesso">{mensagem}</p>}

      {!usuarioLogado()?.admin && <ApagarConta />}
    </section>
  )
}

// Apagar a conta: pede a senha para confirmar e some com tudo da pessoa
function ApagarConta() {
  const [aberto, setAberto] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [apagando, setApagando] = useState(false)

  function fechar() {
    setAberto(false)
    setSenha('')
    setErro('')
  }

  async function apagar(e) {
    e.preventDefault()
    if (senha === '') {
      setErro('Digite sua senha para confirmar.')
      return
    }

    setApagando(true)
    const resposta = await api('/conta', { metodo: 'DELETE', corpo: { senha } })
    setApagando(false)

    if (!resposta.ok) {
      setErro(resposta.dados?.erro || 'Não consegui apagar a conta.')
      return
    }
    localStorage.removeItem('usuario')
    window.location.hash = '#/login'
  }

  return (
    <div className="cfg-perigo">
      <h3>Apagar conta</h3>
      <p className="cfg-dica">
        Seus posts, stories, comentários e fotos são apagados para sempre. Não dá para desfazer.
      </p>

      {!aberto ? (
        <button type="button" className="btn btn-perigo" onClick={() => setAberto(true)}>
          Apagar minha conta
        </button>
      ) : (
        <form onSubmit={apagar}>
          <CampoSenha id="senhaApagar" rotulo="Digite sua senha para confirmar" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
          {erro && <p className="erro">{erro}</p>}
          <div className="cfg-acoes">
            <button type="button" className="btn btn-fantasma" onClick={fechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-perigo" disabled={apagando}>
              {apagando ? 'Apagando...' : 'Apagar para sempre'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default Conta
