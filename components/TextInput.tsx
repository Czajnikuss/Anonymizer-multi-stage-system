import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ value, onChange }) => {
  return (
    <div className="w-full flex-grow flex flex-col">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter text to be anonymized here... 
For example:
"Zarząd firmy Innowacje Polskie S.A. informuje, że nowym Dyrektorem Działu Automatyzacji Procesów Biznesowych został Marek Lewandowski (tel. służbowy: +48 601-123-456, prywatny: +48 602-987-654, NIP 789-123-45-67). Projekt będzie nadzorowany przez Wiceprezesa ds. Operacyjnych Agnieszkę Kamińską (ur. 12.03.1979 w Warszawie, seria prawa jazdy: ABC123456/78/9012). Zespół prawny, prowadzony przez Radcę Prawnego Janinę Kowalską, jest dostępny pod adresem biuro@innowacjepolskie.pl oraz w siedzibie przy ul. Głównej 12/3, 00-500 Warszawa. Główny analityk, Michał Szymański (PESEL 85010112345), przygotował raport (LinkedIn: linkedin.com/in/michal-szymanski-analyst)."`}
        className="w-full h-64 lg:flex-grow p-4 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-300 text-gray-200 resize-none"
      />
    </div>
  );
};

export default TextInput;
