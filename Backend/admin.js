// Dá ou tira o poder de administrador de um usuário.
//
// Uso (dentro da pasta Backend):
//   node --env-file=.env admin.js email@exemplo.com            -> vira admin
//   node --env-file=.env admin.js email@exemplo.com --remover  -> deixa de ser admin
//   node --env-file=.env admin.js --listar                     -> mostra quem é admin

import { MongoClient } from 'mongodb'

const [, , email, opcao] = process.argv

if (!process.env.MONGODB_URI) {
  console.log('Falta a variável MONGODB_URI. Rode com: node --env-file=.env admin.js ...')
  process.exit(1)
}

const cliente = new MongoClient(process.env.MONGODB_URI)
const banco = process.env.MONGODB_DB || 'zeon'

try {
  await cliente.connect()
  const usuarios = cliente.db(banco).collection('usuarios')
  console.log(`Banco: ${banco}`)

  if (!email || email === '--listar') {
    const admins = await usuarios.find({ admin: true }).project({ _id: 0, nome: 1, email: 1 }).toArray()
    console.log(admins.length ? admins.map((a) => `- @${a.nome} (${a.email})`).join('\n') : 'Nenhum admin ainda.')
  } else {
    const remover = opcao === '--remover'
    const resultado = await usuarios.updateOne({ email }, { $set: { admin: !remover } })

    if (resultado.matchedCount === 0) {
      console.log(`Nenhum usuário com o email ${email}.`)
      process.exitCode = 1
    } else {
      console.log(remover ? `${email} não é mais admin.` : `${email} agora é admin.`)
      console.log('A pessoa precisa sair e entrar de novo no site para ver os botões de admin.')
    }
  }
} finally {
  await cliente.close()
}
