# Diagnóstico: Por que o texto não faz sentido?

## Problema Identificado

O texto gerado parece ser do **template fallback** (exemplo: "Acabei de visitar tese de mestrado!"), não do DeepSeek. Isso indica que:

1. **DeepSeek não está sendo chamado** (API key não configurada)
2. **DeepSeek está falhando** e caindo no fallback silenciosamente

## Como Diagnosticar

### 1. Verificar se a API Key está configurada

```bash
# Verificar se .env.local existe e tem a chave
cat .env.local | grep DEEPSEEK_API_KEY
```

**Se não existir ou estiver vazio:**
- Crie/edite `.env.local` na raiz do projeto
- Adicione: `DEEPSEEK_API_KEY=sua_chave_aqui`
- Reinicie o servidor: `npm run dev:all`

### 2. Verificar os logs do servidor

Quando você gerar uma legenda, observe o terminal onde o servidor está rodando. Você deve ver:

**✅ Se DeepSeek está funcionando:**
```
[API] 🤖 Calling DeepSeek API...
[DeepSeek] 📡 Calling endpoint: https://api.deepseek.com/v1/chat/completions
[DeepSeek] ✅ Successfully received content (length: XXX)
[API] ✅ DeepSeek call successful, provider: deepseek
```

**❌ Se está usando fallback:**
```
[API] ⚠️  DeepSeek API key NOT configured, using fallback
OU
[API] ❌ DeepSeek error: [mensagem de erro]
[API] 🔄 Falling back to template generator...
[API] ✅ Fallback generation complete, provider: fallback
```

### 3. Testar o Health Check

```bash
curl http://localhost:3001/health
```

**Resposta esperada se configurado:**
```json
{
  "status": "ok",
  "deepseek": "configured",
  "model": "deepseek-chat",
  "baseUrl": "https://api.deepseek.com"
}
```

**Se não configurado:**
```json
{
  "status": "ok",
  "deepseek": "not_configured",
  "model": null,
  "baseUrl": null
}
```

## Soluções

### Solução 1: Configurar API Key

1. Obtenha uma API key do DeepSeek em: https://platform.deepseek.com/
2. Crie/edite `.env.local`:
   ```env
   DEEPSEEK_API_KEY=sk-sua_chave_aqui
   DEEPSEEK_BASE_URL=https://api.deepseek.com
   DEEPSEEK_MODEL=deepseek-chat
   PORT=3001
   ALLOWED_ORIGIN=http://localhost:5173
   ```
3. Reinicie o servidor: `npm run dev:all`

### Solução 2: Verificar erros de API

Se a API key está configurada mas ainda usa fallback, verifique os logs para erros como:
- `401 Unauthorized` - API key inválida
- `429 Too Many Requests` - Limite de requisições excedido
- `500 Internal Server Error` - Erro no servidor DeepSeek
- `Network error` - Problema de conexão

### Solução 3: Melhorar o Template Fallback (temporário)

Se você não pode usar DeepSeek agora, o template fallback pode ser melhorado para gerar textos mais contextualizados. Mas o ideal é usar DeepSeek para resultados melhores.

## Verificação Final

Após configurar, teste novamente:

1. Gere uma legenda no frontend
2. Verifique os logs do servidor
3. O texto deve ser **específico e contextualizado**, não genérico como "Acabei de visitar [tópico]!"

## Logs Adicionados

Agora o sistema tem logs detalhados que mostram:
- ✅ Se DeepSeek está sendo chamado
- ✅ Se a resposta foi recebida
- ✅ Se o parsing foi bem-sucedido
- ❌ Qualquer erro que ocorra

**Sempre verifique os logs do servidor para diagnosticar problemas!**


