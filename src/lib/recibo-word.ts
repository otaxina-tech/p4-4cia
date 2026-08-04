import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  ShadingType,
} from "docx";
import type { Recibo } from "@/hooks/use-recibos";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function porExtenso(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

async function carregarImagem(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

const linhaCabecalho = (texto: string) =>
  new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: texto, bold: true, size: 26, font: "Times New Roman" })],
  });

const semBorda = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const borda = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const bordas = { top: borda, bottom: borda, left: borda, right: borda };

function celula(texto: string, largura: number) {
  return new TableCell({
    borders: bordas,
    width: { size: largura, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
    children: [
      new Paragraph({
        children: [new TextRun({ text: texto, size: 24, font: "Times New Roman" })],
      }),
    ],
  });
}

export async function gerarReciboWord(r: Recibo) {
  const [brasao, selo] = await Promise.all([
    carregarImagem("/pm-brasao.jpg"),
    carregarImagem("/pm-selo.jpg"),
  ]);

  const cabecalho = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2600, 6760],
    borders: {
      ...semBorda,
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: semBorda,
            width: { size: 2600, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    type: "jpg",
                    data: brasao,
                    transformation: { width: 105, height: 115 },
                    altText: { title: "Brasão", description: "Brasão PMESP", name: "brasao" },
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120 },
                children: [
                  new TextRun({
                    text: "www.policiamilitar.sp.gov.br",
                    size: 16,
                    font: "Times New Roman",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "9bpmm4ciap4@policiamilitar.sp.gov.br",
                    size: 16,
                    color: "0000FF",
                    underline: {},
                    font: "Times New Roman",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [
                  new ImageRun({
                    type: "jpg",
                    data: selo,
                    transformation: { width: 78, height: 96 },
                    altText: { title: "Selo", description: "Selo de qualidade", name: "selo" },
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: semBorda,
            width: { size: 6760, type: WidthType.DXA },
            children: [
              linhaCabecalho("SECRETARIA DA SEGURANÇA PÚBLICA"),
              linhaCabecalho("POLÍCIA MILITAR DO ESTADO DE SÃO PAULO"),
              linhaCabecalho("9º BPM/M- 4ª CIA-P/4"),
              linhaCabecalho(`RECIBO Nº 9BPM/M ${r.codigo}`),
            ],
          }),
        ],
      }),
    ],
  });

  const itens = r.itens.map(
    (i, n) =>
      new Paragraph({
        numbering: { reference: "itens", level: 0 },
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: `${i.material}${i.observacoes ? `, ${i.observacoes}` : ""}${n === r.itens.length - 1 ? "." : ";"}`,
            size: 24,
            font: "Times New Roman",
          }),
        ],
      }),
  );

            size: 24,
            font: "Times New Roman",
          }),
        ],
      }),
  );

  const assinaturas = new Table({
    width: { size: 7500, type: WidthType.DXA },
    columnWidths: [3750, 3750],
    rows: [
      new TableRow({
        children: [
          celula(`Entregue por: ${r.responsavel || ""}`, 3750),
          celula(`Recebido por: ${r.posto} ${r.nome}`, 3750),
        ],
      }),
      new TableRow({ children: [celula("RE:", 3750), celula(`RE: ${r.re}`, 3750)] }),
      new TableRow({ children: [celula("Função:", 3750), celula("Função:", 3750)] }),
      new TableRow({ children: [celula("Ass.:", 3750), celula("Ass.:", 3750)] }),
    ],
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Times New Roman", size: 24 } } } },
    numbering: {
      config: [
        {
          reference: "itens",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 4 } },
                children: [
                  new TextRun({
                    text: "“Nós, Policiais Militares, sob a proteção de Deus, estamos compromissados com a Defesa da Vida, da Integridade Física e da Dignidade da Pessoa Humana”.",
                    italics: true,
                    bold: true,
                    size: 16,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          cabecalho,
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 360, after: 160 },
            indent: { firstLine: 720 },
            children: [
              new TextRun({
                text: `Certifico que, nesta data, foi entregue à ${r.posto} ${r.re} ${r.nome}, o material abaixo especificado, sob sua responsabilidade e guarda:`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
          }),
          ...itens,
          ...(r.observacoes
            ? [
                new Paragraph({
                  spacing: { before: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  children: [
                    new TextRun({ text: r.observacoes, size: 24, font: "Times New Roman" }),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1200, after: 400 },
            children: [
              new TextRun({
                text: `São Paulo, ${porExtenso(r.data)}.`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
          }),
          assinaturas,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Recibo ${r.codigo.replace(/\//g, "-")} - ${r.nome}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
