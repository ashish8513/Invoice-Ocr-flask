from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re

from ocr import extract_text
from excel_db import init_excel, save_to_excel

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs("database", exist_ok=True)
init_excel()


def parse_invoice(text):
    """
    Simple rule-based parsing (Excel mapping demo ke liye)
    """
    invoice_no = re.search(r"Invoice\s*No[:\-]?\s*(\w+)", text)
    date = re.search(r"Date[:\-]?\s*([\d/.-]+)", text)
    total = re.search(r"Total[:\-]?\s*([\d.]+)", text)
    tax = re.search(r"Tax[:\-]?\s*([\d.]+)", text)

    header = {
        "InvoiceNumber": invoice_no.group(1) if invoice_no else "INV-001",
        "InvoiceDate": date.group(1) if date else "2025-01-01",
        "CustomerName": "Demo Customer",
        "TotalAmount": total.group(1) if total else "0",
        "Tax": tax.group(1) if tax else "0"
    }

    items = [
        {
            "InvoiceNumber": header["InvoiceNumber"],
            "Product": "Sample Product",
            "Quantity": 1,
            "UnitPrice": header["TotalAmount"]
        }
    ]

    return header, items


@app.route("/", methods=["GET"])
def health():
    return {"status": "Invoice OCR Backend Ready"}


@app.route("/upload", methods=["POST"])
def upload_invoice():
    if "file" not in request.files:
        return {"error": "No file uploaded"}, 400

    file = request.files["file"]
    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    text = extract_text(path)
    header, items = parse_invoice(text)

    save_to_excel(header, items)

    return jsonify({
        "message": "Invoice processed successfully",
        "header": header,
        "items": items
    })


if __name__ == "__main__":
    app.run(debug=True)
