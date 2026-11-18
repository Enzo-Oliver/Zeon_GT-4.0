import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { api } from "../api";
import logo from "../assets/zeon-logo.png";
import {
  Inicio,
  Explorar,
  Sino,
  Mensagem,
  Usuario,
  Configuracoes,
  Sair,
  Menu,
} from "../Icones";

// Header no topo (centralizado) + menu lateral que abre pelo hambúrguer
function Header() {
  const logado = JSON.parse(localStorage.getItem("usuario"));
  const [aberto, setAberto] = useState(false);

  // fecha o menu lateral com a tecla Esc
  useEffect(() => {
    function aoApertar(e) {
      if (e.key === "Escape") setAberto(false);
    }
    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
  }, []);

  function sair() {
    api("/logout", { metodo: "POST" }).catch(() => {});
    localStorage.removeItem("usuario");
  }

  function classeTopo({ isActive }) {
    return isActive ? "topbar-link ativo" : "topbar-link";
  }

  function classeLado({ isActive }) {
    return isActive ? "side-link ativo" : "side-link";
  }

  return (
    <>
      <header className="topbar">
        <nav className="topbar-pill">
          <button
            type="button"
            className="icone-btn"
            onClick={() => setAberto(true)}
            aria-label="Abrir menu"
          >
            <Menu />
          </button>

          <Link to="/feed" className="topbar-logo">
            <img src={logo} alt="Zeon" />
          </Link>

          <ul className="topbar-nav">
            <li>
              <NavLink to="/feed" className={classeTopo} aria-label="Feed">
                <Inicio size={22} />
                <span>Feed</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/perfil" end className={classeTopo} aria-label="Perfil">
                <Usuario size={22} />
                <span>Perfil</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/configuracao" className={classeTopo} aria-label="Configurações">
                <Configuracoes size={22} />
                <span>Configurações</span>
              </NavLink>
            </li>
            <li>
              <Link to="/login" className="topbar-link" onClick={sair} aria-label="Sair">
                <Sair size={22} />
                <span>Sair</span>
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* menu lateral (hambúrguer) */}
      <div
        className={aberto ? "gaveta-fundo aberto" : "gaveta-fundo"}
        onClick={() => setAberto(false)}
      />
      <aside className={aberto ? "gaveta aberta" : "gaveta"} aria-hidden={!aberto}>
        <Link to="/feed" className="side-logo">
          <img src={logo} alt="Zeon" />
        </Link>

        <nav className="side-nav">
          <NavLink to="/feed" className={classeLado} onClick={() => setAberto(false)}>
            <Inicio />
            <span>Início</span>
          </NavLink>

          <span className="side-link desativado" title="Em breve">
            <Explorar />
            <span>Explorar</span>
          </span>

          <span className="side-link desativado" title="Em breve">
            <Sino />
            <span>Notificações</span>
          </span>

          <span className="side-link desativado" title="Em breve">
            <Mensagem />
            <span>Mensagens</span>
          </span>

          <NavLink to="/perfil" end className={classeLado} onClick={() => setAberto(false)}>
            <Usuario />
            <span>Perfil</span>
          </NavLink>
        </nav>

        {logado && (
          <div className="side-usuario">
            <img src={logado.foto} alt={logado.nome} />
            <span className="side-usuario-nome">{logado.nome}</span>
            <Link to="/login" className="icone-btn" onClick={sair} title="Sair" aria-label="Sair">
              <Sair size={20} />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

export default Header;
