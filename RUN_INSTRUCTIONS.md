# Invoice Extraction App - Run Instructions

## Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- OpenAI API Key (Optional, uses Mock data if missing)

## 1. Backend Setup (Flask)
1. Open a terminal in the root directory: `c:\Users\Ai Intern\Downloads\Invoice-Ocr-flask-main\Invoice-Ocr-flask-main`
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your OpenAI API Key (Optional):
   - Create a `.env` file in the root.
   - Add: `OPENAI_API_KEY=sk-your-key-here`
4. Run the server:
   ```bash
   python app.py
   ```
   - The server will start at `http://localhost:5000`.

## 2. Frontend Setup (Next.js)
1. Open a new terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   - The app will be available at `http://localhost:3000`.

## 3. Usage Guide
1. Go to `http://localhost:3000`.
2. Upload a PDF Invoice or Image (PNG/JPG).
3. Wait for the extraction to complete.
4. Review the extracted data on the result page.
   - **Live Calculation:** Edit Quantity or Unit Price, and watch the Totals update instantly.
   - Adjust Tax Rate if needed.
5. Click **"Save Invoice"**.
6. You will be redirected to the **History Page**.
   - View all saved invoices.
   - Click **"Download Excel"** to get the specific file for that invoice.

## Troubleshooting
- **No Data Extracted?** Check if you have an API Key. If not, the app uses Mock Data for demonstration.
- **Upload Failed?** Ensure the backend is running on port 5000.
- **Download Failed?** Ensure you have saved the invoice first.
