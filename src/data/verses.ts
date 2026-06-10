export interface Verse {
  reference: string
  text: string
}

export interface LanguageData {
  code: string
  name: string
  nativeName: string
  flag: string
  ttsLang: string
  verses: Verse[]
}

// All languages share Juan 15:16 — one verse, translated for each country.
export const languages: LanguageData[] = [
  {
    code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇨🇱', ttsLang: 'es-CL',
    verses: [
      { reference: 'Juan 15:16 ', text: 'No me escogieron ustedes a mí, sino que yo los escogí a ustedes y los comisioné para que vayan y den fruto, un fruto que perdure. Así el Padre les dará todo lo que pidan en mi nombre.' },
    ],
  },
  {
    code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', ttsLang: 'pt-BR',
    verses: [
      { reference: 'João 15:16 ', text: 'Não fui vocês que me escolheram, mas fui eu que os escolhi e os designei para que vão e deem fruto, fruto que permaneça. Assim o Pai lhes dará tudo o que pedirem em meu nome.' },
    ],
  },
  {
    code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', ttsLang: 'en-US',
    verses: [
      { reference: 'John 15:16 NIV', text: 'You did not choose me, but I chose you and appointed you so that you might go and bear fruit—fruit that will last—and so that whatever you ask in my name the Father will give you.' },
    ],
  },
  {
    code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', ttsLang: 'hi-IN',
    verses: [
      { reference: 'यूहन्ना 15:16', text: 'तुम ने मुझे नहीं चुना, परन्तु मैं ने तुम्हें चुना और ठहराया कि तुम जाकर फल लाओ, और तुम्हारा फल बना रहे; कि तुम मेरे नाम से जो कुछ पिता से मांगो, वह तुम्हें दे।' },
    ],
  },
  {
    code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', ttsLang: 'fr-FR',
    verses: [
      { reference: 'Jean 15:16 BDS', text: 'Ce n\'est pas vous qui m\'avez choisi, c\'est moi qui vous ai choisis, et je vous ai établis pour que vous alliez, que vous portiez du fruit, et que votre fruit demeure, afin que tout ce que vous demanderez au Père en mon nom, il vous l\'accorde.' },
    ],
  },
  {
    code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', ttsLang: 'de-DE',
    verses: [
      { reference: 'Johannes 15:16 NGÜ', text: 'Ihr habt nicht mich erwählt, sondern ich habe euch erwählt und dazu bestimmt, dass ihr geht und Frucht bringt, Frucht, die bleibt. Dann wird der Vater euch alles geben, was ihr ihn in meinem Namen bittet.' },
    ],
  },
  {
    code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇿🇦', ttsLang: 'sw-TZ',
    verses: [
      { reference: 'Yohana 15:16 SNB', text: 'Hamkunichagua mimi, bali mimi naliwachagua ninyi, nami nikaweka ili mwende mkazae matunda, na matunda yenu yadumu; ili Baba awape kila mombeo mtakayomwomba katika jina langu.' },
    ],
  },
  {
    code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', ttsLang: 'tr-TR',
    verses: [
      { reference: 'Yuhanna 15:16 TCL', text: 'Sizi ben seçtim, siz beni değil. Gidip meyve veresiniz ve meyveleriniz kalıcı olsun diye sizi atadım. Öyle ki, Baba\'dan benim adımla ne dilerseniz size versin.' },
    ],
  },
  {
    code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', ttsLang: 'pl-PL',
    verses: [
      { reference: 'Jana 15:16 BW', text: 'Nie wyście mnie wybrali, ale Ja was wybrałem i przeznaczyłem was, abyście szli i owoc przynosili i by owoc wasz trwał, aby Ojciec dał wam wszystko, o cokolwiek prosić Go będziecie w imieniu moim.' },
    ],
  },
  {
    code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇪🇬', ttsLang: 'ar-EG',
    verses: [
      { reference: 'يوحنا 15:16 AVD', text: 'لَيْسَ أَنْتُمُ اخْتَرْتُمُونِي بَلْ أَنَا اخْتَرْتُكُمْ وَأَقَمْتُكُمْ لِتَذْهَبُوا وَتَأْتُوا بِثَمَرٍ وَيَدُومَ ثَمَرُكُمْ حَتَّى إِنَّ الآبَ يُعْطِيَكُمْ كُلَّ مَا طَلَبْتُمْ بِاسْمِي.' },
    ],
  },
  {
    code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', ttsLang: 'zh-CN',
    verses: [
      { reference: '约翰福音 15:16 CNV', text: '不是你们拣选了我，是我拣选了你们，并且分派你们去结果子，叫你们的果子常存，使你们奉我的名，无论向父求什么，他就赐给你们。' },
    ],
  },
  {
    code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', ttsLang: 'ko-KR',
    verses: [
      { reference: '요한복음 15:16 KRV', text: '너희가 나를 택한 것이 아니요 내가 너희를 택하여 세웠나니 이는 너희로 가서 열매를 맺게 하고 또 너희 열매가 항상 있게 하여 내 이름으로 아버지께 무엇을 구하든지 다 받게 하려 함이라.' },
    ],
  },
  {
    code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', ttsLang: 'ja-JP',
    verses: [
      { reference: 'ヨハネ 15:16 JLB', text: 'あなたがたがわたしを選んだのではなく、わたしがあなたがたを選んだのです。そして、あなたがたが行って実を結び、その実が残るように、また、わたしの名によって父に求めるものは何でも与えられるように、わたしはあなたがたを任命したのです。' },
    ],
  },
  {
    code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', ttsLang: 'ru-RU',
    verses: [
      { reference: 'Иоанна 15:16 NRT', text: 'Не вы Меня избрали, а Я вас избрал и поставил вас, чтобы вы шли и приносили плод, и чтобы плод ваш пребывал, дабы, чего ни попросите от Отца во имя Моё, Он дал вам.' },
    ],
  },
  {
    code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', ttsLang: 'it-IT',
    verses: [
      { reference: 'Giovanni 15:16 NR', text: 'Non siete voi che avete scelto me, ma sono io che ho scelto voi, e vi ho costituiti perché andiate e portiate frutto, e il vostro frutto rimanga; affinché tutto quello che chiederete al Padre nel mio nome, Egli ve lo dia.' },
    ],
  },
  {
    code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', ttsLang: 'el-GR',
    verses: [
      { reference: 'Ιωάννης 15:16 NPV', text: 'Δεν με εκλέξατε εσείς εμένα, αλλά εγώ σας εξέλεξα εσάς και σας όρισα να πηγαίνετε και να φέρετε καρπό, καρπό που να μένει· ώστε ό,τι ζητήσετε από τον Πατέρα στο όνομά μου, να σας το δώσει.' },
    ],
  },
  {
    code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', ttsLang: 'he-IL',
    verses: [
      { reference: 'יוחנן 15:16 HNV', text: 'לֹא אַתֶּם בְּחַרְתֶּם בִּי, כִּי אִם אֲנִי בָּחַרְתִּי בָכֶם, וְהִפְקַדְתִּי אֶתְכֶם לָלֶכֶת וְלָשֵׂאת פְּרִי, וּפֶרְיְכֶם יַעֲמֹד, לְמַעַן כֹּל אֲשֶׁר תִּשְׁאֲלוּ מֵאֵת הָאָב בִּשְׁמִי יִתֵּן לָכֶם.' },
    ],
  },
]
