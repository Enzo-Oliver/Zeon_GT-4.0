import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";

function Informacaes({ usuario, totalPosts }) {
  const logado = JSON.parse(localStorage.getItem("usuario"));
  const ehMeuPerfil = logado && logado.nome === usuario.nome;

  return (
    <section className="perfil-info">
      <div className="perfil-info-texto">
        <h1 className="perfil-nome">@{usuario.nome}</h1>
        {usuario.bio && <p className="perfil-bio">{usuario.bio}</p>}

        <p className="perfil-numeros">
          <span><b>{totalPosts}</b> posts</span>
          <span><b>{usuario.seguidores.toLocaleString("pt-BR")}</b> seguidores</span>
          <span><b>{usuario.seguindo.toLocaleString("pt-BR")}</b> seguindo</span>
        </p>

        {usuario.link && (
          <a href={usuario.link} className="perfil-link">
            {usuario.link.replace("https://", "")}
          </a>
        )}
      </div>

      <div className="perfil-acoes">
        {ehMeuPerfil ? (
          <Link to="/configuracao" className="btn btn-fantasma">
            Editar perfil
          </Link>
        ) : logado?.admin ? (
          <Moderacao usuario={usuario} />
        ) : (
          <>
            <button type="button" className="btn btn-primario">Seguir</button>
            <button type="button" className="btn btn-fantasma">Mensagem</button>
          </>
        )}
      </div>
    </section>
  );
}

// Ações da conta de moderação no perfil de outra pessoa
function Moderacao({ usuario }) {
  const navegar = useNavigate();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(usuario.nome);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvarNome(e) {
    e.preventDefault();
    setErro("");
    setOcupado(true);
    const resposta = await api(`/moderacao/usuarios/${usuario.id}`, { metodo: "PATCH", corpo: { nome } });
    setOcupado(false);

    if (!resposta.ok) {
      setErro(resposta.dados?.erro || "Não consegui trocar o nome.");
      return;
    }
    navegar(`/perfil/${encodeURIComponent(resposta.dados.nome)}`, { replace: true });
  }

  async function apagarConta() {
    const pergunta = `Apagar a conta de @${usuario.nome}? Os posts, stories, comentários e fotos dessa pessoa somem para sempre.`;
    if (!window.confirm(pergunta)) return;

    setOcupado(true);
    const resposta = await api(`/moderacao/usuarios/${usuario.id}`, { metodo: "DELETE" });
    setOcupado(false);

    if (!resposta.ok) {
      setErro(resposta.dados?.erro || "Não consegui apagar a conta.");
      return;
    }
    navegar("/feed");
  }

  if (editando) {
    return (
      <form className="moderacao-nome" onSubmit={salvarNome}>
        <input
          className="input"
          value={nome}
          maxLength={30}
          onChange={(e) => setNome(e.target.value)}
          aria-label="Novo nome de usuário"
          autoFocus
        />
        <div className="moderacao-botoes">
          <button type="button" className="btn btn-fantasma" onClick={() => { setEditando(false); setNome(usuario.nome); setErro(""); }}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={ocupado || nome.trim() === ""}>
            Salvar
          </button>
        </div>
        {erro && <p className="erro">{erro}</p>}
      </form>
    );
  }

  return (
    <div className="moderacao-nome">
      <div className="moderacao-botoes">
        <button type="button" className="btn btn-fantasma" onClick={() => setEditando(true)}>
          Trocar nome
        </button>
        <button type="button" className="btn btn-perigo" onClick={apagarConta} disabled={ocupado}>
          {ocupado ? "Apagando..." : "Apagar conta"}
        </button>
      </div>
      {erro && <p className="erro">{erro}</p>}
    </div>
  );
}

export default Informacaes;
