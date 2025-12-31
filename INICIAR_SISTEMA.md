# Como Iniciar o Sistema Localmente

## Passo 1: Parar processos anteriores (se houver)

```bash
# Parar processos nas portas 3001 e 5173
lsof -ti:3001,5173 | xargs kill -9 2>/dev/null || echo "Nenhum processo rodando"
```

## Passo 2: Verificar/Criar .env.local

Crie o arquivo `.env.local` na raiz do projeto com:

```env
DEEPSEEK_API_KEY=sua_chave_deepseek_aqui
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
PORT=3001
ALLOWED_ORIGIN=http://localhost:5173
```

**Importante:** Substitua `sua_chave_deepseek_aqui` pela sua chave real do DeepSeek.

## Passo 3: Instalar dependências (se necessário)

```bash
npm install
```

## Passo 4: Iniciar os servidores

```bash
npm run dev:all
```

Isso vai iniciar:
- ✅ Frontend (Vite) em http://localhost:5173
- ✅ Backend API em http://localhost:3001

## Passo 5: Verificar se está funcionando

### No terminal, você deve ver:

```
[Server] ✅ Loaded .env.local
[Server] ✅ IGmetryx API server running on port 3001
[Server] 🤖 DeepSeek: ✅ configured (model=deepseek-chat, host=api.deepseek.com)
[Server] 🔗 API endpoint: http://localhost:3001/api/ig/generate
[Server] 🏥 Health check: http://localhost:3001/health
```

### Testar Health Check:

Abra outro terminal e execute:
```bash
curl http://localhost:3001/health
```

Deve retornar:
```json
{
  "status": "ok",
  "deepseek": "configured",
  "model": "deepseek-chat",
  "baseUrl": "https://api.deepseek.com"
}
```

## Passo 6: Abrir o frontend

Abra no navegador:
**http://localhost:5173**

Navegue até a página do gerador de legendas e hashtags.

## Passo 7: Testar a API

### Opção 1: Usar o frontend
- Preencha o formulário
- Clique em "Generate"
- Observe os logs no terminal do servidor

### Opção 2: Testar com script
```bash
npm run test:deepseek
```

### Opção 3: Testar manualmente com curl
```bash
curl -X POST http://localhost:3001/api/ig/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "both",
    "language": "pt-BR",
    "tone": "friendly",
    "length": "medium",
    "hashtagCount": 15,
    "topic": "café da manhã"
  }'
```

## Observar os Logs

Quando você gerar uma legenda, observe o terminal. Você verá:

**Se DeepSeek está funcionando:**
```
[API] ✅ DeepSeek API key found, calling DeepSeek...
[DeepSeek] 📡 Calling endpoint: https://api.deepseek.com/v1/chat/completions
[DeepSeek] ✅ Received content, length: 890 chars
[API] ✅ Parsing complete
[API] ✅ DeepSeek call successful, cached
```

**Se está usando fallback:**
```
[API] ⚠️  DeepSeek API key NOT configured, using fallback
OU
[API] ❌ DeepSeek error: [mensagem de erro]
[API] 🔄 Falling back to template generator...
```

## Parar os servidores

Pressione `Ctrl+C` no terminal onde `npm run dev:all` está rodando.

## Troubleshooting

### "Port already in use"
```bash
# Matar processos nas portas
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### "command not found: concurrently"
```bash
npm install
```

### "DeepSeek not configured"
- Verifique se `.env.local` existe
- Verifique se tem `DEEPSEEK_API_KEY=...` (sem espaços antes/depois do `=`)
- Reinicie o servidor após criar/editar `.env.local`

### Frontend não carrega
- Verifique se o frontend está rodando: `curl http://localhost:5173`
- Verifique os logs do terminal

### API não responde
- Verifique se a API está rodando: `curl http://localhost:3001/health`
- Verifique os logs do terminal para erros

