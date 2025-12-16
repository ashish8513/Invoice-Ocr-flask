import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI Client (Will use mocked response if key is missing/invalid logic handled below)
# Note: In a real demo, we assume the user puts a key in .env or the environment.
# For this "Mock key if needed" requirement, I'll fallback if the call fails or if key is empty.

client = None
api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    client = OpenAI(api_key=api_key)

SYSTEM_PROMPT = """
You are an expert Data Extraction AI. Extract structured data from the provided invoice.
Return ONLY valid JSON. No markdown formatting. No preamble.

Required JSON Structure:
{
    "invoice_number": "string",
    "invoice_date": "YYYY-MM-DD",
    "customer_name": "string",
    "customer_address": "string",
    "subtotal": number,
    "tax": number,
    "total_amount": number,
    "line_items": [
        {
            "product_name": "string",
            "quantity": number,
            "unit_price": number,
            "line_total": number
        }
    ]
}

Mapping Rules:
- "Invoice No", "Bill No", "Ref No" -> invoice_number
- "Date", "Issued Date" -> invoice_date (Convert to YYYY-MM-DD)
- "Billed To", "Client" -> customer_name & customer_address
- "Total", "Grand Total" -> total_amount
- If a field is missing, use null.
"""

MOCK_RESPONSE = {
    "invoice_number": "INV-MOCK-001",
    "invoice_date": "2024-12-16",
    "customer_name": "John Doe Enterprises",
    "customer_address": "123 Mock Street, AI City, 90210",
    "subtotal": 1000.00,
    "tax": 100.00,
    "total_amount": 1100.00,
    "line_items": [
        {
            "product_name": "AI Consultation Service",
            "quantity": 10,
            "unit_price": 100.00,
            "line_total": 1000.00
        }
    ]
}

def extract_data(input_data):
    """
    input_data: dict with 'type' ('text' or 'image') and 'content'
    """
    if not client:
        print("No OpenAI API Key found. Returning Mock Data.")
        return MOCK_RESPONSE

    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]

        if input_data['type'] == 'text':
            messages.append({"role": "user", "content": f"Extract data from this invoice text:\n\n{input_data['content']}"})
        elif input_data['type'] == 'image':
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract data from this invoice image."},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{input_data['content']}"
                        }
                    }
                ]
            })
        
        response = client.chat.completions.create(
            model="gpt-4o" if input_data['type'] == 'image' else "gpt-3.5-turbo",
            messages=messages,
            temperature=0,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        print(f"LLM Extraction failed: {e}. Returning MOCK data for demo stability.")
        return MOCK_RESPONSE
