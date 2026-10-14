// CSS do botão, dentro do Shadow DOM: o Instagram não mexe nele e ele não vaza.
export const ESTILO = `
/* Sempre visível, para qualquer pessoa achar o botão. z-index alto: no post aberto o Instagram põe
   camadas por cima da mídia que roubariam o clique. */
:host { all: initial; position: absolute; top: 10px; right: 10px; z-index: 2147483000; }
/* a caixa tem SÓ o tamanho do círculo: a dica flutua ao lado sem ocupar espaço
   (antes ela alargava o botão e o centro dele caía na dica, que deixa o clique passar) */
.caixa { position: relative; width: 36px; height: 36px; }
/* carrossel: 2º botão (azul) logo abaixo do branco — baixa todos os slides */
button.todos { position: absolute; left: 0; top: 44px; background: #0095f6; color: #fff; }
button.todos:hover { background: #1877f2; }
button.todos[hidden] { display: none; }
button.todos[disabled] { opacity: .45; cursor: progress; }
button { all: unset; box-sizing: border-box; width: 36px; height: 36px; border-radius: 50%;
  display: grid; place-items: center; cursor: pointer; position: relative;
  background: rgba(255,255,255,.92); color: #111; box-shadow: 0 1px 2px rgba(0,0,0,.18), 0 4px 14px rgba(0,0,0,.18);
  transition: transform .12s ease, background .12s ease; }
button:hover { background: #fff; transform: scale(1.06); }
button:active { transform: scale(.96); }
button:focus-visible { outline: 2px solid #0095f6; outline-offset: 2px; }
button[data-estado="pronto"] { color: #fff; background: #1f8a4c; }
button[data-estado="erro"] { color: #fff; background: #c62828; }
button[data-estado="desativado"] { color: #8e8e8e; cursor: not-allowed; }
button[data-estado="baixando"] { cursor: progress; }
.giro { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(0,0,0,.15); border-top-color: #111;
  animation: giro .8s linear infinite; }
@keyframes giro { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .giro { animation-duration: 2.4s; } }
.ponto { position: absolute; top: 1px; right: 1px; width: 10px; height: 10px; border-radius: 50%;
  background: #1f8a4c; border: 2px solid #fff; }
.dica { position: absolute; right: 44px; top: var(--topo-dica, 18px); width: max-content; max-width: 240px;
  font: 500 12px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff;
  background: rgba(0,0,0,.82); padding: 6px 10px; border-radius: 8px;
  opacity: 0; transform: translate(4px, -50%); transition: opacity .15s ease, transform .15s ease; pointer-events: none; }
.dica.mostra { opacity: 1; transform: translate(0, -50%); }
`;
