// Transforma a data do post em "agora", "5 min", "2 h", "3 d"...
export function tempoRelativo(data) {
  if (!data) return ''

  const segundos = Math.floor((Date.now() - new Date(data).getTime()) / 1000)

  if (segundos < 60) return 'agora'
  if (segundos < 3600) return `${Math.floor(segundos / 60)} min`
  if (segundos < 86400) return `${Math.floor(segundos / 3600)} h`
  if (segundos < 604800) return `${Math.floor(segundos / 86400)} d`

  return new Date(data).toLocaleDateString('pt-BR')
}
