import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import { put, del } from '@vercel/blob'
import { conectar, SEM_ID } from './banco.js'

const app = express()

app.use(cors())
// as fotos não vêm mais em base64 no JSON, então o limite pode ser pequeno
app.use(express.json({ limit: '100kb' }))

// ---------- Proteção contra NoSQL injection ----------
// Sem isso, mandar {"senha": {"$ne": null}} no login faria o MongoDB aceitar
// "qualquer senha" e entrar na conta de outra pessoa.
// Aqui qualquer chave que comece com "$" ou tenha "." é recusada.
function temOperador(valor) {
  if (Array.isArray(valor)) return valor.some(temOperador)
  if (valor && typeof valor === 'object') {
    return Object.keys(valor).some((k) => k.startsWith('$') || k.includes('.') || temOperador(valor[k]))
  }
  return false
}

app.use((req, res, next) => {
  if (temOperador(req.body) || temOperador(req.query)) {
    return res.status(400).json({ erro: 'Dados inválidos.' })
  }
  next()
})

// além disso, cada rota confere se os campos são texto mesmo
const ehTexto = (v) => typeof v === 'string'

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
// O site manda esse token em toda chamada (header "Authorization: Bearer <token>"),
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

// ---------- Fotos (Vercel Blob) ----------
// O site manda a foto em POST /imagens e recebe de volta um link (URL).
// Posts, stories e perfis guardam só esse link, não a imagem inteira.

const HOST_BLOB = '.public.blob.vercel-storage.com'

// só aceita fotos do nosso Blob (ou as imagens padrão do placehold.co)
function imagemValida(url) {
  if (!ehTexto(url)) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && (u.hostname.endsWith(HOST_BLOB) || u.hostname === 'placehold.co')
  } catch {
    return false
  }
}

async function apagarImagem(url) {
  if (!ehTexto(url) || !url.includes(HOST_BLOB)) return
  try {
    await del(url)
  } catch (err) {
    console.error('Não consegui apagar a foto do Blob:', err.message)
  }
}

// confere os primeiros bytes do arquivo (não basta confiar no tipo que o navegador diz)
function tipoDaImagem(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { ext: 'jpg', tipo: 'image/jpeg' }
  if (buffer.subarray(0, 4).toString('hex') === '89504e47') return { ext: 'png', tipo: 'image/png' }
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
    return { ext: 'webp', tipo: 'image/webp' }
  }
  return null
}

app.post(
  '/imagens',
  autenticar,
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '4mb' }),
  async (req, res) => {
    const arquivo = req.body
    const imagem = Buffer.isBuffer(arquivo) && arquivo.length > 0 && tipoDaImagem(arquivo)

    if (!imagem) {
      return res.status(400).json({ erro: 'Envie uma imagem JPG, PNG ou WebP.' })
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ erro: 'O armazenamento de fotos (Vercel Blob) não está configurado.' })
    }

    const caminho = `fotos/${req.usuario.id}/${crypto.randomUUID()}.${imagem.ext}`
    const blob = await put(caminho, arquivo, { access: 'public', contentType: imagem.tipo })
    res.status(201).json({ url: blob.url })
  },
)

app.get('/', (req, res) => {
  res.send('Olá! O servidor está funcionando.')
})

// ---------- Posts ----------

app.get('/posts', autenticar, async (req, res) => {
  const { usuarios, posts, comentarios } = await conectar()

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
      curtiu: (curtidoPor || []).includes(req.usuario.id),
      totalComentarios: totais[p.id] || 0,
    }
  })
  res.json(lista)
})

