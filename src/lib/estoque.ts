export type Category = {
  id: string;
  nome: string;
  icon: string;
  termo: string;
};

export type Product = {
  id: string;
  codigo: string;
  fabricante: string;
  tipo: string;
  produto: string;
  quantidade: number;
  minimo: number;
};

export type Movement = {
  id: string;
  produto_nome: string;
  codigo: string;
  acao: string;
  delta: number;
  quantidade_anterior: number;
  quantidade_nova: number;
  created_at: string;
};

export const MINIMO_PADRAO = 500;

// Produtos de exemplo (carregados sob demanda na primeira utilização)
export const PRODUTOS_EXEMPLO: Omit<Product, "id">[] = [
  { codigo: "6163", fabricante: "DELPHI", tipo: "Fabricante", produto: "Injeção/ignição", quantidade: 100, minimo: MINIMO_PADRAO },
  { codigo: "4843", fabricante: "ELGIN S/A", tipo: "Fabricante", produto: "Pilhas", quantidade: 200, minimo: MINIMO_PADRAO },
  { codigo: "115", fabricante: "EQUIPAGE/EQMAX", tipo: "Fabricante", produto: "Racks de teto", quantidade: 300, minimo: MINIMO_PADRAO },
  { codigo: "2370", fabricante: "FILTROS BRASIL", tipo: "Fabricante", produto: "Filtros cabine", quantidade: 400, minimo: MINIMO_PADRAO },
  { codigo: "6405", fabricante: "Flash Cover Capota Marítima", tipo: "Fabricante", produto: "Capota Marítima", quantidade: 500, minimo: MINIMO_PADRAO },
  { codigo: "3115", fabricante: "GRID CALOTAS", tipo: "Fabricante", produto: "Calotas", quantidade: 600, minimo: MINIMO_PADRAO },
  { codigo: "2561", fabricante: "H BUSTER", tipo: "Fabricante", produto: "Mídia/tela", quantidade: 700, minimo: MINIMO_PADRAO },
  { codigo: "355", fabricante: "HENKEL LTDA", tipo: "Fabricante", produto: "Cola/adesivos", quantidade: 800, minimo: MINIMO_PADRAO },
  { codigo: "8047", fabricante: "M3 capas", tipo: "Fabricante", produto: "Capas de volante", quantidade: 900, minimo: MINIMO_PADRAO },
  { codigo: "1497", fabricante: "Magneti Marelli", tipo: "Fabricante", produto: "Bobinas/vela", quantidade: 1000, minimo: MINIMO_PADRAO },
  { codigo: "3102", fabricante: "MULTILASER", tipo: "Fabricante", produto: "Multimídia", quantidade: 2000, minimo: MINIMO_PADRAO },
  { codigo: "953", fabricante: "NP ADESIVOS", tipo: "Fabricante", produto: "Adesivos", quantidade: 3000, minimo: MINIMO_PADRAO },
  { codigo: "2389", fabricante: "PETROBRAS (BR)", tipo: "Fabricante", produto: "Lubrificantes", quantidade: 4000, minimo: MINIMO_PADRAO },
  { codigo: "4768", fabricante: "PHILCO", tipo: "Fabricante", produto: "Pilhas/Aparelhos eletrônicos", quantidade: 5000, minimo: MINIMO_PADRAO },
  { codigo: "56", fabricante: "PIONEER", tipo: "Fabricante", produto: "Som automotivo", quantidade: 6000, minimo: MINIMO_PADRAO },
  { codigo: "1751", fabricante: "ROADSTAR", tipo: "Fabricante", produto: "Display/Telas som", quantidade: 7000, minimo: MINIMO_PADRAO },
  { codigo: "7436", fabricante: "SAINT-GOBAIN DISTRI BRASIL LTDA", tipo: "Fabricante", produto: "Caixa de som/Fones", quantidade: 8000, minimo: MINIMO_PADRAO },
  { codigo: "6127", fabricante: "SUPORTE REI", tipo: "Fabricante", produto: "Suporte/Linha pesada", quantidade: 9000, minimo: MINIMO_PADRAO },
  { codigo: "4000", fabricante: "TEC FIL", tipo: "Fabricante", produto: "Filtros de ar", quantidade: 1000, minimo: MINIMO_PADRAO },
  { codigo: "362", fabricante: "WEGA MOTORS", tipo: "Fabricante", produto: "Filtros/Palhetas", quantidade: 2000, minimo: MINIMO_PADRAO },
];

export const CATEGORIAS_EXEMPLO: Omit<Category, "id">[] = [
  { nome: "Filtros de ar", icon: "🌀", termo: "filtro" },
  { nome: "Mídia Player", icon: "📺", termo: "mídia" },
  { nome: "Calotas", icon: "🛞", termo: "calota" },
  { nome: "Palhetas", icon: "🧹", termo: "palheta" },
];

export const ACAO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste",
  completar: "Completou estoque",
  zerar: "Zerou estoque",
  criar: "Produto criado",
  editar: "Produto editado",
  excluir: "Produto excluído",
};
