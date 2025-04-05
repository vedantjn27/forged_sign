import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, AlertCircle, CheckCircle2, FileSignature, BarChart3, Moon, Sun, ChevronDown, ChevronUp, Download, History, Trash2, ZoomIn } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PredictionResult {
  genuine_label: string;
  forged_label: string;
  final_label: string;
  confidence: number;
  timestamp?: string;
}

interface HistoryItem extends PredictionResult {
  id: string;
  genuineImage: string;
  forgedImage: string;
}

function App() {
  const [genuineFile, setGenuineFile] = useState<File | null>(null);
  const [forgedFile, setForgedFile] = useState<File | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [showGraphs, setShowGraphs] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (result?.final_label === 'Forged') {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!genuineFile || !forgedFile) {
      alert("Please upload both files");
      return;
    }

    const formData = new FormData();
    formData.append("genuine", genuineFile);
    formData.append("forged", forgedFile);

    try {
      setLoading(true);
      const response = await axios.post("http://127.0.0.1:5000/predict", formData);
      const newResult = {
        ...response.data,
        timestamp: new Date().toISOString(),
      };
      setResult(newResult);

      // Add to history
      const historyItem: HistoryItem = {
        ...newResult,
        id: Math.random().toString(36).substr(2, 9),
        genuineImage: URL.createObjectURL(genuineFile),
        forgedImage: URL.createObjectURL(forgedFile),
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 10)); // Keep last 10 items
    } catch (error) {
      console.error("Error during prediction:", error);
      alert("Failed to predict. Check console for more details.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (type: 'genuine' | 'forged') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'genuine') {
        setGenuineFile(e.target.files[0]);
      } else {
        setForgedFile(e.target.files[0]);
      }
    }
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

  const handleExport = () => {
    if (!result) return;
    
    const data = {
      result,
      timestamp: new Date().toISOString(),
      analysis: {
        genuine_confidence: result.genuine_label === 'Genuine' ? result.confidence : 100 - result.confidence,
        forged_confidence: result.forged_label === 'Forged' ? result.confidence : 100 - result.confidence,
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signature-analysis-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} py-12 px-4 sm:px-6 lg:px-8`}>
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-4 right-4 p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'} transition-colors duration-200`}
      >
        {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </button>

      {/* History Toggle */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className={`fixed top-4 right-16 p-2 rounded-full ${darkMode ? 'bg-gray-700 text-blue-300' : 'bg-gray-200 text-gray-700'} transition-colors duration-200`}
      >
        <History className="h-6 w-6" />
      </button>

      {/* Forged Alert */}
      {showAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce">
          <AlertCircle className="h-5 w-5" />
          <span>Warning: Potential forgery detected!</span>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="max-w-4xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-800 p-4 rounded-lg">
            <img src={selectedImage} alt="Enlarged view" className="w-full h-auto" />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <FileSignature className={`h-12 w-12 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} mx-auto mb-4`} />
          <h1 className={`text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Inkspector</h1>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Upload signatures to detect potential forgeries</p>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Analysis History</h2>
              <button
                onClick={clearHistory}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <Trash2 className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
              </button>
            </div>
            {history.length === 0 ? (
              <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No history available</p>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Result: <span className={item.final_label === 'Genuine' ? 'text-green-500' : 'text-red-500'}>{item.final_label}</span>
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Confidence: {item.confidence.toFixed(2)}%
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(item.timestamp!).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedImage(item.genuineImage);
                            setShowImageModal(true);
                          }}
                          className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                        >
                          <ZoomIn className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8`}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Genuine Signature Upload */}
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Genuine Signature</label>
                <div className={`relative border-2 border-dashed ${darkMode ? 'border-gray-600 hover:border-indigo-400' : 'border-gray-300 hover:border-indigo-500'} rounded-lg p-6 transition-colors`}>
                  <input
                    type="file"
                    onChange={handleFileUpload('genuine')}
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <div className="text-center">
                    <Upload className={`mx-auto h-12 w-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Upload genuine signature</p>
                  </div>
                  {genuineFile && (
                    <div className="relative mt-4">
                      <img
                        src={URL.createObjectURL(genuineFile)}
                        alt="Genuine Signature"
                        className="w-full h-48 object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(URL.createObjectURL(genuineFile));
                          setShowImageModal(true);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-opacity"
                      >
                        <ZoomIn className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Forged Signature Upload */}
              <div className="space-y-4">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Test Signature</label>
                <div className={`relative border-2 border-dashed ${darkMode ? 'border-gray-600 hover:border-indigo-400' : 'border-gray-300 hover:border-indigo-500'} rounded-lg p-6 transition-colors`}>
                  <input
                    type="file"
                    onChange={handleFileUpload('forged')}
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <div className="text-center">
                    <Upload className={`mx-auto h-12 w-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Upload test signature</p>
                  </div>
                  {forgedFile && (
                    <div className="relative mt-4">
                      <img
                        src={URL.createObjectURL(forgedFile)}
                        alt="Test Signature"
                        className="w-full h-48 object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(URL.createObjectURL(forgedFile));
                          setShowImageModal(true);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-opacity"
                      >
                        <ZoomIn className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`
                  flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white
                  ${loading ? 'bg-indigo-400' : `${darkMode ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                `}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Processing...
                  </>
                ) : (
                  'Analyze Signatures'
                )}
              </button>
            </div>
          </form>

          {/* Results Section */}
          {result && (
            <div className="mt-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-lg ${result.final_label === 'Genuine' 
                  ? (darkMode ? 'bg-green-900/50' : 'bg-green-50') 
                  : (darkMode ? 'bg-red-900/50' : 'bg-red-50')}`}>
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Final Verdict</h3>
                  <div className="flex items-center">
                    {result.final_label === 'Genuine' ? (
                      <CheckCircle2 className={`h-5 w-5 ${darkMode ? 'text-green-400' : 'text-green-500'} mr-2`} />
                    ) : (
                      <AlertCircle className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'} mr-2`} />
                    )}
                    <span className={`font-semibold ${
                      result.final_label === 'Genuine' 
                        ? (darkMode ? 'text-green-400' : 'text-green-700')
                        : (darkMode ? 'text-red-400' : 'text-red-700')
                    }`}>
                      {result.final_label}
                    </span>
                  </div>
                </div>

                <div className={`p-6 rounded-lg ${darkMode ? 'bg-blue-900/50' : 'bg-blue-50'}`}>
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Confidence Score</h3>
                  <div className="flex items-center">
                    <BarChart3 className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'} mr-2`} />
                    <span className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                      {result.confidence.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className={`p-6 rounded-lg ${darkMode ? 'bg-purple-900/50' : 'bg-purple-50'}`}>
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Export Results</h3>
                  <button
                    onClick={handleExport}
                    className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>

              {/* Graphs Toggle Button */}
              <button
                onClick={() => setShowGraphs(!showGraphs)}
                className={`w-full flex items-center justify-between p-4 rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                } transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  <span className="font-medium">View Detailed Graphs</span>
                </div>
                {showGraphs ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {/* Confidence Chart */}
              {showGraphs && (
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-6 rounded-lg shadow transition-all duration-300 ease-in-out`}>
                  <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Confidence Analysis</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis 
                          dataKey="name" 
                          stroke={darkMode ? '#9CA3AF' : '#4B5563'}
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          stroke={darkMode ? '#9CA3AF' : '#4B5563'}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: darkMode ? '#E5E7EB' : '#111827'
                          }}
                        />
                        <Bar dataKey="confidence" fill={darkMode ? '#818CF8' : '#6366f1'} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;