// Ícones simples em SVG (estilo Lucide), sem precisar instalar nada
function Icone({ tamanho = 22, cheio = false, children }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill={cheio ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const Inicio = (p) => (
  <Icone {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Icone>
)
export const Explorar = (p) => (
  <Icone {...p}><circle cx="12" cy="12" r="9" /><path d="m16 8-2 6-6 2 2-6z" /></Icone>
)
export const Sino = (p) => (
  <Icone {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Icone>
)
export const Mensagem = (p) => (
  <Icone {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icone>
)
export const Usuario = (p) => (
  <Icone {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icone>
)
export const Coracao = (p) => (
  <Icone {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></Icone>
)
export const Comentario = (p) => (
  <Icone {...p}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 3.5 11.5 8.5 8.5 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" /></Icone>
)
export const Enviar = (p) => (
  <Icone {...p}><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></Icone>
)
export const Imagem = (p) => (
  <Icone {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></Icone>
)
export const Mais = (p) => (
  <Icone {...p}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></Icone>
)
export const Adicionar = (p) => (
  <Icone {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Icone>
)
export const Olho = (p) => (
  <Icone {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icone>
)
export const OlhoFechado = (p) => (
  <Icone {...p}><path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.7 2.7" /><path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6" /><path d="m2 2 20 20" /><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2" /></Icone>
)
export const Camera = (p) => (
  <Icone {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></Icone>
)
export const Sair = (p) => (
  <Icone {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></Icone>
)
export const Lixeira = (p) => (
  <Icone {...p}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icone>
)
export const Fechar = (p) => (
  <Icone {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icone>
)
export const Menu = (p) => (
  <Icone {...p}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></Icone>
)
export const Configuracoes = (p) => (
  <Icone {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Icone>
)
