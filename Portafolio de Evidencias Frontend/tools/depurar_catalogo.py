
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent.parent
CARPETA = ROOT / "translations"

ENTRADA = CARPETA / "catalogo-extraido.json"
SALIDA_UI = CARPETA / "catalogo-traducible.json"
SALIDA_REVISION = CARPETA / "catalogo-revision.json"

# Patrones que suelen indicar contenido técnico o interno.
PATRONES_TECNICOS = [
    r"^https?://",
    r"^www\.",
    r"^#[a-zA-Z0-9_-]+$",
    r"^\.[a-zA-Z0-9_-]+$",
    r"^[a-zA-Z0-9_-]+\.(html|css|js|json)$",
    r"^[a-zA-Z0-9_./-]+$",
    r"^application/",
    r"^image/",
    r"^text/",
    r"^Bearer\s",
    r"^localhost",
    r"^\d+$",
    r"^[{}[\]();,.:]+$"
]

# Palabras o fragmentos frecuentes en código.
PALABRAS_TECNICAS = {
    "function",
    "return",
    "const",
    "let",
    "var",
    "async",
    "await",
    "undefined",
    "null",
    "true",
    "false",
    "onclick",
    "onchange",
    "console.log",
    "console.error",
    "console.warn",
    "localstorage",
    "sessionstorage",
    "innerhtml",
    "textcontent",
    "queryselector",
    "addEventListener",
    "fetch("
}


def parece_tecnico(texto):
    texto = texto.strip()

    for patron in PATRONES_TECNICOS:
        if re.search(patron, texto, re.IGNORECASE):
            return True

    texto_lower = texto.lower()

    if any(
        palabra.lower() in texto_lower
        for palabra in PALABRAS_TECNICAS
    ):
        return True

    return False


def necesita_revision(elemento):
    texto = elemento.get("texto", "")

    if elemento.get("clasificacion") == "revisar":
        return True

    if parece_tecnico(texto):
        return True

    # Cadenas muy cortas pueden ser siglas, códigos o etiquetas.
    if len(texto.strip()) <= 2:
        return True

    # Las cadenas con interpolaciones necesitan tratamiento especial.
    if re.search(r"\$\{.*?\}|%[sdif]|{{.*?}}", texto):
        return True

    return False


def main():
    if not ENTRADA.exists():
        print(f"[ERROR] No existe: {ENTRADA}")
        return

    with ENTRADA.open("r", encoding="utf-8") as archivo:
        catalogo = json.load(archivo)

    textos = catalogo.get("textos", [])

    traducibles = []
    revision = []

    for elemento in textos:
        if necesita_revision(elemento):
            revision.append(elemento)
        else:
            traducibles.append(elemento)

    # Conservamos el resumen original y añadimos los resultados.
    base = {
        "proyecto": catalogo.get("proyecto"),
        "idioma_origen": catalogo.get("idioma_origen"),
        "idiomas_destino": catalogo.get("idiomas_destino"),
    }

    salida_ui = {
        **base,
        "resumen": {
            "textos_originales": len(textos),
            "textos_seleccionados": len(traducibles)
        },
        "textos": traducibles
    }

    salida_revision = {
        **base,
        "resumen": {
            "textos_originales": len(textos),
            "textos_para_revision": len(revision)
        },
        "textos": revision
    }

    SALIDA_UI.write_text(
        json.dumps(salida_ui, ensure_ascii=False, indent=4),
        encoding="utf-8"
    )

    SALIDA_REVISION.write_text(
        json.dumps(salida_revision, ensure_ascii=False, indent=4),
        encoding="utf-8"
    )

    print("\nDEPURACIÓN TERMINADA")
    print(f"Textos originales: {len(textos)}")
    print(f"Seleccionados para traducción: {len(traducibles)}")
    print(f"Enviados a revisión: {len(revision)}")
    print(f"\nArchivo traducible: {SALIDA_UI}")
    print(f"Archivo de revisión: {SALIDA_REVISION}")


if __name__ == "__main__":
    main()
