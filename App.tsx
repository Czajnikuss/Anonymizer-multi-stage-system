import React, { useState, useCallback } from 'react';
import { AnonymizationStrategy } from './types';
import Header from './components/Header';
import TextInput from './components/TextInput';
import AnonymizationOptions from './components/AnonymizationOptions';
import ResultDisplay from './components/ResultDisplay';
import Footer from './components/Footer';
import { anonymizeText } from './services/apiService';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [strategy, setStrategy] = useState<AnonymizationStrategy>(AnonymizationStrategy.TAG);
  const [anonymizedText, setAnonymizedText] = useState<string>('');
  const [anonymizationId, setAnonymizationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleAnonymize = useCallback(async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to anonymize.');
      return;
    }
    setError('');
    setIsLoading(true);
    setAnonymizedText('');
    setAnonymizationId('');

    try {
      const result = await anonymizeText(inputText, strategy);
      setAnonymizedText(result.anonymizedText);
      setAnonymizationId(result.anonymizationId);
    } catch (err) {
      setError('An error occurred during anonymization. Please check if the backend service is running and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, strategy]);

  const handleDeAnonymize = useCallback(async () => {
    if (!anonymizationId) {
      setError('No anonymization ID found to de-anonymize.');
      return;
    }
    setError('De-anonymization feature must be implemented in the backend.');
  }, [anonymizationId]);
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2 flex flex-col space-y-6">
          <h2 className="text-2xl font-bold text-cyan-400">Input Data</h2>
          <AnonymizationOptions strategy={strategy} setStrategy={setStrategy} />
          <TextInput value={inputText} onChange={setInputText} />
          <div className="flex space-x-4">
            <button
              onClick={handleAnonymize}
              disabled={isLoading}
              className="w-full flex justify-center items-center bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-900 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out shadow-lg"
            >
              {isLoading ? <LoadingSpinner/> : 'Anonymize Text'}
            </button>
            <button
              onClick={handleDeAnonymize}
              disabled={isLoading || !anonymizationId}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out shadow-lg"
            >
              De-anonymize
            </button>
          </div>
           {error && <p className="text-red-400 text-center mt-2">{error}</p>}
        </div>
        <div className="lg:w-1/2 flex flex-col space-y-6">
           <h2 className="text-2xl font-bold text-teal-400">Anonymized Result</h2>
          <ResultDisplay
            anonymizedText={anonymizedText}
            anonymizationId={anonymizationId}
            isLoading={isLoading}
            onCopy={handleCopy}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
