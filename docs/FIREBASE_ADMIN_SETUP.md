# Firebase Admin SDK Kurulumu: Servis Hesabı Anahtarları

Bu doküman, uygulamanızın sunucu taraflı yönetici yetkileriyle (örneğin, öğrenciler için otomatik olarak kimlik doğrulama hesapları oluşturma) çalışabilmesi için gerekli olan Firebase Servis Hesabı anahtarlarını nasıl bulacağınızı ve projenize nasıl ekleyeceğinizi adım adım açıklar.

**UYARI:** Bu anahtarlar çok hassastır ve projenizin tüm verilerine tam erişim sağlar. Bu dosyayı asla halka açık bir kod repositorisine (GitHub vb.) yüklemeyin ve kimseyle paylaşmayın. `.gitignore` dosyanızda `.env` dosyasının listelendiğinden emin olun.

---

## Adım 1: Firebase Proje Ayarlarına Gidin

1.  **Firebase Console'u Açın:**
    *   [https://console.firebase.google.com/](https://console.firebase.google.com/) adresine gidin ve projenizi seçin.

2.  **Proje Ayarları:**
    *   Sol üst köşedeki dişli çark (⚙️) simgesine ve ardından **"Proje Ayarları"**na tıklayın.

## Adım 2: Servis Hesabını Bulun

1.  **"Servis Hesapları" Sekmesi:**
    *   Proje ayarları sayfasında üst menüden **"Servis Hesapları"** (Service Accounts) sekmesine gidin.

2.  **Anahtar Oluşturma:**
    *   "Firebase Admin SDK" bölümünde, "Node.js" seçeneğinin işaretli olduğundan emin olun.
    *   **"Yeni özel anahtar oluştur"** (Generate new private key) butonuna tıklayın.

3.  **Anahtarı İndirme:**
    *   Butona tıkladığınızda bir uyarı penceresi açılacaktır. **"Anahtar oluştur"** (Generate key) butonuna tıklayın.
    *   Tarayıcınız, içerisinde projenizin tüm servis hesabı bilgilerini barındıran bir `.json` dosyasını otomatik olarak indirecektir. Bu dosyayı güvenli bir yerde saklayın.

## Adım 3: Anahtarları `.env` Dosyasına Ekleme

1.  **İndirilen `.json` Dosyasını Açın:**
    *   İndirdiğiniz `.json` dosyasını bir metin editörü (VS Code, Not Defteri vb.) ile açın. Dosyanın içeriği şuna benzer olacaktır:

    ```json
    {
      "type": "service_account",
      "project_id": "takip-k0hdb",
      "private_key_id": "abcdef123456...",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIC...<çok uzun bir metin>...\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-xyz@takip-k0hdb.iam.gserviceaccount.com",
      "client_id": "123456789...",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
    }
    ```

2.  **Gerekli Bilgileri Kopyalayın:**
    *   Bu dosyadan sadece **3** bilgiye ihtiyacınız var:
        *   `project_id`
        *   `client_email`
        *   `private_key`

3.  **`.env` Dosyasını Güncelleyin:**
    *   Projenizin ana dizininde bulunan `.env` dosyasına gidin.
    *   Aşağıdaki gibi, `.json` dosyasından kopyaladığınız değerleri ilgili değişkenlere atayın:

    ```env
    # .env dosyanızın içeriği

    # Firebase Admin SDK (Sunucu Taraflı)
    FIREBASE_PROJECT_ID="...project_id değerini buraya yapıştırın..."
    FIREBASE_CLIENT_EMAIL="...client_email değerini buraya yapıştırın..."
    FIREBASE_PRIVATE_KEY="...private_key değerini buraya yapıştırın..."

    # Gemini API Anahtarı
    GEMINI_API_KEY=AIzaSyBXnUijO2aXdlNIhzz9BFYib0rZQqVwRs0

    # Firebase Public Config (İstemci Tarafı)
    NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyCJ3G_aB6dj3gvxgjg3sygeMnMNnEcXywE"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="takip-k0hdb.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="takip-k0hdb"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="takip-k0hdb.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1093335320755"
    NEXT_PUBLIC_FIREBASE_APP_ID="1:1093335320755:web:b029a206cb0fe66f7408c6"
    ```

    **ÖNEMLİ NOT:** `private_key` değerini kopyalarken, başlangıçtaki (`"-----BEGIN PRIVATE KEY-----\n`) ve sondaki (`\n-----END PRIVATE KEY-----\n"`) kısımlar dahil olmak üzere **tamamını tırnak işaretleri içinde** kopyaladığınızdan emin olun.

## Adım 4: Uygulamayı Yeniden Başlatma

`.env` dosyasında yaptığınız değişikliklerin geçerli olması için uygulamanızı (geliştirme sunucusunu) durdurup yeniden başlatmanız gerekir.

Bu adımları tamamladıktan sonra, **"Eski Kayıtlara Kod Ata"** butonu gibi yönetici yetkisi gerektiren tüm sunucu taraflı özellikler düzgün bir şekilde çalışacaktır.
