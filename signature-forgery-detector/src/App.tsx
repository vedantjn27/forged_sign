import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, AlertCircle, CheckCircle2, FileSignature, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PredictionResult {
  genuine_label: string;
  forged_label: string;
  final_label: string;
  confidence: number;
}

function App() {
  const [genuineFile, setGenuineFile] = useState<File | null>(null);
  const [forgedFile, setForgedFile] = useState<File | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!genuineFile || !forgedFile) {
      setError("Please upload both files.");
      return;
    }

    const formData = new FormData();
    formData.append("genuine", genuineFile);
    formData.append("forged", forgedFile);

    try {
      setLoading(true);
      setError(null); // Reset error state before request
      const response = await axios.post("http://127.0.0.1:5000/predict", formData);
      setResult(response.data);
    } catch (error) {
      console.error("Error during prediction:", error);
      setError("Failed to predict. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (type: 'genuine' | 'forged') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return; // Prevent setting null values
    type === 'genuine' ? setGenuineFile(file) : setForgedFile(file);
  };

  const getChartData = () => {
    if (!result) return [];
    return [
      {
        name: 'Genuine Signature',
        confidence: result.genuine_label === 'Genuine' ? result.confidence : 100 - result.confidence,
      },
      {
        name: 'Forged Signature',
        confidence: result.forged_label === 'Forged' ? result.confidence : 100 - result.confidence,
      },
    ];
  };

  useEffect(() => {
    let genuineURL: string | null = null;
    let forgedURL: string | null = null;

    if (genuineFile) genuineURL = URL.createObjectURL(genuineFile);
    if (forgedFile) forgedURL = URL.createObjectURL(forgedFile);

    return () => {
      if (genuineURL) URL.revokeObjectURL(genuineURL);
      if (forgedURL) URL.revokeObjectURL(forgedURL);
    };
  }, [genuineFile, forgedFile]);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <FileSignature className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900">Signature Forgery Detector</h1>
          <p className="text-lg text-gray-600">Upload signatures to detect potential forgeries</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[['genuine', 'Genuine Signature'], ['forged', 'Test Signature']].map(([type, label]) => (
                <div key={type} className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">{label}</label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-500 transition">
                    <input
                      type="file"
                      onChange={handleFileUpload(type as 'genuine' | 'forged')}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Upload {label.toLowerCase()}</p>
                    </div>
                    {type === 'genuine' && genuineFile && (
                      <img src={URL.createObjectURL(genuineFile)} alt={label} className="mt-4 w-full h-48 object-contain rounded-lg" />
                    )}
                    {type === 'forged' && forgedFile && (
                      <img src={URL.createObjectURL(forgedFile)} alt={label} className="mt-4 w-full h-48 object-contain rounded-lg" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-3 rounded-md text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} transition`}
              >
                {loading ? 'Processing...' : 'Analyze Signatures'}
              </button>
            </div>

            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </form>

          {result && (
            <div className="mt-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-lg ${result.final_label === 'Genuine' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <h3 className="text-lg font-medium">Final Verdict</h3>
                  <div className="flex items-center">
                    {result.final_label === 'Genuine' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={`font-semibold ${result.final_label === 'Genuine' ? 'text-green-700' : 'text-red-700'}`}>
                      {result.final_label}
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-lg bg-blue-50">
                  <h3 className="text-lg font-medium">Confidence Score</h3>
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold text-blue-700">{result ? `${result.confidence.toFixed(2)}%` : "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium">Confidence Analysis</h3>
                {result && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="confidence" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
