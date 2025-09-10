# Facebook Pixel Webhook

Este projeto é um webhook completo para integração com o Facebook Pixel. Ele recebe eventos de conversão e os repassa automaticamente para o Facebook, permitindo o tracking preciso de conversões para campanhas de marketing.

## 🚀 Recursos

- ✅ Suporte a todos os eventos principais do Facebook Pixel
- 🔒 Segurança com rate limiting e validação de dados
- 🔐 Hash automático de dados sensíveis (PII)
- 📊 Logs estruturados para monitoramento
- 🛡️ Validação robusta de dados de entrada
- 🌐 CORS configurado para integração cross-origin
- 📱 Suporte a dados de usuário completos (email, telefone, nome, etc.)

## 📦 Instalação

### 1. Clone ou baixe o projeto

```bash
# Via Git
git clone <url-do-repositorio>
cd facebook-pixel-webhook

# Ou simplesmente baixe os arquivos para uma pasta
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
```

Configure as seguintes variáveis no arquivo `.env`:

```env
FACEBOOK_PIXEL_ID=seu_pixel_id_aqui
FACEBOOK_ACCESS_TOKEN=seu_token_de_acesso_aqui
WEBHOOK_VERIFY_TOKEN=seu_token_de_verificacao_aqui
PORT=3000
```

### 4. Execute o servidor

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

## 🔧 Configuração do Facebook

