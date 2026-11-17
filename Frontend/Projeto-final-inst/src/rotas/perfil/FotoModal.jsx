import { useEffect, useState } from "react";
import FlipCard from "../../componentes_globais/FlipCard";
import { Fechar } from "../../Icones";
import { tempoRelativo } from "../../tempo";

// Lado de trás do cartão: informações da publicação
function Info({ post }) {
  const data = post.criadoEm || (post.id > 1e12 ? post.id : null);
  const dataCompleta = data
    ? new Date(data).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : "Não informada";

  return (
    <div className="foto-info">
      <div className="foto-info-autor">
        <img src={post.foto || "https://placehold.co/100x100"} alt={post.usuario} />
        <div>
          <b>@{post.usuario}</b>
          <span>Publicação</span>
        </div>
      </div>

      <p className="foto-info-legenda">{post.texto || "Sem legenda."}</p>

      <dl className="foto-info-dados">
        <div>
          <dt>Curtidas</dt>
          <dd>{post.curtidas}</dd>
        </div>
        <div>
          <dt>Publicado há</dt>
          <dd>{tempoRelativo(data) || "—"}</dd>
        </div>
        <div className="largo">
          <dt>Data</dt>
          <dd>{dataCompleta}</dd>
        </div>
      </dl>

      <p className="foto-info-dica">Clique para voltar à foto</p>
    </div>
  );
}

// Abre a foto inteira num cartão que vira para mostrar as informações
function FotoModal({ post, aoFechar }) {
  const [tamanho, setTamanho] = useState(null);

  // Esc fecha e a página de trás não rola enquanto está aberto
  useEffect(() => {
    function aoApertar(e) {
      if (e.key === "Escape") aoFechar();
    }
    window.addEventListener("keydown", aoApertar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", aoApertar);
      document.body.style.overflow = "";
    };
  }, [aoFechar]);

  // o cartão tem a proporção da própria foto (a foto aparece inteira)
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const maxLargura = Math.min(window.innerWidth * 0.9, 560);
      const maxAltura = window.innerHeight * 0.76;
      const escala = Math.min(maxLargura / img.naturalWidth, maxAltura / img.naturalHeight);
      setTamanho({
        largura: Math.max(300, Math.round(img.naturalWidth * escala)),
        altura: Math.max(400, Math.round(img.naturalHeight * escala)),
      });
    };
    img.src = post.imagem;
  }, [post.imagem]);

  return (
    <div
      className="foto-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <button
        type="button"
        className="icone-btn foto-modal-fechar"
        onClick={aoFechar}
        aria-label="Fechar"
      >
        <Fechar />
      </button>

      {tamanho && (
        <div className="foto-modal-centro">
          <FlipCard
            front={
              <img
                src={post.imagem}
                alt={post.texto || "Publicação"}
                className="foto-frente"
              />
            }
            back={<Info post={post} />}
            axis="y"
            flipOnClick
            draggable
            tilt
            tiltMax={8}
            glare
            glareOpacity={0.16}
            hoverScale={1.02}
            perspective={1100}
            stiffness={170}
            damping={20}
            width={tamanho.largura}
            height={tamanho.altura}
            radius={18}
            background="#111622"
            color="#e6e9f0"
            shadow
            shadowColor="#000000"
            shadowOpacity={0.55}
            ariaLabel="Virar a foto para ver as informações"
          />
          <p className="foto-modal-dica">Clique ou arraste para virar · Esc para fechar</p>
        </div>
      )}
    </div>
  );
}

export default FotoModal;
