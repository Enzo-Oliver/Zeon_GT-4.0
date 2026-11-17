import { useState } from "react";
import FotoModal from "./FotoModal";

function Galeria({ posts = [] }) {
  const [aberto, setAberto] = useState(null);

  return (
    <section className="galeria">
      <h2 className="galeria-titulo">Publicações</h2>

      {posts.length === 0 ? (
        <p className="vazio">Nenhuma publicação ainda.</p>
      ) : (
        <div className="grade">
          {[...posts].reverse().map((p) => (
            <button
              type="button"
              key={p.id}
              className="grade-item"
              onClick={() => setAberto(p)}
              aria-label="Abrir publicação"
            >
              <img src={p.imagem} alt={p.texto || "Publicação"} />
            </button>
          ))}
        </div>
      )}

      {aberto && <FotoModal post={aberto} aoFechar={() => setAberto(null)} />}
    </section>
  );
}

export default Galeria;
