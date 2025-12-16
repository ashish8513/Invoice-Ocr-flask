'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileSpreadsheet, Search } from 'lucide-react';

interface InvoiceRecord {
    invoice_id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
    created_at: string;
}

export default function HistoryPage() {
    const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await axios.get('http://localhost:5000/invoices');
            // Sort by latest
            const sorted = response.data.sort((a: InvoiceRecord, b: InvoiceRecord) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setInvoices(sorted);
        } catch (err) {
            console.error(err);
            setError('Failed to load history.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
        try {
            const response = await axios.get(`http://localhost:5000/invoice/${invoiceId}/download`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
            link.setAttribute('download', `invoice_${invoiceNumber}_${timestamp}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download Excel file.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-800 transition">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">Invoice History</h1>
                    </div>

                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 animate-pulse">Loading records...</div>
                ) : error ? (
                    <div className="text-center py-20 text-red-500 bg-white rounded-lg shadow-sm p-8">
                        {error}
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No invoices found</h3>
                        <p className="text-gray-500 mb-6">Upload your first invoice to get started.</p>
                        <button onClick={() => router.push('/')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                            Upload Invoice
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-4">Created At</th>
                                    <th className="px-6 py-4">Invoice #</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4 text-right">Total Amount</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.map((inv, idx) => (
                                    <tr key={inv.invoice_id || idx} className="hover:bg-blue-50/50 transition duration-150">
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {inv.created_at ? new Date(inv.created_at).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {inv.invoice_number}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {inv.customer_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                            ${Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDownload(inv.invoice_id, inv.invoice_number)}
                                                className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition border border-green-200"
                                            >
                                                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                                                Download Excel
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
