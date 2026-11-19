// Troca as senhas antigas (guardadas em texto puro) por hash bcrypt.
// Ninguém precisa trocar de senha: cada um continua entrando com a mesma senha.
//
// Uso (dentro da pasta Backend, com MONGODB_URI no .env):
//   node --env-file=.env migrar-senhas.js --simular   -> só mostra quantas senhas seriam convertidas
//   node --env-file=.env migrar-senhas.js             -> converte de verdade

import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

const simular = process.argv.includes('--simular')
const ehHash = (s) => typeof s === 'string' && /^\$2[aby]\$\d{2}\$/.test(s)

if (!process.env.MONGODB_URI) {
  console.log('Falta MONGODB_URI no .env')
  process.exit(1)
}

const cliente = new MongoClient(process.env.MONGODB_URI)
const banco = process.env.MONGODB_DB || 'zeon'

try {
  await cliente.connect()
  const usuarios = cliente.db(banco).collection('usuarios')
  console.log(`Banco: ${banco}${simular ? ' (simulação, nada será alterado)' : ''}\n`)

  const todos = await usuarios.find({}, { projection: { _id: 0, id: 1, nome: 1, senha: 1 } }).toArray()
  const antigas = todos.filter((u) => typeof u.senha === 'string' && !ehHash(u.senha))

  for (const u of antigas) {
    if (!simular) {
      await usuarios.updateOne({ id: u.id }, { $set: { senha: await bcrypt.hash(u.senha, 10) } })
    }
    console.log(`- @${u.nome}`)
  }

  console.log(`\n${todos.length} usuário(s); ${todos.length - antigas.length} já com hash.`)
  console.log(`${simular ? 'Seriam convertidas' : 'Convertidas'}: ${antigas.length} senha(s).`)
} finally {
  await cliente.close()
}
