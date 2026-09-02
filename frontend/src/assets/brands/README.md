# Logos das Marcas

Coloque aqui os SVGs oficiais das marcas atendidas:

- `brastemp.svg`
- `consul.svg`
- `electrolux.svg`
- `lg.svg`
- `samsung.svg`
- `panasonic.svg`
- `midea.svg`
- `philco.svg`

Recomendações:

- Use **SVG** (vetorial) na versão colorida original sobre fundo branco/transparente.
- Fontes seguras: brand kits oficiais das marcas (páginas de imprensa/marca) ou repositórios curados como Simple Icons (cobrem LG, Samsung, Panasonic e Midea).
- NÃO use imagens aleatórias de baixa resolução.

Após adicionar os arquivos, edite `frontend/src/data/brands.js`:

```js
import logoBrastemp from "../assets/brands/brastemp.svg";
// ... demais imports

export const brands = [
  { id: 1, name: "Brastemp", logo: logoBrastemp /* ... */ },
];
```

Enquanto `logo` estiver `undefined`, a Home exibe automaticamente o fallback
com a inicial da marca (a seção não quebra).
