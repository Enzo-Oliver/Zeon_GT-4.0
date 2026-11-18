import express from 'express'
import cors from 'cors'
import { conectar, SEM_ID } from './banco.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '4mb' }))

function publico(u) {
  return {
    id: u.id,
    nome: u.nome,
    bio: u.bio ?? '',
    foto: u.foto ?? 'https://placehold.co/300x300',
    seguidores: u.seguidores ?? 0,
    seguindo: u.seguindo ?? 0,
    link: u.link ?? '',
  }
}

app.get('/', (req, res) => {
  res.send('Olá! O servidor está funcionando.')
})

app.get('/posts', async (req, res) => {
  const { usuarios, posts } = await conectar()
  const usuarioId = Number(req.query.usuarioId)

  const todos = await posts.find({}, SEM_ID).sort({ id: 1 }).toArray()
  const autores = await usuarios.find({}, { projection: { _id: 0, nome: 1, foto: 1 } }).toArray()
  const fotos = {}
  autores.forEach((a) => { fotos[a.nome] = a.foto })

  const lista = todos.map((p) => {
    const { curtidoPor, ...resto } = p
    return {
      ...resto,
      foto: fotos[p.usuario] || 'https://placehold.co/100x100',
      curtiu: (curtidoPor || []).includes(usuarioId),
    }
  })
  res.json(lista)
})

app.post('/posts', async (req, res) => {
  const { posts } = await conectar()
  const { usuario, imagem, texto } = req.body

  if (!imagem || imagem.trim() === '') {
    return res.status(400).json({ erro: 'Coloque a imagem do post.' })
  }

  const novo = {
    id: Date.now(), usuario, imagem, texto, curtidas: 0, curtidoPor: [],
    criadoEm: new Date().toISOString(),
  }
  await posts.insertOne({ ...novo })
  const { curtidoPor, ...resposta } = novo
  res.status(201).json(resposta)
})

// curtir / descurtir
app.patch('/posts/:id', async (req, res) => {
  const { posts } = await conectar()
  const id = Number(req.params.id)
  const post = await posts.findOne({ id }, SEM_ID)

  if (!post) {
    return res.status(404).json({ erro: 'Post não encontrado.' })
  }

  const usuarioId = req.body ? req.body.usuarioId : undefined
  let curtidoPor = post.curtidoPor || []
  let curtidas = post.curtidas

  if (usuarioId === undefined) {
    curtidas = curtidas + 1
  } else if (curtidoPor.includes(usuarioId)) {
    curtidoPor = curtidoPor.filter((i) => i !== usuarioId)
    curtidas = Math.max(0, curtidas - 1)
  } else {
    curtidoPor = [...curtidoPor, usuarioId]
    curtidas = curtidas + 1
  }

  await posts.updateOne({ id }, { $set: { curtidas, curtidoPor } })
  res.json({ id, curtidas, curtiu: curtidoPor.includes(usuarioId) })
})

app.delete('/posts/:id', async (req, res) => {
  const { posts } = await conectar()
  await posts.deleteOne({ id: Number(req.params.id) })
  res.status(204).end()
})

app.get('/stories', async (req, res) => {
  const { usuarios } = await conectar()
  const todos = await usuarios.find({}, SEM_ID).toArray()
  res.json(todos.map((u) => ({ id: u.id, name: u.nome, img: publico(u).foto })))
})

app.post('/login', async (req, res) => {
  const { usuarios } = await conectar()
  const { email, senha } = req.body
  const usuario = await usuarios.findOne({ email, senha }, SEM_ID)

  if (!usuario) {
    return res.status(401).json({ erro: 'Email ou senha errados.' })
  }

  res.json(publico(usuario))
})

app.get('/usuarios/:nome', async (req, res) => {
  const { usuarios } = await conectar()
  const usuario = await usuarios.findOne({ nome: req.params.nome }, SEM_ID)

  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' })
  }

  res.json({ ...publico(usuario), capa: usuario.capa ?? '' })
})

// configurações: nome, bio, foto e capa
app.patch('/usuarios/:id', async (req, res) => {
  const { usuarios, posts } = await conectar()
  const id = Number(req.params.id)
  const usuario = await usuarios.findOne({ id }, SEM_ID)

  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' })
  }

  const { nome, bio, foto, capa } = req.body
  const mudancas = {}

  if (nome !== undefined) {
    if (nome.trim() === '') {
      return res.status(400).json({ erro: 'O nome de usuário não pode ficar vazio.' })
    }
    const existe = await usuarios.findOne({ nome: nome.trim(), id: { $ne: id } })
    if (existe) {
      return res.status(409).json({ erro: 'Esse nome de usuário já está em uso.' })
    }
    // os posts antigos passam a mostrar o nome novo
    await posts.updateMany({ usuario: usuario.nome }, { $set: { usuario: nome.trim() } })
    mudancas.nome = nome.trim()
  }

  if (bio !== undefined) mudancas.bio = bio
  if (foto !== undefined) mudancas.foto = foto
  if (capa !== undefined) mudancas.capa = capa

  await usuarios.updateOne({ id }, { $set: mudancas })
  const atualizado = await usuarios.findOne({ id }, SEM_ID)
  res.json(publico(atualizado))
})

app.post('/cadastro', async (req, res) => {
  const { usuarios } = await conectar()
  const { nome, email, senha } = req.body

  if (!nome || nome.trim() === '' || !email || email.trim() === '' || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' })
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' })
  }
  if (await usuarios.findOne({ nome: nome.trim() })) {
    return res.status(409).json({ erro: 'Esse nome de usuário já está em uso.' })
  }
  if (await usuarios.findOne({ email: email.trim() })) {
    return res.status(409).json({ erro: 'Esse email já está cadastrado.' })
  }

  const novo = {
    id: Date.now(), nome: nome.trim(), email: email.trim(), senha: senha,
    bio: '', foto: 'https://placehold.co/300x300', seguidores: 0, seguindo: 0, link: '',
  }
  await usuarios.insertOne({ ...novo })
  res.status(201).json(publico(novo))
})

// erros viram uma resposta em JSON (em vez de derrubar o servidor)
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ erro: 'Erro no servidor. Confira a conexão com o banco.' })
})

// No computador: sobe o servidor. Na Vercel: só exporta o app.
if (!process.env.VERCEL) {
  const PORTA = process.env.PORT || 3000
  app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`)
  })
}

export default app
