import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
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
    admin: u.admin === true,
  }
}

// ---------- Login com token ----------
// No login/cadastro o servidor cria um token secreto e devolve junto com o usuário.
// O site manda esse token em toda ação (header "Authorization: Bearer <token>"),
// assim o servidor sabe de verdade quem está fazendo cada coisa.

async function criarSessao(usuario) {
  const { sessoes } = await conectar()
  const token = crypto.randomBytes(32).toString('hex')
  await sessoes.insertOne({ token, usuarioId: usuario.id, criadoEm: new Date() })
  return token
}

async function autenticar(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) {
    return res.status(401).json({ erro: 'Faça login para continuar.' })
  }

  const { sessoes, usuarios } = await conectar()
  const sessao = await sessoes.findOne({ token })
  const usuario = sessao && (await usuarios.findOne({ id: sessao.usuarioId }, SEM_ID))

  if (!usuario) {
    return res.status(401).json({ erro: 'Sua sessão expirou. Entre de novo.' })
  }

  req.usuario = usuario
  req.token = token
  next()
}

// quem está logado, se mandou token (para rotas abertas a todos)
async function quemEsta(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return null
  const { sessoes, usuarios } = await conectar()
  const sessao = await sessoes.findOne({ token })
  return sessao ? usuarios.findOne({ id: sessao.usuarioId }, SEM_ID) : null
}

// a conta de moderação é invisível: não posta, não curte, não comenta e não tem story
function bloquearModerador(req, res, next) {
  if (req.usuario.admin) {
    return res.status(403).json({ erro: 'A conta de moderação não publica nada na rede social.' })
  }
  next()
}

// pode apagar: o dono da coisa ou um administrador
function podeApagar(usuario, donoId) {
  return usuario.admin === true || usuario.id === donoId
}

app.get('/', (req, res) => {
  res.send('Olá! O servidor está funcionando.')
})

// ---------- Posts ----------

app.get('/posts', async (req, res) => {
  const { usuarios, posts, comentarios } = await conectar()
  const usuarioId = Number(req.query.usuarioId)

  const todos = await posts.find({}, SEM_ID).sort({ id: 1 }).toArray()
  const autores = await usuarios.find({}, { projection: { _id: 0, nome: 1, foto: 1 } }).toArray()
  const fotos = {}
  autores.forEach((a) => { fotos[a.nome] = a.foto })

  // quantos comentários cada post tem
  const contagem = await comentarios.aggregate([{ $group: { _id: '$postId', total: { $sum: 1 } } }]).toArray()
  const totais = {}
  contagem.forEach((c) => { totais[c._id] = c.total })

  const lista = todos.map((p) => {
    const { curtidoPor, ...resto } = p
    return {
      ...resto,
      foto: fotos[p.usuario] || 'https://placehold.co/100x100',
      curtiu: (curtidoPor || []).includes(usuarioId),
      totalComentarios: totais[p.id] || 0,
    }
  })
  res.json(lista)
})

app.post('/posts', autenticar, bloquearModerador, async (req, res) => {
  const { posts } = await conectar()
  const { imagem, texto } = req.body

  if (!imagem || imagem.trim() === '') {
    return res.status(400).json({ erro: 'Coloque a imagem do post.' })
  }

  const novo = {
    id: Date.now(), usuario: req.usuario.nome, imagem, texto, curtidas: 0, curtidoPor: [],
    criadoEm: new Date().toISOString(),
  }
  await posts.insertOne({ ...novo })
  const { curtidoPor, ...resposta } = novo
  res.status(201).json(resposta)
})

// curtir / descurtir
app.patch('/posts/:id', autenticar, bloquearModerador, async (req, res) => {
  const { posts } = await conectar()
  const id = Number(req.params.id)
  const post = await posts.findOne({ id }, SEM_ID)

  if (!post) {
    return res.status(404).json({ erro: 'Post não encontrado.' })
  }

  const usuarioId = req.usuario.id
  let curtidoPor = post.curtidoPor || []
  let curtidas = post.curtidas

  if (curtidoPor.includes(usuarioId)) {
    curtidoPor = curtidoPor.filter((i) => i !== usuarioId)
    curtidas = Math.max(0, curtidas - 1)
  } else {
    curtidoPor = [...curtidoPor, usuarioId]
    curtidas = curtidas + 1
  }

  await posts.updateOne({ id }, { $set: { curtidas, curtidoPor } })
  res.json({ id, curtidas, curtiu: curtidoPor.includes(usuarioId) })
})

// apagar: o autor do post ou um admin (os comentários do post vão junto)
app.delete('/posts/:id', autenticar, async (req, res) => {
  const { posts, comentarios } = await conectar()
  const id = Number(req.params.id)
  const post = await posts.findOne({ id }, SEM_ID)

  if (!post) {
    return res.status(404).json({ erro: 'Post não encontrado.' })
  }
  if (!req.usuario.admin && post.usuario !== req.usuario.nome) {
    return res.status(403).json({ erro: 'Você não pode apagar o post de outra pessoa.' })
  }

  await posts.deleteOne({ id })
  await comentarios.deleteMany({ postId: id })
  res.status(204).end()
})

// ---------- Comentários ----------

app.get('/posts/:id/comentarios', async (req, res) => {
  const { usuarios, comentarios } = await conectar()
  const lista = await comentarios.find({ postId: Number(req.params.id) }, SEM_ID).sort({ id: 1 }).toArray()

  const ids = [...new Set(lista.map((c) => c.usuarioId))]
  const autores = await usuarios.find({ id: { $in: ids } }, SEM_ID).toArray()
  const porId = {}
  autores.forEach((a) => { porId[a.id] = a })

  res.json(lista.map((c) => ({
    id: c.id,
    texto: c.texto,
    criadoEm: c.criadoEm,
    usuarioId: c.usuarioId,
    usuario: porId[c.usuarioId]?.nome ?? 'usuário removido',
    foto: porId[c.usuarioId] ? publico(porId[c.usuarioId]).foto : 'https://placehold.co/100x100',
  })))
})

