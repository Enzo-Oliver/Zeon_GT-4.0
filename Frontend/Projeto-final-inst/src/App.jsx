import "bootstrap/dist/css/bootstrap.min.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./rotas/Login/Login";
import Cadastro from "./rotas/Login/Cadastro";
import Feed from "./rotas/Feed/Feed";
import Perfil from "./rotas/perfil/perfil";
import Configuracao from "./rotas/Configuracao/Configuracao";
import { RotaProtegida, RotaPublica } from "./componentes_globais/Rotas";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<RotaPublica><Login /></RotaPublica>} />
        <Route path="/cadastro" element={<RotaPublica><Cadastro /></RotaPublica>} />
        <Route path="/feed" element={<RotaProtegida><Feed /></RotaProtegida>} />
        <Route path="/perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />
        <Route path="/perfil/:nome" element={<RotaProtegida><Perfil /></RotaProtegida>} />
        <Route path="/configuracao" element={<RotaProtegida><Configuracao /></RotaProtegida>} />
        {/* qualquer endereço que não existe volta para o início */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