### 1. Obtenha o Pixel ID
1. Acesse o [Gerenciador de Eventos do Facebook](https://business.facebook.com/events_manager/)
2. Selecione seu Pixel
3. Copie o ID do Pixel

### 2. Gere o Access Token
1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Vá em Ferramentas > Explorador da API do Graph
3. Selecione sua aplicação
4. Gere um token com as permissões: `ads_management`, `business_management`

### 3. Configure o Webhook (Opcional)
Se você quiser que o Facebook verifique seu webhook:
1. No Gerenciador de Eventos, vá em Configurações
2. Configure a URL do webhook: `https://seu-dominio.com/webhook/facebook-pixel`
3. Use o `WEBHOOK_VERIFY_TOKEN` que você definiu no `.env`

## 📡 Endpoints da API

### 🎯 POST `/webhook/facebook-pixel`
Endpoint principal para enviar eventos para o Facebook Pixel.

#### Headers necessários:
```
Content-Type: application/json
```

#### Corpo da requisição:
```json
{
  "eventName": "Purchase",
  "userData": {
    "email": "usuario@exemplo.com",
    "phone": "+5511999999999",
    "firstName": "João",
    "lastName": "Silva",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "country": "BR"
  },
  "customData": {
    "value": 99.90,
    "currency": "BRL",
    "content_name": "Produto Exemplo",
    "content_category": "Eletrônicos",
    "content_ids": ["prod_123"],
    "num_items": 1
  },
  "sourceUrl": "https://exemplo.com/checkout",
  "eventTime": 1694678400
}
```

#### Campos obrigatórios:
- `eventName`: Nome do evento (ver lista de eventos suportados)

#### Campos opcionais:
- `userData`: Dados do usuário (serão hasheados automaticamente)
- `customData`: Dados customizados do evento
- `sourceUrl`: URL da página onde o evento ocorreu
- `eventTime`: Timestamp do evento (padrão: agora)

### 📊 GET `/webhook/facebook-pixel/events`
Lista todos os eventos suportados.

### 🔍 GET `/health`
Health check do servidor.

### ✅ GET `/webhook/facebook-pixel`
Endpoint de verificação do webhook (usado pelo Facebook).

## 🎯 Eventos Suportados

| Evento | Descrição | Uso Comum |
|--------|-----------|-----------|
| `Purchase` | Compra realizada | E-commerce |
| `AddToCart` | Produto adicionado ao carrinho | E-commerce |
| `InitiateCheckout` | Checkout iniciado | E-commerce |
| `Lead` | Lead capturado | Formulários |
| `CompleteRegistration` | Registro completo | Cadastros |
| `ViewContent` | Conteúdo visualizado | Páginas de produto |
| `Search` | Busca realizada | Pesquisas no site |
| `AddToWishlist` | Adicionado à lista de desejos | E-commerce |
| `PageView` | Página visualizada | Navegação |

## 💻 Exemplos de Uso

### JavaScript (Frontend)
```javascript
// Exemplo de compra
const enviarCompra = async (dadosCompra) => {
  try {
    const response = await fetch('http://localhost:3000/webhook/facebook-pixel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName: 'Purchase',
        userData: {
          email: dadosCompra.email,
          phone: dadosCompra.telefone,
          firstName: dadosCompra.nome,
          lastName: dadosCompra.sobrenome
        },
        customData: {
          value: dadosCompra.valor,
          currency: 'BRL',
          content_name: dadosCompra.produto
        }
      })
    });

    const result = await response.json();
    console.log('Evento enviado:', result);
  } catch (error) {
    console.error('Erro ao enviar evento:', error);
  }
};

// Chamar a função
enviarCompra({
  email: 'cliente@exemplo.com',
  telefone: '+5511999999999',
  nome: 'João',
  sobrenome: 'Silva',
  valor: 149.90,
  produto: 'Smartphone XYZ'
});
```

### PHP
```php
<?php
function enviarEvento($eventName, $userData, $customData = []) {
    $url = 'http://localhost:3000/webhook/facebook-pixel';
    
    $data = [
        'eventName' => $eventName,
        'userData' => $userData,
        'customData' => $customData
    ];
    
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    return json_decode($result, true);
}

// Exemplo de uso
$resultado = enviarEvento('Purchase', [
    'email' => 'cliente@exemplo.com',
    'phone' => '+5511999999999'
], [
    'value' => 99.90,
    'currency' => 'BRL'
]);

echo json_encode($resultado);
?>
```

### Python
```python
import requests
import json

def enviar_evento(event_name, user_data, custom_data=None):
    url = 'http://localhost:3000/webhook/facebook-pixel'
    
    payload = {
        'eventName': event_name,
        'userData': user_data,
        'customData': custom_data or {}
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    return response.json()

# Exemplo de uso
resultado = enviar_evento(
    event_name='Purchase',
    user_data={
        'email': 'cliente@exemplo.com',
        'phone': '+5511999999999'
    },
    custom_data={
        'value': 99.90,
        'currency': 'BRL'
    }
)

print(json.dumps(resultado, indent=2))
```

### cURL
```bash
# Exemplo de compra
curl -X POST http://localhost:3000/webhook/facebook-pixel \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Purchase",
    "userData": {
      "email": "cliente@exemplo.com",
      "phone": "+5511999999999",
      "firstName": "João",
      "lastName": "Silva"
    },
    "customData": {
      "value": 149.90,
      "currency": "BRL",
      "content_name": "Produto XYZ"
    }
  }'
```

## 🔒 Segurança

### Dados Sensíveis
Todos os dados pessoais (PII) são automaticamente hasheados usando SHA-256 antes de serem enviados ao Facebook:
- Email
- Telefone  
- Nome
- Sobrenome
- Cidade
- Estado
- CEP
- País

### Rate Limiting
O webhook implementa rate limiting de 100 requisições por IP a cada 15 minutos.

### Validações
- Validação de formato de email
- Validação de formato de telefone
- Validação de eventos suportados
- Sanitização de dados de entrada

## 📈 Monitoramento

### Logs
O servidor gera logs estruturados para:
- Eventos enviados com sucesso
- Erros de API do Facebook
- Tentativas de acesso inválidas
- Performance e métricas

### Health Check
Monitore a saúde do servidor em: `GET /health`

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-10T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

## 🚀 Deploy em Produção

### Variáveis de Ambiente de Produção
```env
NODE_ENV=production
PORT=3000
FACEBOOK_PIXEL_ID=seu_pixel_id
FACEBOOK_ACCESS_TOKEN=seu_token_producao
WEBHOOK_VERIFY_TOKEN=token_seguro_para_verificacao
```

### Exemplo Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ❗ Troubleshooting

### Erro: "Token de acesso inválido"
- Verifique se o `FACEBOOK_ACCESS_TOKEN` está correto
- Confirme se o token tem as permissões necessárias
- Gere um novo token se necessário

### Erro: "Pixel ID não encontrado"
- Confirme o `FACEBOOK_PIXEL_ID` no Gerenciador de Eventos
- Verifique se você tem acesso ao pixel

### Eventos não aparecem no Facebook
- Pode levar até 20 minutos para aparecer
- Verifique se está usando o `TEST_EVENT_CODE` para testes
- Confirme se os dados do usuário estão sendo enviados corretamente

### Rate Limiting
- Se estiver recebendo erro 429, aguarde 15 minutos
- Para produção, considere implementar um sistema de filas

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Teste com o endpoint `/health`
3. Use o `TEST_EVENT_CODE` para debug
4. Consulte a documentação oficial do Facebook Pixel

## 📝 Licença

MIT License - veja arquivo LICENSE para detalhes.
