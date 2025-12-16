import base64
import os
from pypdf import PdfReader

def extract_content(file_path):
    """
    Determines file type and extracts content accordingly.
    Returns a dict with 'type' ('text' or 'image') and 'content'.
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == '.pdf':
        try:
            return _extract_text_from_pdf(file_path)
        except Exception as e:
            print(f"PDF Extraction failed, falling back to image-like processing (not implemented in this simplified demo, assuming text PDF): {e}")
            return {"type": "error", "content": "Could not read PDF text."}
    elif ext in ['.png', '.jpg', '.jpeg']:
        return _encode_image(file_path)
    else:
        return {"type": "error", "content": "Unsupported file format."}

def _extract_text_from_pdf(file_path):
    text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return {"type": "text", "content": text}
    except Exception as e:
        raise e

def _encode_image(file_path):
    with open(file_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return {"type": "image", "content": encoded_string}
