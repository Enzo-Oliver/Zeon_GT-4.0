import { Link } from "react-router-dom";

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

export default Informacaes;
