import type { Product } from "@/lib/estoque";

function baixarArquivo(conteudo: BlobPart, nome: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function dataArquivo() {
  return new Date().toISOString().slice(0, 10);
}

// Exporta CSV (abre no Excel) — separador ; para compatibilidade com Excel pt-BR
export function exportarCSV(produtos: Product[], apenasRepor: boolean) {
  const linhas = [
    ["Codigo", "Produto", "Fabricante", "Tipo", "Quantidade", "Minimo", "Falta", "Status"],
    ...produtos.map((p) => {
      const falta = Math.max(0, p.minimo - p.quantidade);
      return [
        p.codigo,
        p.produto,
        p.fabricante,
        p.tipo,
        String(p.quantidade),
        String(p.minimo),
        String(falta),
        p.quantidade < p.minimo ? "Repor" : "OK",
      ];
    }),
  ];
  const csv = linhas
    .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  // BOM para acentuação correta no Excel
  baixarArquivo(
    "\uFEFF" + csv,
    `estoque${apenasRepor ? "-repor" : ""}-${dataArquivo()}.csv`,
    "text/csv;charset=utf-8;",
  );
}

// jsPDF/autotable são bibliotecas grandes: carregadas sob demanda (dynamic import)
// para não pesar no bundle inicial e melhorar o tempo de carregamento/PageSpeed.
export async function exportarPDF(produtos: Product[], apenasRepor: boolean) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF();
  const titulo = apenasRepor ? "Itens que precisam de reposição" : "Relatório de estoque";

  doc.setFontSize(16);
  doc.text(titulo, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Controle de Inventário — By Francisco Chagas`, 14, 25);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 30);

  autoTable(doc, {
    startY: 36,
    head: [["Código", "Produto", "Fabricante", "Qtd.", "Mín.", "Falta", "Status"]],
    body: produtos.map((p) => {
      const falta = Math.max(0, p.minimo - p.quantidade);
      return [
        p.codigo,
        p.produto,
        p.fabricante,
        p.quantidade.toLocaleString("pt-BR"),
        p.minimo.toLocaleString("pt-BR"),
        falta.toLocaleString("pt-BR"),
        p.quantidade < p.minimo ? "Repor" : "OK",
      ];
    }),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [22, 163, 74] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 6 && data.cell.raw === "Repor") {
        data.cell.styles.textColor = [185, 28, 28];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  doc.save(`estoque${apenasRepor ? "-repor" : ""}-${dataArquivo()}.pdf`);
}
