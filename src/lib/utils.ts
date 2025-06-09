// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina nomes de classe do Tailwind CSS de forma inteligente,
 * evitando conflitos (ex: `px-2` e `px-4` juntos).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gera um nome de usuário simples a partir do nome completo.
 * Remove espaços, acentos, caracteres especiais e converte para minúsculas.
 * @param {string} fullName - O nome completo do usuário.
 * @returns {string} Um nome de usuário gerado.
 */
export function generateUsername(fullName: string): string {
  if (!fullName) return "";

  // Normaliza a string para decompor acentos e caracteres combinados
  return fullName
    .normalize("NFD") // NFD = Normalization Form Decomposed
    .replace(/[\u0300-\u036f]/g, "") // Remove os diacríticos (acentos)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_") // Substitui espaços por underscores
    .replace(/[^\w-]/g, ""); // Remove todos os caracteres que não são letras, números, underscore ou hífen
}