'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Loader2, History } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload-invoice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Save to localStorage to pass to result page
      localStorage.setItem('invoiceData', JSON.stringify(response.data));
      router.push('/result');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to extract data via LLM');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-4xl text-center mb-10 space-y-4">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
          Invoice AI <span className="text-blue-600">Extractor</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload any PDF or Image invoice. Our AI will automatically extract data, allow calculations, and save it to your database.
        </p>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 transition-all hover:shadow-2xl">
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center hover:bg-gray-50 transition">
            <Upload className="w-16 h-16 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-gray-600 mb-2">Drag & Drop or Click to Upload</p>
            <p className="text-xs text-gray-400">PDF, PNG, JPG supported</p>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {file && (
          <div className="mt-6 flex items-center p-3 bg-blue-50 rounded-lg text-blue-700 border border-blue-100 animate-fade-in-up">
            <FileText className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{file.name}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`mt-6 w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-white font-bold tracking-wide transition-all transform
            ${!file || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg active:scale-95'}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing Invoice...
            </>
          ) : (
            'Extract Data'
          )}
        </button>
      </div>

      <div className="mt-10">
        <button
          onClick={() => router.push('/history')}
          className="flex items-center text-gray-500 hover:text-blue-600 font-medium transition-colors px-6 py-3 rounded-full bg-white shadow-sm hover:shadow-md border border-gray-200"
        >
          <History className="w-4 h-4 mr-2" />
          View Saved Invoices
        </button>
      </div>
    </main>
  );
}
