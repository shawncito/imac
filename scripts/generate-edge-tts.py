"""
Pre-generate natural neural TTS audio for Bible verses using edge-tts (Microsoft).
Free, no API key, no model download. Covers all 17 app languages.

Run once:
    python -m pip install edge-tts
    python scripts/generate-edge-tts.py

Output: public/audio/{lang}-f.mp3 (female) and {lang}-m.mp3 (male)

Note: English also has Kokoro voices (en-f.wav / en-m.wav) generated separately
by scripts/generate-tts.mjs. Those are kept; edge adds Ava/Andrew as extra options.
"""

import asyncio
import os
import edge_tts

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
os.makedirs(OUT_DIR, exist_ok=True)

# lang code -> { "f": voice_id, "m": voice_id, "text": verse }
VOICES = {
    "es": {"f": "es-CL-CatalinaNeural", "m": "es-CL-LorenzoNeural",
           "text": "No me escogieron ustedes a mí, sino que yo los escogí a ustedes y los comisioné para que vayan y den fruto, un fruto que perdure. Así el Padre les dará todo lo que pidan en mi nombre."},
    "pt": {"f": "pt-BR-FranciscaNeural", "m": "pt-BR-AntonioNeural",
           "text": "Não fui vocês que me escolheram, mas fui eu que os escolhi e os designei para que vão e deem fruto, fruto que permaneça. Assim o Pai lhes dará tudo o que pedirem em meu nome."},
    "en": {"f": "en-US-AvaNeural", "m": "en-US-AndrewNeural",
           "text": "You did not choose me, but I chose you and appointed you so that you might go and bear fruit—fruit that will last—and so that whatever you ask in my name the Father will give you."},
    "hi": {"f": "hi-IN-SwaraNeural", "m": "hi-IN-MadhurNeural",
           "text": "तुम ने मुझे नहीं चुना, परन्तु मैं ने तुम्हें चुना और ठहराया कि तुम जाकर फल लाओ, और तुम्हारा फल बना रहे; कि तुम मेरे नाम से जो कुछ पिता से मांगो, वह तुम्हें दे।"},
    "fr": {"f": "fr-FR-DeniseNeural", "m": "fr-FR-HenriNeural",
           "text": "Ce n'est pas vous qui m'avez choisi, c'est moi qui vous ai choisis, et je vous ai établis pour que vous alliez, que vous portiez du fruit, et que votre fruit demeure, afin que tout ce que vous demanderez au Père en mon nom, il vous l'accorde."},
    "de": {"f": "de-DE-KatjaNeural", "m": "de-DE-ConradNeural",
           "text": "Ihr habt nicht mich erwählt, sondern ich habe euch erwählt und dazu bestimmt, dass ihr geht und Frucht bringt, Frucht, die bleibt. Dann wird der Vater euch alles geben, was ihr ihn in meinem Namen bittet."},
    "sw": {"f": "sw-TZ-RehemaNeural", "m": "sw-TZ-DaudiNeural",
           "text": "Hamkunichagua mimi, bali mimi naliwachagua ninyi, nami nikaweka ili mwende mkazae matunda, na matunda yenu yadumu; ili Baba awape kila mombeo mtakayomwomba katika jina langu."},
    "tr": {"f": "tr-TR-EmelNeural", "m": "tr-TR-AhmetNeural",
           "text": "Sizi ben seçtim, siz beni değil. Gidip meyve veresiniz ve meyveleriniz kalıcı olsun diye sizi atadım. Öyle ki, Baba'dan benim adımla ne dilerseniz size versin."},
    "pl": {"f": "pl-PL-ZofiaNeural", "m": "pl-PL-MarekNeural",
           "text": "Nie wyście mnie wybrali, ale Ja was wybrałem i przeznaczyłem was, abyście szli i owoc przynosili i by owoc wasz trwał, aby Ojciec dał wam wszystko, o cokolwiek prosić Go będziecie w imieniu moim."},
    "ar": {"f": "ar-EG-SalmaNeural", "m": "ar-EG-ShakirNeural",
           "text": "لَيْسَ أَنْتُمُ اخْتَرْتُمُونِي بَلْ أَنَا اخْتَرْتُكُمْ وَأَقَمْتُكُمْ لِتَذْهَبُوا وَتَأْتُوا بِثَمَرٍ وَيَدُومَ ثَمَرُكُمْ حَتَّى إِنَّ الآبَ يُعْطِيَكُمْ كُلَّ مَا طَلَبْتُمْ بِاسْمِي."},
    "zh": {"f": "zh-CN-XiaoxiaoNeural", "m": "zh-CN-YunxiNeural",
           "text": "不是你们拣选了我，是我拣选了你们，并且分派你们去结果子，叫你们的果子常存，使你们奉我的名，无论向父求什么，他就赐给你们。"},
    "ko": {"f": "ko-KR-SunHiNeural", "m": "ko-KR-InJoonNeural",
           "text": "너희가 나를 택한 것이 아니요 내가 너희를 택하여 세웠나니 이는 너희로 가서 열매를 맺게 하고 또 너희 열매가 항상 있게 하여 내 이름으로 아버지께 무엇을 구하든지 다 받게 하려 함이라."},
    "ja": {"f": "ja-JP-NanamiNeural", "m": "ja-JP-KeitaNeural",
           "text": "あなたがたがわたしを選んだのではなく、わたしがあなたがたを選んだのです。そして、あなたがたが行って実を結び、その実が残るように、また、わたしの名によって父に求めるものは何でも与えられるように、わたしはあなたがたを任命したのです。"},
    "ru": {"f": "ru-RU-SvetlanaNeural", "m": "ru-RU-DmitryNeural",
           "text": "Не вы Меня избрали, а Я вас избрал и поставил вас, чтобы вы шли и приносили плод, и чтобы плод ваш пребывал, дабы, чего ни попросите от Отца во имя Моё, Он дал вам."},
    "it": {"f": "it-IT-ElsaNeural", "m": "it-IT-DiegoNeural",
           "text": "Non siete voi che avete scelto me, ma sono io che ho scelto voi, e vi ho costituiti perché andiate e portiate frutto, e il vostro frutto rimanga; affinché tutto quello che chiederete al Padre nel mio nome, Egli ve lo dia."},
    "el": {"f": "el-GR-AthinaNeural", "m": "el-GR-NestorasNeural",
           "text": "Δεν με εκλέξατε εσείς εμένα, αλλά εγώ σας εξέλεξα εσάς και σας όρισα να πηγαίνετε και να φέρετε καρπό, καρπό που να μένει· ώστε ό,τι ζητήσετε από τον Πατέρα στο όνομά μου, να σας το δώσει."},
    "he": {"f": "he-IL-HilaNeural", "m": "he-IL-AvriNeural",
           "text": "לֹא אַתֶּם בְּחַרְתֶּם בִּי, כִּי אִם אֲנִי בָּחַרְתִּי בָכֶם, וְהִפְקַדְתִּי אֶתְכֶם לָלֶכֶת וְלָשֵׂאת פְּרִי, וּפֶרְיְכֶם יַעֲמֹד, לְמַעַן כֹּל אֲשֶׁר תִּשְׁאֲלוּ מֵאֵת הָאָב בִּשְׁמִי יִתֵּן לָכֶם."},
}


async def gen(text, voice, out_path):
    communicate = edge_tts.Communicate(text, voice, rate="-10%")
    await communicate.save(out_path)


async def main():
    total = 0
    for code, cfg in VOICES.items():
        for gender in ("f", "m"):
            voice = cfg[gender]
            out = os.path.join(OUT_DIR, f"{code}-{gender}.mp3")
            print(f"  Generating {code}-{gender}.mp3 ({voice})... ", end="", flush=True)
            try:
                await gen(cfg["text"], voice, out)
                size = os.path.getsize(out) // 1024
                print(f"done ({size} KB)")
                total += 1
            except Exception as e:
                print(f"FAILED: {e}")
    print(f"\nDone: {total} files in public/audio/")


if __name__ == "__main__":
    asyncio.run(main())
