//! Headless DOCX → PDF for the browser: read the package, lay it out and write the PDF with the
//! vetext crates. No UI, no file system, no network; fonts come in through [`add_font`].
#![forbid(unsafe_code)]

use std::collections::BTreeMap;

use wasm_bindgen::prelude::*;

/// Adds a font file (TTF, OTF, TTC or WOFF2) to the font database under `family`: the font's
/// own family for bundled fonts (from the font manifest), the name the document asks for
/// otherwise. Returns how many faces were added.
#[wasm_bindgen]
pub fn add_font(bytes: &[u8], family: &str) -> Result<u32, JsError> {
    if family.trim().is_empty() {
        return Err(JsError::new("add_font: family is required"));
    }
    let data = vetext_fonts::decode_font_file(bytes).map_err(|e| JsError::new(&e.to_string()))?;
    Ok(vetext_fonts::FontDb::global().add_document_fonts(vec![(data, family.to_string())]) as u32)
}

/// Reads a DOCX and reports what the conversion needs before any fonts are fetched: the fonts
/// embedded in the package (added to the database right away) and whether a password is needed.
/// JSON: `{"embedded":[name…],"encrypted":bool}`.
#[wasm_bindgen]
pub fn inspect(docx: &[u8]) -> Result<String, JsError> {
    if vetext_docx::is_encrypted(docx) {
        return Ok(serde_json::json!({ "embedded": [], "encrypted": true }).to_string());
    }
    let doc = vetext_docx::read(docx).map_err(|e| JsError::new(&e.to_string()))?;
    let embedded: Vec<String> = vetext_docx::embedded_fonts(&doc).into_iter().map(|f| f.name).collect();
    Ok(serde_json::json!({ "embedded": embedded, "encrypted": false }).to_string())
}

/// How each requested font resolves with the fonts loaded now.
/// `requests` is JSON `[[family, bold, italic]…]`; the answer is
/// `[{"family","bold","italic","face","substituted","synthBold","synthItalic"}…]`.
#[wasm_bindgen]
pub fn resolve_fonts(requests: &str) -> Result<String, JsError> {
    let reqs: Vec<(String, bool, bool)> = serde_json::from_str(requests).map_err(|e| JsError::new(&e.to_string()))?;
    let out: Vec<_> = reqs
        .into_iter()
        .take(4096)
        .map(|(family, bold, italic)| {
            let r = vetext_fonts::word::resolve(&family, bold, italic);
            let face = r.face.get();
            serde_json::json!({
                "family": family, "bold": bold, "italic": italic,
                "face": face.family, "style": face.style,
                "substituted": r.substituted, "synthBold": r.synth_bold, "synthItalic": r.synth_italic,
            })
        })
        .collect();
    Ok(serde_json::Value::Array(out).to_string())
}

/// Converts a DOCX to PDF. `password` opens encrypted documents (empty = none). The embedded
/// fonts are loaded first, as Word and LibreOffice do. Returns the PDF bytes.
#[wasm_bindgen]
pub fn convert(docx: &[u8], password: &str, tagged: bool) -> Result<Vec<u8>, JsError> {
    let pw = (!password.is_empty()).then_some(password);
    let doc = vetext_docx::read_with_password(docx, pw).map_err(|e| JsError::new(&e.to_string()))?;
    let files: Vec<(Vec<u8>, String)> = vetext_docx::embedded_fonts(&doc)
        .into_iter()
        .filter_map(|f| vetext_fonts::decode_font_file(&f.data).ok().map(|d| (d, f.name)))
        .collect();
    if !files.is_empty() {
        vetext_fonts::FontDb::global().add_document_fonts(files);
    }
    let opts = vetext_pdf::PdfOptions { tagged, ..Default::default() };
    vetext_pdf::export(&doc, &opts).map_err(|e| JsError::new(&e.to_string()))
}

/// Families in the font database (for diagnostics and tests).
#[wasm_bindgen]
pub fn families() -> String {
    let mut by: BTreeMap<String, ()> = BTreeMap::new();
    for f in vetext_fonts::FontDb::global().families() {
        by.insert(f, ());
    }
    serde_json::Value::Array(by.into_keys().map(serde_json::Value::String).collect()).to_string()
}
