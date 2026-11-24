
from html.parser import HTMLParser
from pathlib import Path
from collections import defaultdict
import json
import re
import hashlib

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "translations" / "catalogo-extraido.json"

ARCHIVOS_HTML = [
    "index.html",
    "login.html",
    "register.html",
    "forgot_password.html",
    "dashboard.html",
    "profile.html",
    "edit_profile.html",
    "academic_qualifications.html",
    "extracurricular_qualifications.html",
    "job_experience.html",
    "projects_practices.html",
    "skills.html",
    "interests.html",
    "dynamic_resume.html",
    "resume_preview.html",
    "public_profile.html",
    "guest.html",
    "more.html"
]

ATRIBUTOS = {
    "placeholder",
    "title",
    "aria-label",
    "alt"
}

IGNORAR = {"style", "noscript", "svg", "path"}

# Contextos JavaScript que suelen mostrar contenido al usuario.
# Se extraen cadenas literales, no expresiones ni variables.
PATRONES_JS = [
    (
        "ui_probable",
        r"\b(?:alert|confirm|prompt)\s*\(\s*(['\"])(.*?)\1"
    ),
    (
        "ui_probable",
        r"\b(?:showToast|showNotification|showMessage|"
        r"mostrarMensaje|mostrarNotificacion|setPreferencesStatus|"
        r"setStatus)\s*\(\s*(['\"])(.*?)\1"
    ),
    (
        "ui_probable",
        r"\.(?:textContent|innerText|innerHTML)\s*"
        r"(?:=|\+=)\s*(['\"])(.*?)\1"
    ),
    (
        "ui_probable",
        r"\.insertAdjacentHTML\s*\(\s*['\"](?:beforebegin|"
        r"afterbegin|beforeend|afterend)['\"]\s*,\s*(['\"])(.*?)\1"
    ),
    (
        "ui_probable",
        r"\.setAttribute\s*\(\s*['\"](?:placeholder|title|"
        r"aria-label|alt)['\"]\s*,\s*(['\"])(.*?)\1"
    ),
    (
        "ui_probable",
        r"\.value\s*=\s*(['\"])(.*?)\1"
    ),
    (
        "revisar",
        r"\b(?:throw\s+new\s+Error|new\s+Error)\s*\(\s*"
        r"(['\"])(.*?)\1"
    ),
    (
        "revisar",
        r"\b(?:console\.(?:error|warn|log))\s*\(\s*"
        r"(['\"])(.*?)\1"
    )
]

# Plantillas completas sin interpolaciones: `Texto visible`
PATRON_TEMPLATE = re.compile(
    r"`([^`$]*(?:\\.[^`$]*)*)`"
)

def limpiar(texto):
    return re.sub(r"\s+", " ", texto).strip()


def generar_id(texto):
    contenido = texto.casefold().encode("utf-8")
    return "txt_" + hashlib.sha256(contenido).hexdigest()[:12]


def decodificar_js(texto):
    """Decodifica escapes comunes sin alterar caracteres Unicode."""
    reemplazos = {
        r"\n": "\n",
        r"\r": "\r",
        r"\t": "\t",
        r"\/": "/",
        r"\'": "'",
        r'\"': '"',
        r"\\": "\\"
    }

    for origen, destino in reemplazos.items():
        texto = texto.replace(origen, destino)

    return texto


class ExtractorHTML(HTMLParser):

    def __init__(self, archivo):
        super().__init__(convert_charrefs=True)
        self.archivo = archivo
        self.resultados = []
        self.scripts = []
        self.pila_ignorar = []
        self.etiqueta_actual = None
        self.script_actual = None
        self.numero = 0

    def handle_starttag(self, tag, attrs):
        atributos = dict(attrs)

        if tag == "script":
            self.script_actual = {
                "contenido": "",
                "linea": self.getpos()[0]
            }
            return

        if tag in IGNORAR:
            self.pila_ignorar.append(tag)

        if self.pila_ignorar or self.script_actual is not None:
            return

        for atributo in ATRIBUTOS:
            valor = limpiar(atributos.get(atributo, ""))

            if valor:
                self.agregar(
                    valor, tag, atributo, "html"
                )

        if tag in {"input", "button"}:
            valor = limpiar(atributos.get("value", ""))

            if valor:
                self.agregar(
                    valor, tag, "value", "html"
                )

        self.etiqueta_actual = tag

    def handle_endtag(self, tag):
        if tag == "script" and self.script_actual is not None:
            self.scripts.append(self.script_actual)
            self.script_actual = None
            return

        if self.pila_ignorar:
            if tag == self.pila_ignorar[-1]:
                self.pila_ignorar.pop()
            return

        self.etiqueta_actual = None

    def handle_data(self, data):
        if self.script_actual is not None:
            self.script_actual["contenido"] += data
            return

        if self.pila_ignorar:
            return

        texto = limpiar(data)

        if texto:
            self.agregar(
                texto,
                self.etiqueta_actual or "text",
                "contenido",
                "html"
            )

    def agregar(
        self,
        texto,
        etiqueta,
        tipo,
        origen,
        linea=None,
        clasificacion="ui"
    ):
        texto = limpiar(texto)

        if not texto or not re.search(r"[A-Za-zÁÉÍÓÚáéíóúÑñ]", texto):
            return

        self.numero += 1

        self.resultados.append({
            "id": generar_id(texto),
            "texto": texto,
            "elemento": etiqueta,
            "tipo": tipo,
            "archivo": self.archivo,
            "origen": origen,
            "linea": linea,
            "clasificacion": clasificacion,
            "ocurrencia": self.numero
        })


