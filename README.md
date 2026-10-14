# Pegaí

**Português** · [English](#english) · [Español](#español)

Extensão do Chrome para baixar do Instagram com um clique: post, reel, story, carrossel e coleções salvas
inteiras. Grátis, código aberto, sem cadastro e sem servidor: tudo acontece no seu navegador.

<!-- Coloque aqui o GIF de demonstração: ![Pegaí baixando um reel](docs/demo.gif) -->

## O que faz

- Um botão de baixar aparece no canto de cada post, reel e story.
- Nos carrosséis aparece também um botão azul, que baixa todas as fotos.
- Na página de uma coleção salva aparece o botão **Baixar coleção**, que baixa a coleção inteira.
- Cada arquivo sai com nome legível (data, começo da legenda e código do post) e a legenda vai junto num `.txt`.
- Ao baixar uma coleção de novo, o que já está no computador é pulado.

## Instalar

1. Baixe o arquivo `Pegai-x.y.z.zip` em [Releases](../../releases/latest) e descompacte.
2. No Chrome, abra `chrome://extensions`.
3. Ligue o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e escolha a pasta `Pegai-extensao` que saiu do zip.

Funciona também no Edge e no Brave, que usam a mesma base do Chrome.

Deixe a pasta `Pegai-extensao` num lugar fixo (por exemplo, Documentos): o Chrome lê a extensão de lá. Se ela for
apagada ou movida, a extensão para de funcionar.

**Para atualizar:** baixe o zip novo, substitua a pasta `Pegai-extensao` e clique em **Recarregar (↻)** no cartão
do Pegaí em `chrome://extensions`.

**Vindo da 1.0.0?** Lá a extensão e os downloads usavam a mesma pasta, `Downloads/Pegai`. Agora os downloads vão
para `Downloads/Pegai Downloads` sozinhos. Mova o que você já baixou para a pasta nova, carregue a
`Pegai-extensao` e apague a pasta `Pegai` antiga.

## Onde os arquivos ficam

Dentro da pasta Downloads:

```
Pegai Downloads/
├─ <perfil>/
│  ├─ 2026-10-11 Bolo de cenoura fofinho [CxYz123AbcD].mp4
│  └─ 2026-10-11 Bolo de cenoura fofinho [CxYz123AbcD].txt   ← legenda
└─ Coleções/
   └─ <nome da coleção>/
      └─ <perfil>/ …
```

- Os carrosséis ganham `01`, `02`… no fim do nome.
- A pasta `Pegai Downloads` pode ser trocada no ícone da extensão.

Se o Chrome perguntar onde salvar cada arquivo, desligue a opção "Perguntar onde salvar cada arquivo" em
`chrome://settings/downloads`. O ícone da extensão tem um atalho para essa tela.

## Gerar a partir do código

```
npm install
npm run build     # resultado em dist/ (é essa pasta que você carrega em chrome://extensions)
npm run pacote    # gera Pegai-<versão>.zip para o Release
```

## Aviso

O Pegaí é para uso pessoal. Ele usa a sua sessão do Instagram no próprio navegador e não envia nada para nenhum
servidor. Respeite os direitos de quem criou o conteúdo e os termos de uso do Instagram. Este projeto não tem
relação com o Instagram nem com a Meta. Licença MIT.

Gostou? Deixe uma ⭐ no repositório: ajuda outras pessoas a encontrarem o Pegaí.

---

## English

Chrome extension to download from Instagram in one click: posts, reels, stories, carousels and entire saved
collections. Free, open source, no sign-up and no server: everything runs in your browser.

### Features

- A download button shows up in the corner of every post, reel and story.
- Carousels also get a blue button that downloads every photo.
- A saved collection page gets a **Baixar coleção** (download collection) button that downloads the whole collection.
- Each file gets a readable name (date, start of the caption and post code) and the caption is saved as a `.txt`.
- Downloading a collection again skips what is already on your computer.

The interface is in Portuguese for now.

### Install

1. Download `Pegai-x.y.z.zip` from [Releases](../../releases/latest) and unzip it.
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `Pegai-extensao` folder from the zip.

Also works on Edge and Brave (same base as Chrome). Keep the `Pegai-extensao` folder somewhere permanent (for example,
Documents): Chrome loads the extension from it.

**To update:** download the new zip, replace the `Pegai-extensao` folder and click **Reload (↻)** on the Pegaí card in
`chrome://extensions`.

### Where files go

Inside your Downloads folder: `Pegai Downloads/<profile>/…`, and saved collections in
`Pegai Downloads/Coleções/<collection name>/<profile>/…`. The folder name can be changed from the extension icon. If
Chrome asks where to save each file, turn off "Ask where to save each file" in `chrome://settings/downloads`.

### Build from source

```
npm install
npm run build     # output in dist/ (load this folder in chrome://extensions)
npm run pacote    # creates Pegai-<version>.zip for the Release
```

### Disclaimer

Pegaí is for personal use. It uses your own Instagram session in your browser and sends nothing to any server.
Respect the rights of content creators and Instagram's terms of use. This project is not affiliated with Instagram
or Meta. MIT License.

If you like it, a ⭐ helps other people find Pegaí.

---

## Español

Extensión de Chrome para descargar de Instagram con un clic: publicaciones, reels, historias, carruseles y
colecciones guardadas completas. Gratis, de código abierto, sin registro y sin servidor: todo ocurre en tu navegador.

### Qué hace

- Aparece un botón de descarga en la esquina de cada publicación, reel e historia.
- En los carruseles aparece también un botón azul que descarga todas las fotos.
- En la página de una colección guardada aparece el botón **Baixar coleção** (descargar colección), que la descarga
  completa.
- Cada archivo tiene un nombre legible (fecha, inicio del texto y código de la publicación) y el texto se guarda en un
  `.txt`.
- Al descargar una colección de nuevo, lo que ya está en tu computadora se omite.

Por ahora la interfaz está en portugués.

### Instalar

1. Descarga `Pegai-x.y.z.zip` en [Releases](../../releases/latest) y descomprímelo.
2. En Chrome, abre `chrome://extensions`.
3. Activa el **Modo de desarrollador** (arriba a la derecha).
4. Haz clic en **Cargar descomprimida** y elige la carpeta `Pegai-extensao` del zip.

También funciona en Edge y Brave (misma base que Chrome). Guarda la carpeta `Pegai-extensao` en un lugar fijo (por
ejemplo, Documentos): Chrome carga la extensión desde ahí.

**Para actualizar:** descarga el zip nuevo, reemplaza la carpeta `Pegai-extensao` y haz clic en **Recargar (↻)** en la
tarjeta de Pegaí en `chrome://extensions`.

### Dónde quedan los archivos

Dentro de Descargas: `Pegai Downloads/<perfil>/…`, y las colecciones guardadas en
`Pegai Downloads/Coleções/<nombre de la colección>/<perfil>/…`. El nombre de la carpeta se puede cambiar desde el
ícono de la extensión. Si Chrome pregunta dónde guardar cada archivo, desactiva "Preguntar dónde guardar cada archivo"
en `chrome://settings/downloads`.

### Compilar desde el código

```
npm install
npm run build     # resultado en dist/ (carga esta carpeta en chrome://extensions)
npm run pacote    # genera Pegai-<versión>.zip para el Release
```

### Aviso

Pegaí es para uso personal. Usa tu propia sesión de Instagram en tu navegador y no envía nada a ningún servidor.
Respeta los derechos de quienes crean el contenido y los términos de uso de Instagram. Este proyecto no tiene relación
con Instagram ni con Meta. Licencia MIT.

Si te gusta, una ⭐ ayuda a que más personas encuentren Pegaí.
