from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from services.ocr_service import extract_content
from services.llm_service import extract_data
from services.excel_service import save_invoice, initialize_db, get_all_invoices, get_invoice_excel

app = Flask(__name__)
CORS(app)

# Ensure DB is ready on startup
initialize_db()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/upload-invoice', methods=['POST'])
def upload_invoice():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Save temp file
    temp_path = os.path.join(os.getcwd(), 'temp_' + file.filename)
    file.save(temp_path)

    try:
        # Step 1: OCR / Content Extraction
        content_data = extract_content(temp_path)
        if content_data.get('type') == 'error':
            return jsonify({"error": content_data['content']}), 400

        # Step 2: LLM Extraction
        extracted_data = extract_data(content_data)
        
        return jsonify(extracted_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/save-invoice', methods=['POST'])
def save_invoice_route():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    try:
        if save_invoice(data):
            return jsonify({"status": "success", "message": "Invoice saved to Excel."})
        else:
            return jsonify({"error": "Failed to save invoice."}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

@app.route('/invoices', methods=['GET'])
def get_invoices_route():
    try:
        invoices = get_all_invoices()
        return jsonify(invoices)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/invoice/<invoice_id>/download', methods=['GET'])
def download_invoice_route(invoice_id):
    try:
        excel_io, filename = get_invoice_excel(invoice_id)
        if not excel_io:
            return jsonify({"error": "Invoice not found"}), 404
        
        return send_file(
            excel_io,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