app.post('/posts', autenticar, bloquearModerador, async (req, res) => {
  const { posts } = await conectar()
  const { imagem } = req.body
  const texto = req.body.texto ?? ''

  if (!imagemValida(imagem)) {
    return res.status(400).json({ erro: 'Coloque a imagem do post.' })
  }
  if (!ehTexto(texto) || texto.length > 2200) {
    return res.status(400).json({ erro: 'A legenda pode ter no máximo 2200 caracteres.' })
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

// apagar: o autor do post ou um admin (os comentários e a foto vão junto)
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
  await apagarImagem(post.imagem)
  res.status(204).end()
})

// ---------- Comentários ----------

app.get('/posts/:id/comentarios', autenticar, async (req, res) => {
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
  const texto = ehTexto(req.body.texto) ? req.body.texto.trim() : ''

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

// stories com mais de 24h são apagados (junto com a foto no Blob)
async function limparStoriesVencidos(stories) {
  const limite = new Date(Date.now() - UM_DIA)
  const vencidos = await stories.find({ criadoEm: { $lt: limite } }, SEM_ID).toArray()
  if (vencidos.length === 0) return
  await stories.deleteMany({ id: { $in: vencidos.map((s) => s.id) } })
  await Promise.all(vencidos.map((s) => apagarImagem(s.imagem)))
}

// stories das últimas 24h, agrupados por usuário (quem postou por último vem primeiro)
app.get('/stories', autenticar, async (req, res) => {
  const { usuarios, stories } = await conectar()
  await limparStoriesVencidos(stories)

  const lista = await stories.find({}, SEM_ID).sort({ criadoEm: 1 }).toArray()
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

  if (!imagemValida(imagem)) {
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
  await apagarImagem(story.imagem)
  res.status(204).end()
})

// ---------- Usuários ----------

// Troca o nome de usuário (usado pela própria pessoa e pelo moderador).
// Os posts guardam o nome do autor, então eles mudam junto.
// Devolve um erro { status, erro } ou null se deu certo.
async function trocarNome(usuario, nome) {
  const { usuarios, posts } = await conectar()
  const novo = ehTexto(nome) ? nome.trim() : ''

  if (novo === '') return { status: 400, erro: 'O nome de usuário não pode ficar vazio.' }
  if (novo.length > 30) return { status: 400, erro: 'O nome de usuário pode ter no máximo 30 caracteres.' }
  if (await usuarios.findOne({ nome: novo, id: { $ne: usuario.id } })) {
    return { status: 409, erro: 'Esse nome de usuário já está em uso.' }
  }

  await usuarios.updateOne({ id: usuario.id }, { $set: { nome: novo } })
  await posts.updateMany({ usuario: usuario.nome }, { $set: { usuario: novo } })
  return null
}

// Apaga a conta e tudo o que é dela: posts (com os comentários deles), stories,
// comentários, curtidas, sessões e as fotos guardadas no Blob.
async function apagarUsuario(usuario) {
  const { usuarios, posts, stories, sessoes, comentarios } = await conectar()

  const seusPosts = await posts.find({ usuario: usuario.nome }, SEM_ID).toArray()
  const seusStories = await stories.find({ usuarioId: usuario.id }, SEM_ID).toArray()

  await comentarios.deleteMany({ postId: { $in: seusPosts.map((p) => p.id) } })
  await comentarios.deleteMany({ usuarioId: usuario.id })
  await posts.deleteMany({ usuario: usuario.nome })
  await stories.deleteMany({ usuarioId: usuario.id })
  // tira as curtidas que a pessoa deu nos posts dos outros
  await posts.updateMany({ curtidoPor: usuario.id }, { $pull: { curtidoPor: usuario.id }, $inc: { curtidas: -1 } })
  await sessoes.deleteMany({ usuarioId: usuario.id })
  await usuarios.deleteOne({ id: usuario.id })

  const fotos = [usuario.foto, usuario.capa, ...seusPosts.map((p) => p.imagem), ...seusStories.map((s) => s.imagem)]
  await Promise.all(fotos.map(apagarImagem))
}

// só o moderador passa daqui
function somenteModerador(req, res, next) {
  if (!req.usuario.admin) {
    return res.status(403).json({ erro: 'Só a moderação pode fazer isso.' })
  }
  next()
}

app.post('/login', async (req, res) => {
  const { usuarios } = await conectar()
  const { email, senha } = req.body

  if (!ehTexto(email) || !ehTexto(senha)) {
    return res.status(400).json({ erro: 'Preencha email e senha.' })
  }

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

app.get('/usuarios/:nome', autenticar, async (req, res) => {
  const { usuarios } = await conectar()
  const usuario = await usuarios.findOne({ nome: req.params.nome }, SEM_ID)

  // o perfil da conta de moderação só aparece para ela mesma
  const escondido = usuario?.admin && req.usuario.id !== usuario.id

  if (!usuario || escondido) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' })
  }

  res.json({ ...publico(usuario), capa: usuario.capa ?? '' })
})

// configurações: nome, bio, foto e capa (cada um só edita o próprio perfil)
app.patch('/usuarios/:id', autenticar, async (req, res) => {
  const { usuarios } = await conectar()
  const id = Number(req.params.id)

  if (id !== req.usuario.id) {
    return res.status(403).json({ erro: 'Você só pode editar o seu próprio perfil.' })
  }
  const usuario = req.usuario

  const { nome, bio, foto, capa } = req.body
  const mudancas = {}

  for (const campo of [nome, bio, foto, capa]) {
    if (campo !== undefined && !ehTexto(campo)) {
      return res.status(400).json({ erro: 'Dados inválidos.' })
    }
  }

  if (nome !== undefined && nome.trim() !== usuario.nome) {
    const problema = await trocarNome(usuario, nome)
    if (problema) return res.status(problema.status).json({ erro: problema.erro })
    mudancas.nome = nome.trim()
  }

  if (bio !== undefined) mudancas.bio = bio.slice(0, 300)

  // foto e capa: só aceita link do nosso Blob (a capa também pode ser removida com "")
  if (foto !== undefined && foto !== usuario.foto) {
    if (!imagemValida(foto)) return res.status(400).json({ erro: 'Foto de perfil inválida.' })
    mudancas.foto = foto
  }
  if (capa !== undefined && capa !== (usuario.capa ?? '')) {
    if (capa !== '' && !imagemValida(capa)) return res.status(400).json({ erro: 'Foto de capa inválida.' })
    mudancas.capa = capa
  }

  await usuarios.updateOne({ id }, { $set: mudancas })

  // apaga do Blob as fotos antigas que foram trocadas
  if (mudancas.foto !== undefined) await apagarImagem(usuario.foto)
  if (mudancas.capa !== undefined) await apagarImagem(usuario.capa)

  const atualizado = await usuarios.findOne({ id }, SEM_ID)
  res.json(publico(atualizado))
})

// ---------- Conta (só a própria pessoa vê) ----------

app.get('/conta', autenticar, (req, res) => {
  res.json({ email: req.usuario.email })
})

// trocar senha: precisa confirmar a senha atual
app.patch('/conta/senha', autenticar, async (req, res) => {
  const { usuarios, sessoes } = await conectar()
  const { senhaAtual, novaSenha } = req.body

  if (!ehTexto(senhaAtual) || senhaAtual !== req.usuario.senha) {
    return res.status(400).json({ erro: 'A senha atual está errada.' })
  }
  if (!ehTexto(novaSenha) || novaSenha.length < 6) {
    return res.status(400).json({ erro: 'A nova senha precisa ter pelo menos 6 caracteres.' })
  }
  if (novaSenha === senhaAtual) {
    return res.status(400).json({ erro: 'A nova senha precisa ser diferente da atual.' })
  }

  await usuarios.updateOne({ id: req.usuario.id }, { $set: { senha: novaSenha } })
  // desconecta a conta dos outros aparelhos (continua logado só neste)
  await sessoes.deleteMany({ usuarioId: req.usuario.id, token: { $ne: req.token } })
  res.json({ ok: true })
})

// apagar a própria conta: precisa confirmar a senha
app.delete('/conta', autenticar, async (req, res) => {
  const { senha } = req.body ?? {}

  if (req.usuario.admin) {
    return res.status(403).json({ erro: 'A conta de moderação não pode ser apagada pelo site.' })
  }
  if (!ehTexto(senha) || senha !== req.usuario.senha) {
    return res.status(400).json({ erro: 'Senha errada.' })
  }

  await apagarUsuario(req.usuario)
  res.status(204).end()
})

// ---------- Moderação ----------

// busca o usuário alvo (a conta de moderação não pode ser alvo)
async function alvoDaModeracao(req, res) {
  const { usuarios } = await conectar()
  const usuario = await usuarios.findOne({ id: Number(req.params.id) }, SEM_ID)
  if (!usuario || usuario.admin) {
    res.status(404).json({ erro: 'Usuário não encontrado.' })
    return null
  }
  return usuario
}

// moderador troca o nome de outra pessoa (ex.: nome ofensivo)
app.patch('/moderacao/usuarios/:id', autenticar, somenteModerador, async (req, res) => {
  const usuario = await alvoDaModeracao(req, res)
  if (!usuario) return

  const problema = await trocarNome(usuario, req.body.nome)
  if (problema) return res.status(problema.status).json({ erro: problema.erro })

  const { usuarios } = await conectar()
  res.json(publico(await usuarios.findOne({ id: usuario.id }, SEM_ID)))
})

// moderador apaga a conta de outra pessoa
app.delete('/moderacao/usuarios/:id', autenticar, somenteModerador, async (req, res) => {
  const usuario = await alvoDaModeracao(req, res)
  if (!usuario) return

  await apagarUsuario(usuario)
  res.status(204).end()
})

app.post('/cadastro', async (req, res) => {
  const { usuarios } = await conectar()
  const { nome, email, senha } = req.body

  if (!ehTexto(nome) || !ehTexto(email) || !ehTexto(senha) || nome.trim() === '' || email.trim() === '') {
    return res.status(400).json({ erro: 'Preencha todos os campos.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ erro: 'Digite um email válido.' })
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' })
  }
  if (nome.trim().length > 30) {
    return res.status(400).json({ erro: 'O nome de usuário pode ter no máximo 30 caracteres.' })
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
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Arquivo grande demais.' })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'Dados inválidos.' })
  }
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
