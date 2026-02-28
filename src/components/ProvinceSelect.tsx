import React, { useState, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { PROVINCES, searchProvinces } from '@/constants/provinces';

interface ProvinceSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const ProvinceSelect: React.FC<ProvinceSelectProps> = ({ 
  value, 
  onChange, 
  placeholder = "เลือกจังหวัด",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProvinces, setFilteredProvinces] = useState<string[]>([]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = searchProvinces(searchQuery);
      setFilteredProvinces(filtered);
    } else {
      setFilteredProvinces(PROVINCES);
    }
  }, [searchQuery]);

  const handleSelect = (province: string) => {
    onChange(province);
    setIsOpen(false);
    setSearchQuery('');
  };

  const selectedProvince = PROVINCES.find(p => p === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 rounded-2xl border border-input bg-background px-4 py-2 text-left flex items-center justify-between outline-none focus:ring-2 focus:ring-orange-500 hover:border-orange-300 transition-colors"
      >
        <span className={selectedProvince ? "text-foreground" : "text-muted-foreground"}>
          {selectedProvince || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-input rounded-2xl shadow-lg max-h-80 overflow-hidden">
          <div className="p-3 border-b border-input">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="พิมพ์เพื่อค้นหาจังหวัด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-xl bg-background outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredProvinces.length > 0 ? (
              filteredProvinces.map((province) => (
                <button
                  key={province}
                  type="button"
                  onClick={() => handleSelect(province)}
                  className="w-full px-4 py-3 text-left hover:bg-accent focus:bg-accent transition-colors text-sm border-b border-border last:border-b-0"
                >
                  {province}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-muted-foreground text-sm">
                ไม่พบจังหวัดที่ค้นหา
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
