import { Navigate } from "react-router-dom";

import { usuarioLogado } from "../api";

// Só deixa entrar quem fez login; os outros voltam para o /login
export function RotaProtegida({ children }) {
  if (!usuarioLogado()?.token) return <Navigate to="/login" replace />;
  return children;
}

// Login e cadastro: quem já está logado vai direto para o feed
export function RotaPublica({ children }) {
  if (usuarioLogado()?.token) return <Navigate to="/feed" replace />;
  return children;
}
