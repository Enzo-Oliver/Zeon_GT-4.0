import icone from "../../assets/zeon-icone.png";

function Cabecalho({ foto, capa }) {
  return (
    <div className="capa-area">
      <div
        className={capa ? "capa com-imagem" : "capa"}
        style={capa ? { backgroundImage: `url("${capa}")` } : undefined}
      >
        {!capa && <img src={icone} className="capa-marca" alt="" />}
      </div>
      <img src={foto} className="capa-avatar" alt="Foto de perfil" />
    </div>
  );
}

export default Cabecalho;
