'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, Trash, Calculator, RotateCcw } from 'lucide-react';

interface LineItem {
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
}

interface InvoiceData {
    invoice_number: string;
    invoice_date: string;
    customer_name: string;
    customer_address: string;
    subtotal: number;
    tax: number;
    total_amount: number;
    line_items: LineItem[];
}

export default function ResultPage() {
    const [data, setData] = useState<InvoiceData | null>(null);
    const [saving, setSaving] = useState(false);
    const [taxRate, setTaxRate] = useState<number>(10); // Default to 10%
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('invoiceData');
        if (stored) {
            const parsedData = JSON.parse(stored);
            // Ensure strict data types
            parsedData.subtotal = Number(parsedData.subtotal) || 0;
            parsedData.tax = Number(parsedData.tax) || 0;
            parsedData.total_amount = Number(parsedData.total_amount) || 0;
            parsedData.line_items = parsedData.line_items.map((item: any) => ({
                ...item,
                quantity: Number(item.quantity) || 0,
                unit_price: Number(item.unit_price) || 0,
                line_total: Number(item.line_total) || 0
            }));
            setData(parsedData);

            // Calculate inferred tax rate if possible
            if (parsedData.subtotal > 0 && parsedData.tax > 0) {
                setTaxRate((parsedData.tax / parsedData.subtotal) * 100);
            }
        } else {
            router.push('/');
        }
    }, [router]);

    // Live Calculation Logic
    const recalculateTotals = useCallback((currentData: InvoiceData) => {
        const newLineItems = currentData.line_items.map(item => ({
            ...item,
            line_total: Number((item.quantity * item.unit_price).toFixed(2))
        }));

        const newSubtotal = newLineItems.reduce((sum, item) => sum + item.line_total, 0);
        const newTax = Number((newSubtotal * (taxRate / 100)).toFixed(2));
        const newTotal = Number((newSubtotal + newTax).toFixed(2));

        return {
            ...currentData,
            line_items: newLineItems,
            subtotal: newSubtotal,
            tax: newTax,
            total_amount: newTotal
        };
    }, [taxRate]);

    // Effect to recalculate totals whenever dependencies change
    // Note: We trigger this on input changes, not just simple useEffect on 'data' to avoid loops
    const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
        if (!data) return;

        const newItems = [...data.line_items];
        // Cast strict numbers for calc fields
        if (field === 'quantity' || field === 'unit_price') {
            newItems[index] = { ...newItems[index], [field]: Number(value) };
        } else {
            newItems[index] = { ...newItems[index], [field]: value as any };
        }

        const updatedData = { ...data, line_items: newItems };
        const calculatedData = recalculateTotals(updatedData);
        setData(calculatedData);
    };

    const handleChange = (field: keyof InvoiceData, value: string | number) => {
        if (!data) return;
        setData({ ...data, [field]: value });
    };

    const handleTaxRateChange = (rate: number) => {
        setTaxRate(rate);
        if (!data) return;
        // Recalculate with new rate
        const newSubtotal = data.subtotal;
        const newTax = Number((newSubtotal * (rate / 100)).toFixed(2));
        const newTotal = Number((newSubtotal + newTax).toFixed(2));
        setData({
            ...data,
            tax: newTax,
            total_amount: newTotal
        });
    };

    const addLineItem = () => {
        if (!data) return;
        const newItem = { product_name: '', quantity: 1, unit_price: 0, line_total: 0 };
        const updatedData = { ...data, line_items: [...data.line_items, newItem] };
        setData(recalculateTotals(updatedData));
    };

    const removeLineItem = (index: number) => {
        if (!data) return;
        const newItems = data.line_items.filter((_, i) => i !== index);
        const updatedData = { ...data, line_items: newItems };
        setData(recalculateTotals(updatedData));
    };

    const handleSave = async () => {
        if (!data) return;
        setSaving(true);
        try {
            await axios.post('http://localhost:5000/save-invoice', data);
            // Show success feedback
            alert('Invoice Saved Successfully!');
            router.push('/history');
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.error || 'Failed to save to Excel.';
            alert(`Error: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    if (!data) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600">
            <RotateCcw className="animate-spin w-8 h-8 mr-2" /> Loading Invoice...
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Sticky Top Bar */}
            <div className="sticky top-0 z-30 bg-white shadow-md border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-800 transition">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 leading-tight">Review Extraction</h1>
                            <p className="text-xs text-gray-400">Live Calculation Enabled</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] uppercase font-bold text-gray-400">Grand Total</p>
                            <p className="text-xl font-bold text-green-600 transition-all duration-300">
                                ${data.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center font-semibold disabled:opacity-50 shadow-lg transition transform active:scale-95"
                        >
                            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Invoice'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Invoice Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Client Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Invoice Number</label>
                                <input
                                    type="text"
                                    value={data.invoice_number || ''}
                                    onChange={(e) => handleChange('invoice_number', e.target.value)}
                                    className="w-full bg-white border border-gray-300 text-gray-900 font-medium p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="Enter Invoice #"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Invoice Date</label>
                                <input
                                    type="text"
                                    value={data.invoice_date || ''}
                                    onChange={(e) => handleChange('invoice_date', e.target.value)}
                                    className="w-full bg-white border border-gray-300 text-gray-900 font-medium p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="YYYY-MM-DD"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    value={data.customer_name || ''}
                                    onChange={(e) => handleChange('customer_name', e.target.value)}
                                    className="w-full bg-white border border-gray-300 text-gray-900 font-medium p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="Customer Name"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Customer Address</label>
                                <textarea
                                    value={data.customer_address || ''}
                                    onChange={(e) => handleChange('customer_address', e.target.value)}
                                    className="w-full bg-white border border-gray-300 text-gray-900 font-medium p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition h-20 resize-none"
                                    placeholder="Full Address"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Line Items</h3>
                            <button onClick={addLineItem} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center">
                                <Plus className="w-3 h-3 mr-1" /> Add Item
                            </button>
                        </div>

                        <div className="overflow-x-auto -mx-6 px-6">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-2 font-semibold border-b">Product</th>
                                        <th className="py-3 px-2 w-20 text-center border-b">Qty</th>
                                        <th className="py-3 px-2 w-28 text-right border-b">Unit Price</th>
                                        <th className="py-3 px-2 w-28 text-right border-b">Total</th>
                                        <th className="py-3 px-2 w-10 border-b"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.line_items.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50 transition">
                                            <td className="py-3 px-2">
                                                <input
                                                    type="text"
                                                    value={item.product_name || ''}
                                                    onChange={(e) => handleLineItemChange(idx, 'product_name', e.target.value)}
                                                    className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:bg-white focus:border-blue-500 rounded px-2 py-1 text-gray-900 font-medium outline-none transition"
                                                    placeholder="Item name"
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.quantity}
                                                    onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                                                    className="w-full text-center bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-gray-900 font-medium outline-none py-1.5"
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1.5 text-gray-400">$</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_price}
                                                        onChange={(e) => handleLineItemChange(idx, 'unit_price', e.target.value)}
                                                        className="w-full text-right bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-gray-900 font-medium outline-none py-1.5 pl-4"
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right font-bold text-gray-900">
                                                ${item.line_total.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <button onClick={() => removeLineItem(idx)} className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition">
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Col: Summary & Totals */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center">
                            <Calculator className="w-4 h-4 mr-2" /> Payment Summary
                        </h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-semibold">${data.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600">
                                <span className="flex items-center gap-2">
                                    Tax
                                    <input
                                        type="number"
                                        value={taxRate}
                                        onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
                                        className="w-12 text-xs bg-gray-100 rounded px-1 py-0.5 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    %
                                </span>
                                <span className="font-semibold">${data.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="h-px bg-dashed bg-gray-200 my-4"></div>
                            <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                                <span>Total Amount</span>
                                <span className="text-green-600">${data.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
