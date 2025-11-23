# Instruções para Importar Dados em Produção

## ✅ Sistema de Importação com Upload de CSV

Foi criado um sistema web simples e seguro para importar as 1125 áreas de serviço no banco de produção. Agora você pode fazer upload do arquivo CSV diretamente pelo navegador, sem precisar acessar o Database Pane.

---

## 📋 Passo a Passo para Uso

### 1. Acessar a Página de Importação

Primeiro, acesse a página de importação:

**Em Desenvolvimento (para baixar o CSV):**
1. Acesse: `https://seu-repl.replit.dev/admin/import`

**Em Produção (para importar):**
1. Publique o aplicativo (botão Deploy no Replit)
2. Acesse: `https://seu-app.replit.app/admin/import`

### 2. Baixar o Arquivo CSV (Passo 1)

Na página de importação:

1. Clique no botão **"Baixar areas_londrina.csv"**
2. O arquivo será baixado para o seu computador (1125 áreas)
3. Guarde este arquivo em um local seguro

> **💡 Dica:** Você pode baixar o CSV do ambiente de desenvolvimento e usar em produção.

### 3. Selecionar o Arquivo (Passo 2)

1. Clique em **"Escolher arquivo"** no campo de upload
2. Selecione o arquivo `areas_londrina.csv` que você acabou de baixar
3. Você verá uma confirmação: "✓ Arquivo selecionado: areas_londrina.csv"

### 4. Digitar a Senha (Passo 3)

1. No campo "Senha de Administrador", digite: **cmtu2025**
2. Se você configurou uma senha personalizada, use ela

### 5. Importar os Dados

1. Clique no botão **"Importar 1125 Áreas"**
2. Aguarde o processamento (pode levar até 30 segundos)
3. Você verá uma mensagem de sucesso com:
   - Quantas áreas foram importadas
   - Quantas foram ignoradas (se já existiam)
4. Clique em **"Ir para o Dashboard"**

### 6. Verificar a Importação

No dashboard principal:

1. Verifique se o mapa mostra **1125 marcadores verdes**
2. Use os filtros "Lote 1" e "Lote 2" para confirmar:
   - Lote 1: ~579 áreas (Giro Zero)
   - Lote 2: ~546 áreas (JGR Zeladoria)
3. Teste a busca com alguns nomes de áreas

---

## 🔒 Segurança

### Senha Personalizada (Opcional mas Recomendado)

Para maior segurança em produção:

1. No Replit, vá em **Secrets** (cadeado no painel lateral)
2. Adicione uma nova secret:
   - **Nome**: `ADMIN_IMPORT_PASSWORD`
   - **Valor**: Sua senha personalizada (exemplo: `londrina@2025!`)
3. Salve e reinicie o aplicativo
4. Use sua senha personalizada ao invés de "cmtu2025"

### ⚠️ IMPORTANTE: Remover o Sistema Após Uso

**Por segurança, este sistema de importação deve ser removido após o primeiro uso em produção!**

Quando terminar a importação, me avise para remover:
- O endpoint `/api/admin/download-csv`
- O endpoint `/api/admin/import-data`
- A página `/admin/import`

Isso garante que ninguém possa executar novas importações sem autorização.

---

## 🔄 Fluxo Completo Resumido

```
1. Baixar CSV → 2. Fazer Upload → 3. Digitar Senha → 4. Importar → 5. Verificar
```

**Em Desenvolvimento:**
- Use a página `/admin/import` para baixar o CSV original

**Em Produção:**
- Use o CSV baixado + senha para importar via upload

---

## ❓ Resolução de Problemas

### Erro: "Senha incorreta"
- ✓ Verifique se digitou corretamente (padrão: `cmtu2025`)
- ✓ Se definiu senha personalizada, use ela

### Erro: "Arquivo CSV não enviado"
- ✓ Certifique-se de selecionar o arquivo no Passo 2
- ✓ Arquivo deve ser `.csv` (não `.xlsx` ou outro formato)

### Botão "Importar" Desabilitado
- ✓ Selecione o arquivo CSV primeiro
- ✓ Digite a senha
- ✓ Ambos são obrigatórios

### Erro ao Baixar CSV
- ✓ Verifique se está no ambiente de desenvolvimento
- ✓ Se em produção, baixe do ambiente dev primeiro

### Nenhum Marcador no Mapa Após Importação
- ✓ Aguarde alguns segundos para o mapa carregar
- ✓ Recarregue a página (F5)
- ✓ Verifique se não há filtros ativos

### Importação Parcial (menos de 1125 áreas)
- ✓ Normal se já existiam dados no banco
- ✓ O sistema não duplica áreas existentes
- ✓ Verifique quantas foram "ignoradas" na mensagem

---

## 📊 O Que é Importado

A importação adiciona ao banco:

### 1. **1125 Áreas de Serviço**
- **Lote 1**: 579 áreas (empresa Giro Zero)
- **Lote 2**: 546 áreas (empresa JGR Zeladoria)
- Cada área com:
  - Nome/endereço
  - Bairro
  - Tamanho em m²
  - Coordenadas GPS (lat/lng)
  - Lote responsável
  - Status inicial: "Pendente"

### 2. **Configurações de Produção**
- **Lote 1**: 110.000 m²/dia
- **Lote 2**: 80.000 m²/dia

### 3. **6 Equipes Padrão**
- 3 equipes de roçagem (Lote 1)
- 3 equipes de roçagem (Lote 2)
- Cada equipe com localização GPS inicial

---

## 🎯 Próximos Passos

Após importação bem-sucedida:

1. ✅ Verifique os 1125 marcadores no mapa
2. ✅ Teste os filtros por lote
3. ✅ Teste a busca de áreas
4. ✅ Me avise para remover o sistema de importação (segurança)
5. ✅ Comece a usar o sistema normalmente!

---

## 📝 Notas Técnicas

- **Tamanho do arquivo**: ~150KB (1125 linhas)
- **Formato**: CSV com 8 colunas
- **Codificação**: UTF-8
- **Limite de upload**: 10MB
- **Tempo de importação**: ~10-30 segundos
- **Operação**: Substitui todos os dados existentes (limpa antes de importar)

---

**Dúvidas ou problemas?** É só me avisar que eu ajudo! 🚀
