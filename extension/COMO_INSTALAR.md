# Como Instalar a Extensão Chrome

## Passo a Passo

1. **Abra o Chrome**
   - Certifique-se de usar o Google Chrome ou outro navegador baseado em Chromium (Edge, Brave, etc.)

2. **Acesse a Página de Extensões**
   - Digite na barra de endereço: `chrome://extensions/`
   - Ou vá em: Menu (⋮) → Mais ferramentas → Extensões

3. **Ative o Modo Desenvolvedor**
   - No canto superior direito da página, ative o toggle "Modo do desenvolvedor" (Developer mode)

4. **Carregue a Extensão**
   - Clique no botão "Carregar sem compactação" (Load unpacked)
   - Navegue até a pasta do projeto: `/Users/celso/Desktop/IGmetryx0/extension`
   - Selecione a pasta `extension` e clique em "Selecionar" (ou "Abrir")

5. **Verifique se Carregou**
   - A extensão "IGmetryx Feed Snapshot" deve aparecer na lista
   - Se aparecer um aviso sobre ícones, ignore por enquanto (os ícones são opcionais para funcionamento básico)

6. **Teste a Extensão**
   - Vá para a página `/instagram/feed-snapshot` no site
   - A extensão deve ser detectada automaticamente
   - Se não detectar, recarregue a página da web

## Resolução de Problemas

### Extensão não aparece
- Verifique se ativou o "Modo do desenvolvedor"
- Certifique-se de selecionar a pasta `extension` correta
- Veja o console para erros (F12 → Console)

### Extensão aparece mas não funciona
- Verifique se os arquivos estão todos presentes:
  - manifest.json
  - service-worker.js
  - content-script.js
  - offscreen.html
  - offscreen.js
- Recarregue a extensão (botão de atualizar na extensão)
- Recarregue a página da web

### Erros de permissão
- A extensão pedirá permissão para acessar instagram.com
- Clique em "Permitir" quando solicitado

## Nota sobre Ícones

A extensão precisa de ícones, mas você pode usar ícones temporários ou criar depois. Por enquanto, o Chrome mostrará um ícone padrão, mas a extensão deve funcionar normalmente.


