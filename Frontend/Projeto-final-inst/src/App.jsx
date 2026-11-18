import "bootstrap/dist/css/bootstrap.min.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./rotas/Login/Login";
import Cadastro from "./rotas/Login/Cadastro";
import Feed from "./rotas/Feed/Feed";
import Perfil from "./rotas/perfil/perfil";
import Configuracao from "./rotas/Configuracao/Configuracao";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/configuracao" element={<Configuracao />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
