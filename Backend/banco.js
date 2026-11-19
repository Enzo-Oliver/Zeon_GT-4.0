import { MongoClient } from 'mongodb'

// Conexão com o MongoDB Atlas (reaproveitada entre as chamadas)
let promessa = null

const SEM_ID = { projection: { _id: 0 } }

const usuariosPadrao = [
  {
    id: 1, nome: 'enzooliverr_', email: 'enzo@gmail.com', senha: '123456',
    bio: 'Tec. Redes | ADS - Senac', foto: 'https://placehold.co/300x300',
    seguidores: 828, seguindo: 1059, link: 'https://github.com/Enzo-Oliver',
  },
  {
    id: 2, nome: 'opovoonline', email: 'povo@gmail.com', senha: '123456',
    bio: 'Jornal O Povo', foto: 'https://placehold.co/300x300',
    seguidores: 1000, seguindo: 10, link: '',
  },
]

const postsPadrao = [
  {
    id: 1, usuario: 'opovoonline', imagem: 'https://placehold.co/600x400',
    texto: 'Popular Atacadista inaugura unidade', curtidas: 0, curtidoPor: [],
    criadoEm: new Date().toISOString(),
  },
]

export function conectar() {
  if (!promessa) {
    if (!process.env.MONGODB_URI) {
      throw new Error('Falta a variável MONGODB_URI.')
    }
    promessa = (async () => {
      const cliente = new MongoClient(process.env.MONGODB_URI)
      await cliente.connect()
      const db = cliente.db(process.env.MONGODB_DB || 'zeon')
      const usuarios = db.collection('usuarios')
      const posts = db.collection('posts')

      // primeira vez: cria os dados de teste
      if ((await usuarios.countDocuments()) === 0) {
        await usuarios.insertMany(usuariosPadrao.map((u) => ({ ...u })))
        await posts.insertMany(postsPadrao.map((p) => ({ ...p })))
      }
      // stories vencidos (24h) agora são apagados pelo servidor, junto com a foto no Blob.
      // Remove o índice antigo que apagava sozinho (e deixava a foto esquecida no Blob).
      const stories = db.collection('stories')
      await stories.dropIndex('criadoEm_1').catch(() => {})

      // login: cada sessão vale 30 dias
      const sessoes = db.collection('sessoes')
      await sessoes.createIndex({ token: 1 }, { unique: true })
      await sessoes.createIndex({ criadoEm: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })

      const comentarios = db.collection('comentarios')
      await comentarios.createIndex({ postId: 1 })

      return { usuarios, posts, stories, sessoes, comentarios }
    })()
    promessa.catch(() => { promessa = null })
  }
  return promessa
}

export { SEM_ID }
