// Move as fotos antigas (guardadas em base64 dentro do MongoDB) para o Vercel Blob.
// Cada foto vira um arquivo no Blob e o banco passa a guardar só o link.
//
// Uso (dentro da pasta Backend, com MONGODB_URI e BLOB_READ_WRITE_TOKEN no .env):
//   node --env-file=.env migrar-imagens.js --simular   -> só mostra quantas fotos seriam migradas
//   node --env-file=.env migrar-imagens.js             -> migra de verdade

import { MongoClient } from 'mongodb'
import { put } from '@vercel/blob'
import crypto from 'crypto'

const simular = process.argv.includes('--simular')

if (!process.env.MONGODB_URI) {
  console.log('Falta MONGODB_URI no .env')
  process.exit(1)
}
if (!simular && !process.env.BLOB_READ_WRITE_TOKEN) {
  console.log('Falta BLOB_READ_WRITE_TOKEN no .env (pegue em Vercel > Storage > seu Blob Store)')
  process.exit(1)
}

// onde procurar fotos: coleção -> campos com imagem
const ALVOS = {
  usuarios: ['foto', 'capa'],
  posts: ['imagem'],
  stories: ['imagem'],
}

async function subir(dataUrl, pasta) {
  const [cabecalho, base64] = dataUrl.split(',')
  const tipo = cabecalho.match(/data:(image\/[a-z]+)/)?.[1] || 'image/jpeg'
  const ext = tipo.split('/')[1].replace('jpeg', 'jpg')
  const blob = await put(`fotos/${pasta}/${crypto.randomUUID()}.${ext}`, Buffer.from(base64, 'base64'), {
    access: 'public',
    contentType: tipo,
  })
  return blob.url
}

const cliente = new MongoClient(process.env.MONGODB_URI)
const banco = process.env.MONGODB_DB || 'zeon'

try {
  await cliente.connect()
  const db = cliente.db(banco)
  console.log(`Banco: ${banco}${simular ? ' (simulação, nada será alterado)' : ''}\n`)

  let total = 0
  let bytes = 0

  for (const [colecao, campos] of Object.entries(ALVOS)) {
    const filtro = { $or: campos.map((c) => ({ [c]: { $regex: '^data:image' } })) }
    const docs = await db.collection(colecao).find(filtro).toArray()

    for (const doc of docs) {
      const mudancas = {}
      for (const campo of campos) {
        const valor = doc[campo]
        if (typeof valor !== 'string' || !valor.startsWith('data:image')) continue
        bytes += valor.length
        total++
        if (!simular) {
          const pasta = colecao === 'usuarios' ? doc.id : doc.usuarioId ?? doc.usuario ?? 'antigas'
          mudancas[campo] = await subir(valor, pasta)
        }
      }
      if (!simular && Object.keys(mudancas).length) {
        await db.collection(colecao).updateOne({ _id: doc._id }, { $set: mudancas })
        console.log(`- ${colecao} ${doc.id}: ${Object.keys(mudancas).join(', ')} migrado`)
      }
    }
    console.log(`${colecao}: ${docs.length} documento(s) com foto em base64`)
  }

  const mb = (bytes / 1024 / 1024).toFixed(1)
  console.log(`\n${simular ? 'Seriam migradas' : 'Migradas'}: ${total} foto(s), cerca de ${mb} MB que saem do MongoDB.`)
} finally {
  await cliente.close()
}
