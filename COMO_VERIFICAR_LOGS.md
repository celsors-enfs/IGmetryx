# Como Verificar se DeepSeek Está Funcionando

## Passo 1: Verificar se a API Key está configurada

No terminal onde o servidor está rodando, você deve ver na inicialização:

```
[Server] ✅ Loaded .env.local
[Server] 🤖 DeepSeek: ✅ configured (model=deepseek-chat, host=api.deepseek.com)
```

**Se aparecer:**
```
[Server] 🤖 DeepSeek: ❌ not configured (using fallback)
```

**Solução:** Crie/edite `.env.local` e adicione:
```env
DEEPSEEK_API_KEY=sua_chave_aqui
```

## Passo 2: Gerar uma legenda e observar os logs

Quando você gerar uma legenda no frontend, observe o terminal do servidor. Você deve ver:

### ✅ Se DeepSeek está funcionando:

```
[API] CACHE MISS abc12345
[API] ✅ DeepSeek API key found, calling DeepSeek...
[API] 🤖 Calling DeepSeek API...
[API] 📋 Request details: { topic: '...', language: 'pt-BR', ... }
[DeepSeek] 📡 Calling endpoint: https://api.deepseek.com/v1/chat/completions
[DeepSeek] 📝 System prompt length: 1234
[DeepSeek] 📝 User prompt length: 567
[DeepSeek] ✅ Received content, length: 890 chars
[DeepSeek] 📄 Content preview (first 200 chars): {"captions":{"short":"...
[API] 📥 DeepSeek response received, parsing...
[API] 📥 Parsing DeepSeek response...
[API] ✅ JSON parsed successfully
[API] 📊 Parsed structure: { hasCaptions: true, hasHashtags: true, ... }
[API] 📝 Captions lengths: { short: 45, medium: 120, long: 250 }
[API] ✅ Final parsed result: { captions: {...}, hashtagsCount: 15 }
[API] ✅ Parsing complete
[API] ✅ DeepSeek call successful, cached
```

### ❌ Se está usando fallback:

```
[API] CACHE MISS abc12345
[API] ⚠️  DeepSeek API key NOT configured, using fallback
OU
[API] ✅ DeepSeek API key found, calling DeepSeek...
[API] 🤖 Calling DeepSeek API...
[DeepSeek] 📡 Calling endpoint: ...
[DeepSeek] ❌ HTTP 401 error: Invalid API key
[API] ❌ DeepSeek error: DeepSeek API error (401): Invalid API key
[API] 🔄 Falling back to template generator...
[API] ✅ Fallback generation complete
```

## Passo 3: Verificar o conteúdo gerado

### DeepSeek (correto):
- Captions são específicas e contextualizadas
- Não começam com "Acabei de visitar [tópico]!"
- Têm conteúdo único e relevante
- Hashtags são variadas e relevantes

### Fallback (incorreto):
- Captions seguem padrões como:
  - "Acabei de visitar [tópico]!"
  - "Just [topic]!"
  - "Exploring [topic]!"
- Texto genérico que só substitui o tópico

## Passo 4: Testar com o script de prova

```bash
npm run test:deepseek
```

Este script vai:
1. Chamar a API duas vezes
2. Verificar que `_provider: "deepseek"`
3. Verificar que `_cache: "miss"` na primeira, `"hit"` na segunda
4. Verificar que as captions não são templates

## Problemas Comuns

### 1. "DeepSeek API key NOT configured"
- **Causa:** `.env.local` não existe ou não tem `DEEPSEEK_API_KEY`
- **Solução:** Crie `.env.local` com a chave

### 2. "HTTP 401 error: Invalid API key"
- **Causa:** API key inválida ou expirada
- **Solução:** Obtenha uma nova chave em https://platform.deepseek.com/

### 3. "HTTP 429 error: Rate limit exceeded"
- **Causa:** Muitas requisições
- **Solução:** Aguarde alguns minutos

### 4. "No content in DeepSeek response"
- **Causa:** Resposta inválida da API
- **Solução:** Verifique os logs completos para ver a resposta

### 5. "Failed to parse DeepSeek response"
- **Causa:** JSON inválido na resposta
- **Solução:** Os logs vão mostrar o conteúdo recebido

## Comando para ver logs em tempo real

Se você quiser ver apenas os logs relevantes:

```bash
# Terminal 1: Servidor
npm run dev:api | grep -E "(DeepSeek|API|CACHE)"

# Terminal 2: Frontend
npm run dev
```

## Verificação Rápida

Execute este comando para verificar a configuração:

```bash
curl http://localhost:3001/health | jq
```

Deve retornar:
```json
{
  "status": "ok",
  "deepseek": "configured",
  "model": "deepseek-chat"
}
```

Se retornar `"deepseek": "not_configured"`, você precisa configurar a API key.

