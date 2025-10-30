import React from 'react';
import type { StyleSettings } from '../types';

interface StyleEditorProps {
  styles: StyleSettings;
  setStyles: React.Dispatch<React.SetStateAction<StyleSettings>>;
}

interface StyleFieldProps {
    label: string;
    name: keyof StyleSettings;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    type?: 'color' | 'text' | 'select';
    options?: string[];
}

const StyleField: React.FC<StyleFieldProps> = ({ label, name, value, onChange, type = 'color', options }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 flex items-center gap-2">
            {type === 'color' && (
                 <div className="relative">
                    <input
                        type="color"
                        name={name}
                        id={name}
                        value={value}
                        onChange={onChange}
                        className="w-10 h-10 p-1 border border-gray-300 rounded-md cursor-pointer appearance-none"
                    />
                </div>
            )}
            {type === 'select' && options ? (
                <select name={name} id={name} value={value} onChange={onChange} className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm rounded-md">
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input
                    type="text"
                    name={name}
                    id={name}
                    value={value}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm"
                />
            )}
        </div>
    </div>
);


const StyleEditor: React.FC<StyleEditorProps> = ({ styles, setStyles }) => {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setStyles(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  
  const fontOptions = [
    'Roboto, sans-serif',
    'Montserrat, sans-serif',
    'Lora, serif',
    'Playfair Display, serif',
    'Nunito, sans-serif'
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg sticky top-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Редактор Стилей</h2>
      <div className="space-y-4">
          <StyleField label="Шрифт" name="fontFamily" value={styles.fontFamily} onChange={handleChange} type="select" options={fontOptions} />
          <div className="grid grid-cols-2 gap-4">
             <StyleField label="Основной цвет" name="primaryColor" value={styles.primaryColor} onChange={handleChange} />
             <StyleField label="Цвет фона" name="backgroundColor" value={styles.backgroundColor} onChange={handleChange} />
             <StyleField label="Цвет текста" name="textColor" value={styles.textColor} onChange={handleChange} />
             <StyleField label="Цвет заголовков" name="headingColor" value={styles.headingColor} onChange={handleChange} />
             <StyleField label="Фон карточек" name="cardBackgroundColor" value={styles.cardBackgroundColor} onChange={handleChange} />
          </div>
      </div>
      <p className="mt-6 text-xs text-gray-500">Эти стили будут применены к экспортированной веб-странице.</p>
    </div>
  );
};

export default StyleEditor;