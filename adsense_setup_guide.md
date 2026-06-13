# Guia de Configuração do Google AdSense

Este guia orienta sobre os passos necessários no console do Google AdSense para ativar os anúncios nos novos contêineres adicionados na aplicação.

---

### 1. Criar e Aprovar a Conta no AdSense
1. Acesse o site oficial do [Google AdSense](https://google.com/adsense) e crie uma conta.
2. Na aba **Sites** do painel do AdSense, adicione o seu domínio público (ex: `meiodocaminho.com.br`).
   * **Nota**: O Google AdSense **não exibe anúncios reais em `localhost`**. O domínio precisa estar publicado e ativo na internet para ser revisado e aprovado pelo Google.

---

### 2. Configurar o ID de Publicador (Publisher ID)
O ID de publicador identifica a sua conta AdSense e começa com `ca-pub-`.
No seu projeto, você precisa substituir o ID genérico pelo seu ID real em dois locais no arquivo `public/index.html`:
1. Na tag `<script>` importada na linha 17 do [public/index.html](file:///C:/Users/leo%20yuuki/Documents/meio-caminho/public/index.html#L17):
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```
2. Substitua também o atributo `data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"` nas duas tags `<ins>` dos anúncios no mesmo arquivo.

---

### 3. Criar as Unidades de Anúncio (Ad Slots)
No painel do AdSense, vá em **Anúncios** > **Por unidade de anúncio** e crie os seguintes anúncios de Display:

#### A. Banner Centro-Topo (Leaderboard)
- **Tipo**: Anúncios de Display (Display Ads)
- **Formato do anúncio**: Horizontal (Fixo ou Responsivo)
- **Tamanho ideal**: `468x60` px
- **O que fazer**: Copie o número gerado no campo `data-ad-slot` e substitua no arquivo `public/index.html` na linha que contém `data-ad-slot="TOP_CENTER_SLOT_ID"`.

#### B. Banner Lateral Direita-Centro (Skyscraper)
- **Tipo**: Anúncios de Display (Display Ads)
- **Formato do anúncio**: Vertical
- **Tamanho ideal**: `160x300` px
- **O que fazer**: Copie o número gerado no campo `data-ad-slot` e substitua no arquivo `public/index.html` na linha que contém `data-ad-slot="RIGHT_CENTER_SLOT_ID"`.

---

### 4. Configurar o arquivo `ads.txt`
O Google exige a presença de um arquivo `ads.txt` na raiz da sua aplicação para confirmar a autorização dos anúncios.
- Já criamos os arquivos modelos em [public/ads.txt](file:///C:/Users/leo%20yuuki/Documents/meio-caminho/public/ads.txt) e [ads.txt](file:///C:/Users/leo%20yuuki/Documents/meio-caminho/ads.txt).
- Abra os arquivos e substitua `pub-XXXXXXXXXXXXXXXX` com seu ID real (sem o prefixo `ca-`).
- O formato deve ser:
  ```text
  google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
  ```

---

### 💡 Comportamento dos Anúncios Criados
- **Fallback Visual**: Enquanto os blocos do AdSense não carregarem ou se você estiver visualizando localmente, a interface renderizará automaticamente banners de placeholder transparentes e elegantes que combinam com o estilo do site (Glassmorphism).
- **Substituição Dinâmica**: Quando o script do Google AdSense carregar os anúncios reais de forma bem-sucedida, o CSS dinâmico que escrevemos irá ocultar automaticamente os placeholders e renderizar a publicidade do Google AdSense.
- **Responsividade**: O anúncio lateral (Skyscraper) será automaticamente ocultado em telas menores que `900px` (dispositivos móveis), e o anúncio de topo se adaptará para o formato mobile para garantir uma excelente usabilidade.
