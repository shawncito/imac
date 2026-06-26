"""
Generate an extra set of natural voices with hexgrad/Kokoro-82M (PyTorch).
This complements the edge-tts set so supported languages have 4 voices total.

Requires Python 3.12 (the ML stack has no 3.13/3.14 wheels yet). Set up with uv:
    uv venv C:/Users/USER/kv --python 3.12
    uv pip install --python C:/Users/USER/kv/Scripts/python.exe kokoro soundfile "transformers>=4.46,<5" click "misaki[zh]"
    C:/Users/USER/kv/Scripts/python.exe scripts/generate-kokoro.py

Output: public/audio/{lang}-kf.wav (Kokoro female) and {lang}-km.wav (Kokoro male)

Coverage: es, pt, hi, fr (female only), it, zh.
Not generated: en (already has Kokoro Heart/Fenrir + edge), ja (pyopenjtalk needs a
C++ build toolchain), and languages Kokoro v1.0 does not support.
"""

import os
import numpy as np
import soundfile as sf
from kokoro import KPipeline

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
os.makedirs(OUT_DIR, exist_ok=True)

# lang -> { kokoro lang_code, female voice, male voice|None, verse text }
LANGS = {
    "es": {"code": "e", "f": "ef_dora",  "m": "em_alex",
           "text": "No me escogieron ustedes a mí, sino que yo los escogí a ustedes y los comisioné para que vayan y den fruto, un fruto que perdure. Así el Padre les dará todo lo que pidan en mi nombre."},
    "pt": {"code": "p", "f": "pf_dora",  "m": "pm_alex",
           "text": "Não fui vocês que me escolheram, mas fui eu que os escolhi e os designei para que vão e deem fruto, fruto que permaneça. Assim o Pai lhes dará tudo o que pedirem em meu nome."},
    "hi": {"code": "h", "f": "hf_alpha", "m": "hm_omega",
           "text": "तुम ने मुझे नहीं चुना, परन्तु मैं ने तुम्हें चुना और ठहराया कि तुम जाकर फल लाओ, और तुम्हारा फल बना रहे; कि तुम मेरे नाम से जो कुछ पिता से मांगो, वह तुम्हें दे।"},
    "fr": {"code": "f", "f": "ff_siwis", "m": None,
           "text": "Ce n'est pas vous qui m'avez choisi, c'est moi qui vous ai choisis, et je vous ai établis pour que vous alliez, que vous portiez du fruit, et que votre fruit demeure, afin que tout ce que vous demanderez au Père en mon nom, il vous l'accorde."},
    "it": {"code": "i", "f": "if_sara",  "m": "im_nicola",
           "text": "Non siete voi che avete scelto me, ma sono io che ho scelto voi, e vi ho costituiti perché andiate e portiate frutto, e il vostro frutto rimanga; affinché tutto quello che chiederete al Padre nel mio nome, Egli ve lo dia."},
    "zh": {"code": "z", "f": "zf_xiaobei", "m": "zm_yunyang",
           "text": "不是你们拣选了我，是我拣选了你们，并且分派你们去结果子，叫你们的果子常存，使你们奉我的名，无论向父求什么，他就赐给你们。"},
}

SR = 24000


def synth(pipeline, text, voice, out_path):
    chunks = [audio for _, _, audio in pipeline(text, voice=voice)]
    full = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
    sf.write(out_path, full, SR)
    return os.path.getsize(out_path) // 1024


def main():
    total = 0
    # one pipeline per lang_code (each loads its own G2P backend)
    pipelines = {}
    for code, cfg in LANGS.items():
        lc = cfg["code"]
        if lc not in pipelines:
            pipelines[lc] = KPipeline(lang_code=lc, repo_id="hexgrad/Kokoro-82M")
        pipe = pipelines[lc]
        for gender, key in (("kf", "f"), ("km", "m")):
            voice = cfg[key]
            if not voice:
                print(f"  [{code}] {gender}: no voice available, skipping")
                continue
            out = os.path.join(OUT_DIR, f"{code}-{gender}.wav")
            print(f"  Generating {code}-{gender}.wav ({voice})... ", end="", flush=True)
            try:
                kb = synth(pipe, cfg["text"], voice, out)
                print(f"done ({kb} KB)")
                total += 1
            except Exception as e:
                print(f"FAILED: {e}")
    print(f"\nDone: {total} Kokoro files in public/audio/")


if __name__ == "__main__":
    main()
