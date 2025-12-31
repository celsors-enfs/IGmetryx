# 🔍 Como Debugar a Extensão

Se a captura ficar travada, siga estes passos para identificar o problema:

## 1. Abrir Console do Service Worker

1. Vá para `chrome://extensions/`
2. Encontre "IGmetryx Feed Snapshot"
3. Clique no link **"service worker"** ou **"background page"** (link azul)
4. Isso abre o console do service worker

## 2. Abrir Console da Página do Instagram

1. Vá para a aba do Instagram que você quer capturar
2. Pressione F12 ou clique com botão direito → "Inspect"
3. Vá para a aba "Console"

## 3. Tentar Capturar e Observar Logs

1. Vá para `localhost:5175/instagram/feed-snapshot`
2. Clique em "Capture Snapshot"
3. Observe os logs em ambos os consoles

## Logs Esperados

No **Service Worker Console**, você deve ver:
- `[IGMETRYX] Starting capture loop for tab: [número]`
- `[IGMETRYX] Page info: {...}`
- `[IGMETRYX] Scrolling to top...`
- `[IGMETRYX] Capturing screenshot, frame: 1`
- `[IGMETRYX] Screenshot captured, size: [número]`

No **Console da Página Instagram**, você deve ver:
- `[IGMETRYX Content Script] Received message: IGMETRYX_GET_PAGE_INFO`
- `[IGMETRYX Content Script] Page info: {...}`
- `[IGMETRYX Content Script] Scrolling to: 0`

## Problemas Comuns

### "Could not get page information"
- O content script não está rodando na página do Instagram
- Recarregue a página do Instagram
- Verifique se a extensão está habilitada

### "Screenshot capture failed"
- A aba não está visível/ativa
- A extensão não tem permissão para capturar
- Tente recarregar a extensão

### Nenhum log aparece
- A extensão não está recebendo o comando
- Verifique se o web-app-bridge.js está rodando
- Recarregue a página da web app