def extraer_javascript(extractor):
    """Busca cadenas en contextos de interfaz dentro de cada script."""

    for script in extractor.scripts:
        codigo = script["contenido"]
        linea_base = script["linea"]

        for clasificacion, patron in PATRONES_JS:
            for coincidencia in re.finditer(
                patron, codigo, re.DOTALL
            ):
                texto = decodificar_js(coincidencia.group(2))
                linea = linea_base + codigo[:coincidencia.start()].count("\n")

                extractor.agregar(
                    texto,
                    "javascript",
                    "cadena_en_contexto",
                    "javascript",
                    linea,
                    clasificacion
                )

        # Plantillas sin interpolaciones: `Texto visible`
        for coincidencia in PATRON_TEMPLATE.finditer(codigo):
            texto = decodificar_js(coincidencia.group(1))
            linea = linea_base + codigo[:coincidencia.start()].count("\n")

            if texto and re.search(
                r"[A-Za-zÁÉÍÓÚáéíóúÑñ]", texto
            ):
                extractor.agregar(
                    texto,
                    "javascript",
                    "template_literal",
                    "javascript",
                    linea,
                    "revisar"
                )


def main():
    catalogo = defaultdict(list)
    archivos_procesados = []
    archivos_no_encontrados = []
    errores = []

    for nombre in ARCHIVOS_HTML:
        ruta = ROOT / nombre

        if not ruta.exists():
            archivos_no_encontrados.append(nombre)
            continue

        try:
            contenido = ruta.read_text(encoding="utf-8")

            extractor = ExtractorHTML(nombre)
            extractor.feed(contenido)
            extractor.close()

            extraer_javascript(extractor)

            for elemento in extractor.resultados:
                catalogo[elemento["id"]].append(elemento)

            html_count = sum(
                1 for x in extractor.resultados
                if x["origen"] == "html"
            )

            js_count = sum(
                1 for x in extractor.resultados
                if x["origen"] == "javascript"
            )

            archivos_procesados.append({
                "archivo": nombre,
                "html": html_count,
                "javascript": js_count,
                "total": len(extractor.resultados)
            })

            print(
                f"[OK] {nombre}: "
                f"{html_count} HTML, {js_count} JavaScript"
            )

        except Exception as error:
            errores.append({
                "archivo": nombre,
                "error": str(error)
            })
            print(f"[ERROR] {nombre}: {error}")

    textos = []

    for identificador, ocurrencias in catalogo.items():
        primera = ocurrencias[0]

        textos.append({
            "id": identificador,
            "texto": primera["texto"],
            "traducciones": {
                "es": primera["texto"],
                "en": "",
                "it": ""
            },
            "clasificacion": (
                "revisar"
                if any(
                    x["clasificacion"] == "revisar"
                    for x in ocurrencias
                )
                else "ui"
            ),
            "ocurrencias": ocurrencias
        })

    textos.sort(
        key=lambda elemento: elemento["texto"].casefold()
    )

    total_ocurrencias = sum(
        len(elemento["ocurrencias"])
        for elemento in textos
    )

    textos_html = sum(
        1 for elemento in textos
        if any(
            x["origen"] == "html"
            for x in elemento["ocurrencias"]
        )
    )

    textos_js = sum(
        1 for elemento in textos
        if any(
            x["origen"] == "javascript"
            for x in elemento["ocurrencias"]
        )
    )

    textos_revisar = sum(
        1 for elemento in textos
        if elemento["clasificacion"] == "revisar"
    )

    resultado = {
        "proyecto": "Portal de Evidencias",
        "idioma_origen": "es",
        "idiomas_destino": ["en", "it"],
        "resumen": {
            "archivos_procesados": len(archivos_procesados),
            "textos_unicos": len(textos),
            "ocurrencias_totales": total_ocurrencias,
            "textos_con_origen_html": textos_html,
            "textos_con_origen_javascript": textos_js,
            "textos_para_revision": textos_revisar,
            "archivos_no_encontrados": archivos_no_encontrados,
            "errores": errores
        },
        "archivos": archivos_procesados,
        "textos": textos
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    OUTPUT.write_text(
        json.dumps(resultado, ensure_ascii=False, indent=4),
        encoding="utf-8"
    )

    print("\nExtracción terminada.")
    print(f"Textos únicos: {len(textos)}")
    print(f"Con origen HTML: {textos_html}")
    print(f"Con origen JavaScript: {textos_js}")
    print(f"Para revisión: {textos_revisar}")
    print(f"Ocurrencias: {total_ocurrencias}")
    print(f"Resultado: {OUTPUT}")

    if archivos_no_encontrados:
        print("\nArchivos no encontrados:")
        for archivo in archivos_no_encontrados:
            print(f" - {archivo}")


if __name__ == "__main__":
    main()
