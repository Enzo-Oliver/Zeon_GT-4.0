import { useState, useEffect } from 'react'
import { api } from '../../api'
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
    </section>
  )
}

export default Conta
