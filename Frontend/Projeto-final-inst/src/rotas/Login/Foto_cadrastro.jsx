import InfiniteSpiral from "../../componentes_globais/InfiniteSpiral"
import logo from "../../assets/zeon-app.png"
import icone from "../../assets/zeon-icone.png"
import card1 from "../../assets/spiral/card-1.jpg"
import card2 from "../../assets/spiral/card-2.jpg"
import card3 from "../../assets/spiral/card-3.jpg"
import card4 from "../../assets/spiral/card-4.jpg"
import card5 from "../../assets/spiral/card-5.jpg"
import card6 from "../../assets/spiral/card-6.jpg"
import card7 from "../../assets/spiral/card-7.jpg"
import card8 from "../../assets/spiral/card-8.jpg"

// Troque os cartões por fotos suas quando quiser (src + alt)
const imagens = [
  { src: card1, alt: "Zeon 1" },
  { src: card2, alt: "Zeon 2" },
  { src: card3, alt: "Zeon 3" },
  { src: card4, alt: "Zeon 4" },
  { src: card5, alt: "Zeon 5" },
  { src: card6, alt: "Zeon 6" },
  { src: card7, alt: "Zeon 7" },
  { src: card8, alt: "Zeon 8" },
]

// Lado esquerdo da tela de login/cadastro
function Foto_cadrastro() {
  return (
    <div className="auth-marca">
      <div className="auth-marca-spiral">
        <InfiniteSpiral
          items={imagens}
          animationMode="all"
          speed={0.55}
          radius={190}
          cardWidth={130}
          cardHeight={130}
          verticalSpacing={70}
          perspective={1000}
          cardRadius={14}
          centerScale={1.2}
          edgeBlur={6}
          cardsPerTurn={8}
          pauseOnHover
        />
      </div>

      <img src={icone} className="auth-marca-icone" alt="" />
      <img src={logo} className="auth-marca-logo" alt="Zeon" />
    </div>
  )
}

export default Foto_cadrastro
