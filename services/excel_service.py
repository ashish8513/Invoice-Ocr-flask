import pandas as pd
import os
import uuid
import io
from datetime import datetime

DATA_DIR = os.path.join(os.getcwd(), 'data')
HEADER_FILE = os.path.join(DATA_DIR, 'sales_order_header.xlsx')
DETAIL_FILE = os.path.join(DATA_DIR, 'sales_order_detail.xlsx')

def initialize_db():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    # Headers definition
    header_cols = [
        'invoice_id', 'invoice_number', 'invoice_date', 'customer_name', 
        'customer_address', 'subtotal', 'tax', 'total_amount', 'created_at'
    ]
    detail_cols = [
        'invoice_id', 'invoice_number', 'product_name', 'quantity', 
        'unit_price', 'line_total', 'created_at'
    ]

    # Ensure Header File exists and has correct columns
    if not os.path.exists(HEADER_FILE):
        df_header = pd.DataFrame(columns=header_cols)
        df_header.to_excel(HEADER_FILE, index=False)
    else:
        # Migration: Check if columns exist, if not, add them (re-save)
        try:
            df = pd.read_excel(HEADER_FILE)
            missing = [c for c in header_cols if c not in df.columns]
            if missing:
                print(f"Migrating Header DB, adding: {missing}")
                for c in missing:
                    df[c] = None
                df.to_excel(HEADER_FILE, index=False)
        except Exception as e:
            print(f"DB Init Error (Header): {e}")

    # Ensure Detail File exists and has correct columns
    if not os.path.exists(DETAIL_FILE):
        df_detail = pd.DataFrame(columns=detail_cols)
        df_detail.to_excel(DETAIL_FILE, index=False)
    else:
        try:
            df = pd.read_excel(DETAIL_FILE)
            missing = [c for c in detail_cols if c not in df.columns]
            if missing:
                print(f"Migrating Detail DB, adding: {missing}")
                for c in missing:
                    df[c] = None
                df.to_excel(DETAIL_FILE, index=False)
        except Exception as e:
             print(f"DB Init Error (Detail): {e}")

def save_invoice(data):
    initialize_db()
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    invoice_id = str(uuid.uuid4())
    invoice_number = data.get('invoice_number', 'UNKNOWN')

    # Prepare Header Logic
    header_data = {
        'invoice_id': invoice_id,
        'invoice_number': invoice_number,
        'invoice_date': data.get('invoice_date'),
        'customer_name': data.get('customer_name'),
        'customer_address': data.get('customer_address'),
        'subtotal': data.get('subtotal'),
        'tax': data.get('tax'),
        'total_amount': data.get('total_amount'),
        'created_at': timestamp
    }
    
    # Save Header
    try:
        df_header_existing = pd.read_excel(HEADER_FILE)
        df_new_header = pd.DataFrame([header_data])
        df_header_final = pd.concat([df_header_existing, df_new_header], ignore_index=True)
        df_header_final.to_excel(HEADER_FILE, index=False)
    except PermissionError:
        print("Error: Excel file is open. Please close it.")
        raise Exception("Excel file is open. Please close it.")
    except Exception as e:
        print(f"Error saving header: {e}")
        raise e

    # Prepare Detail Logic
    line_items = data.get('line_items', [])
    detail_rows = []
    for item in line_items:
        detail_rows.append({
            'invoice_id': invoice_id,
            'invoice_number': invoice_number,
            'product_name': item.get('product_name'),
            'quantity': item.get('quantity'),
            'unit_price': item.get('unit_price'),
            'line_total': item.get('line_total'),
            'created_at': timestamp
        })
    
    if detail_rows:
        try:
            df_detail_existing = pd.read_excel(DETAIL_FILE)
            df_new_detail = pd.DataFrame(detail_rows)
            df_detail_final = pd.concat([df_detail_existing, df_new_detail], ignore_index=True)
            df_detail_final.to_excel(DETAIL_FILE, index=False)
        except PermissionError:
            print("Error: Excel file is open. Please close it.")
            raise Exception("Excel file is open. Please close it.")
        except Exception as e:
            print(f"Error saving details: {e}")
            raise e

    return True

def get_all_invoices():
    initialize_db()
    try:
        df = pd.read_excel(HEADER_FILE)
        # Convert NaN to None for JSON serialization
        return df.where(pd.notnull(df), None).to_dict(orient='records')
    except Exception as e:
        print(f"Error reading invoices: {e}")
        return []

def get_invoice_excel(invoice_id):
    initialize_db()
    try:
        # Load Data
        df_header = pd.read_excel(HEADER_FILE)
        df_detail = pd.read_excel(DETAIL_FILE)
        
        # Filter
        header = df_header[df_header['invoice_id'] == invoice_id]
        details = df_detail[df_detail['invoice_id'] == invoice_id]
        
        if header.empty:
            return None, None
            
        invoice_number = header.iloc[0]['invoice_number']
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"invoice_{invoice_number}_{timestamp}.xlsx"
        
        # Write to BytesIO
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            header.to_excel(writer, sheet_name='Header', index=False)
            details.to_excel(writer, sheet_name='Line Items', index=False)
            
        output.seek(0)
        return output, filename
        
    except Exception as e:
        print(f"Error generating invoice excel: {e}")
        return None, None
