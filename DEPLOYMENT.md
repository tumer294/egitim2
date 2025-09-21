# Projeyi Netlify ile Canlıya Alma

Bu doküman, projenizi GitHub ve Netlify kullanarak nasıl canlıya alacağınızı (yayınlayacağınızı) adım adım açıklar.

## Genel Bakış

Süreç üç ana adımdan oluşur:
1.  **Kodları GitHub'a Yükleme:** Projenizin kodlarını bir GitHub repositorisine göndereceksiniz.
2.  **Netlify'da Site Oluşturma:** Netlify hesabınızda yeni bir site oluşturup bu siteyi GitHub reponuza bağlayacaksınız.
3.  **Ortam Değişkenlerini Ayarlama:** Firebase anahtarlarınızı Netlify'a güvenli bir şekilde ekleyeceksiniz.

---

## Adım 1: Projeyi GitHub'a Yükleme

1.  **GitHub'da Yeni Repozituar Oluşturma:**
    *   [GitHub](https://github.com/new) adresine gidin ve projeniz için yeni bir **private (özel)** veya **public (herkese açık)** repository oluşturun.

2.  **Proje Kodlarını GitHub'a Gönderme:**
    *   Terminalinizi (veya Git istemcinizi) proje klasörünüzde açın ve aşağıdaki komutları sırasıyla çalıştırın. `YOUR_GITHUB_USERNAME` ve `YOUR_REPOSITORY_NAME` kısımlarını kendi bilgilerinizle değiştirmeyi unutmayın.

    ```bash
    # Proje klasörünü bir Git reposu olarak başlat
    git init -b main

    # Tüm dosyaları Git'e ekle
    git add .

    # İlk commit'ini oluştur
    git commit -m "İlk proje sürümü"

    # Uzak sunucu olarak GitHub reponuzu ekle
    git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git

    # Kodları GitHub'a gönder
    git push -u origin main
    ```

---

## Adım 2: Netlify'da Siteyi Oluşturma ve Bağlama

1.  **Netlify'a Giriş Yapın:**
    *   [Netlify](https://app.netlify.com/) adresine gidin ve GitHub hesabınızla giriş yapın.

2.  **Yeni Site Ekleme:**
    *   Kontrol panelinizde (dashboard) **"Add new site"** butonuna ve ardından **"Import an existing project"** seçeneğine tıklayın.

3.  **GitHub'ı Seçme:**
    *   "Deploy with" bölümünden **GitHub**'ı seçin.

4.  **Repozituarı Seçme:**
    *   Netlify, GitHub repolarınızı listeleyecektir. 1. adımda oluşturduğunuz repoyu bulun ve seçin.

5.  **Dağıtım Ayarlarını Onaylama:**
    *   Netlify, projenizin bir Next.js projesi olduğunu otomatik olarak tanıyacaktır. Ayarlar genellikle doğrudur:
        *   **Build command:** `next build`
        *   **Publish directory:** `.next`
    *   Bu ayarları kontrol edip **"Deploy site"** butonuna tıklamanız yeterlidir.

Netlify, projenizi derlemeye ve yayınlamaya başlayacaktır. Bu işlem birkaç dakika sürebilir.

---

## Adım 3: Ortam Değişkenlerini (Environment Variables) Ayarlama

Bu, uygulamanızın canlıda Firebase'e bağlanabilmesi için **en önemli adımdır**.

1.  **Netlify Site Ayarlarına Gidin:**
    *   Projeniz Netlify'da oluşturulduktan sonra, sitenizin kontrol panelindeki **"Site configuration"** (veya **"Site settings"**) bölümüne gidin.

2.  **Ortam Değişkenlerini Bulun:**
    *   Soldaki menüden **"Build & deploy"** -> **"Environment"** -> **"Environment variables"** bölümüne tıklayın.

3.  **Değişkenleri Ekleyin:**
    *   **"Add a variable"** veya **"Edit variables"** butonuna tıklayın.
    *   Projenizin ana dizinindeki `.env.local` dosyasında bulunan **her bir satırı** buraya tek tek eklemeniz gerekmektedir.
    *   Örneğin, `.env.local` dosyasındaki `NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."` satırı için:
        *   **Key (Anahtar):** `NEXT_PUBLIC_FIREBASE_API_KEY`
        *   **Value (Değer):** `AIza...` (Tırnak işaretleri olmadan)
    *   Bu işlemi `.env.local` dosyanızdaki **tüm anahtarlar** için tekrarlayın:
        *   `NEXT_PUBLIC_FIREBASE_API_KEY`
        *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
        *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
        *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
        *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
        *   `NEXT_PUBLIC_FIREBASE_APP_ID`

4.  **Dağıtımı Yeniden Tetikleme:**
    *   Ortam değişkenlerini kaydettikten sonra, sitenizin **"Deploys"** sekmesine gidin.
    *   **"Trigger deploy"** -> **"Deploy site"** butonuna tıklayarak projenizin bu yeni değişkenlerle yeniden derlenip yayınlanmasını sağlayın.

**İşte bu kadar!** Bu son dağıtım tamamlandığında, Netlify tarafından size verilen URL üzerinden projenizi canlıda ve çalışır durumda görebilirsiniz.