app.post('/posts/:id/comentarios', autenticar, bloquearModerador, async (req, res) => {
  const { posts, comentarios } = await conectar()
  const postId = Number(req.params.id)
  const texto = (req.body.texto || '').trim()

  if (texto === '') {
    return res.status(400).json({ erro: 'Escreva alguma coisa no comentário.' })
  }
  if (texto.length > 500) {
    return res.status(400).json({ erro: 'O comentário pode ter no máximo 500 caracteres.' })
  }
  if (!(await posts.findOne({ id: postId }))) {
    return res.status(404).json({ erro: 'Post não encontrado.' })
  }

  const novo = { id: Date.now(), postId, usuarioId: req.usuario.id, texto, criadoEm: new Date().toISOString() }
  await comentarios.insertOne({ ...novo })
  res.status(201).json({ ...novo, usuario: req.usuario.nome, foto: publico(req.usuario).foto })
})

// apagar comentário: quem escreveu, o dono do post ou um admin
app.delete('/comentarios/:id', autenticar, async (req, res) => {
  const { posts, comentarios } = await conectar()
  const id = Number(req.params.id)
  const comentario = await comentarios.findOne({ id }, SEM_ID)

  if (!comentario) {
    return res.status(404).json({ erro: 'Comentário não encontrado.' })
  }

  const post = await posts.findOne({ id: comentario.postId }, SEM_ID)
  const donoDoPost = post && post.usuario === req.usuario.nome
  if (!donoDoPost && !podeApagar(req.usuario, comentario.usuarioId)) {
    return res.status(403).json({ erro: 'Você não pode apagar esse comentário.' })
  }

  await comentarios.deleteOne({ id })
  res.status(204).end()
})

// ---------- Stories ----------

const UM_DIA = 24 * 60 * 60 * 1000

// stories das últimas 24h, agrupados por usuário (quem postou por último vem primeiro)
app.get('/stories', async (req, res) => {
  const { usuarios, stories } = await conectar()
  const desde = new Date(Date.now() - UM_DIA)

  const lista = await stories.find({ criadoEm: { $gte: desde } }, SEM_ID).sort({ criadoEm: 1 }).toArray()
  const ids = [...new Set(lista.map((s) => s.usuarioId))]
  const autores = await usuarios.find({ id: { $in: ids } }, SEM_ID).toArray()

  const grupos = autores.map((u) => {
    const itens = lista
      .filter((s) => s.usuarioId === u.id)
      .map((s) => ({ id: s.id, imagem: s.imagem, criadoEm: s.criadoEm }))
    return { usuarioId: u.id, usuario: u.nome, foto: publico(u).foto, itens }
  })

  grupos.sort((a, b) => new Date(b.itens.at(-1).criadoEm) - new Date(a.itens.at(-1).criadoEm))
  res.json(grupos)
})

app.post('/stories', autenticar, bloquearModerador, async (req, res) => {
  const { stories } = await conectar()
  const { imagem } = req.body

  if (!imagem || imagem.trim() === '') {
    return res.status(400).json({ erro: 'Escolha uma foto para o story.' })
  }

  const novo = { id: Date.now(), usuarioId: req.usuario.id, imagem, criadoEm: new Date() }
  await stories.insertOne({ ...novo })
  res.status(201).json(novo)
})

// apagar story: o dono ou um admin
app.delete('/stories/:id', autenticar, async (req, res) => {
  const { stories } = await conectar()
  const id = Number(req.params.id)
  const story = await stories.findOne({ id }, SEM_ID)

  if (!story) {
    return res.status(404).json({ erro: 'Story não encontrado.' })
  }
  if (!podeApagar(req.usuario, story.usuarioId)) {
    return res.status(403).json({ erro: 'Você não pode apagar o story de outra pessoa.' })
  }

  await stories.deleteOne({ id })
  res.status(204).end()
})

// ---------- Usuários ----------

app.post('/login', async (req, res) => {
  const { usuarios } = await conectar()
  const { email, senha } = req.body
  const usuario = await usuarios.findOne({ email, senha }, SEM_ID)

  if (!usuario) {
    return res.status(401).json({ erro: 'Email ou senha errados.' })
  }

  res.json({ ...publico(usuario), token: await criarSessao(usuario) })
})

app.post('/logout', autenticar, async (req, res) => {
  const { sessoes } = await conectar()
  await sessoes.deleteOne({ token: req.token })
  res.status(204).end()
})

app.get('/usuarios/:nome', async (req, res) => {
  const { usuarios } = await conectar()
  const usuario = await usuarios.findOne({ nome: req.params.nome }, SEM_ID)

  // o perfil da conta de moderação só aparece para ela mesma
  const escondido = usuario?.admin && (await quemEsta(req))?.id !== usuario.id

  if (!usuario || escondido) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' })
  }

  res.json({ ...publico(usuario), capa: usuario.capa ?? '' })
})

// configurações: nome, bio, foto e capa (cada um só edita o próprio perfil)
app.patch('/usuarios/:id', autenticar, async (req, res) => {
  const { usuarios, posts } = await conectar()
  const id = Number(req.params.id)

  if (id !== req.usuario.id) {
    return res.status(403).json({ erro: 'Você só pode editar o seu próprio perfil.' })
  }
  const usuario = req.usuario

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
  res.status(201).json({ ...publico(novo), token: await criarSessao(novo) })
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
