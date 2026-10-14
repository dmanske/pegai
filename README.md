# Pegaí

Extensão do Chrome para baixar do Instagram com um clique: post, reel, story, carrossel e
coleções salvas inteiras.

Um botão de baixar aparece no canto de cada post. Nos carrosséis aparece também um botão azul,
que baixa todas as fotos. Na página de uma coleção salva aparece o botão **Baixar coleção**.

## Instalar

1. Baixe o arquivo `Pegai-x.y.z.zip` em [Releases](../../releases/latest) e descompacte.
2. No Chrome, abra `chrome://extensions`.
3. Ligue o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e escolha a pasta `Pegai` que saiu do zip.

Funciona também no Edge e no Brave, que usam a mesma base do Chrome.

**Para atualizar:** baixe o zip novo, substitua a pasta e clique em **Recarregar (↻)** no cartão do
Pegaí em `chrome://extensions`.

## Onde os arquivos ficam

Dentro da pasta Downloads:

```
Pegai/
├─ <perfil>/
│  ├─ 2026-10-11 Bolo de cenoura fofinho [CxYz123AbcD].mp4
│  └─ 2026-10-11 Bolo de cenoura fofinho [CxYz123AbcD].txt   ← legenda
└─ Coleções/
   └─ <nome da coleção>/
      └─ <perfil>/ …
```

- O nome de cada arquivo tem a data do post, o começo da legenda e o código do post entre colchetes.
- Os carrosséis ganham `01`, `02`… no fim do nome.
- A pasta `Pegai` pode ser trocada no ícone da extensão.
- Ao baixar uma coleção de novo, o que já está no computador é pulado.

Se o Chrome perguntar onde salvar cada arquivo, desligue a opção "Perguntar onde salvar cada
arquivo" em `chrome://settings/downloads`. O ícone da extensão tem um atalho para essa tela.

## Gerar a partir do código

```
npm install
npm run build
```

O resultado fica em `dist/`. É essa pasta que você carrega em `chrome://extensions`.

## Aviso

O Pegaí é para uso pessoal. Ele usa a sua sessão do Instagram no próprio navegador e não envia
nada para nenhum servidor. Respeite os direitos de quem criou o conteúdo e os termos de uso do
Instagram. Este projeto não tem relação com o Instagram nem com a Meta.

Licença MIT.
