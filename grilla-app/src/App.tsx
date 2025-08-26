import { useState, useEffect, type FC } from 'react';
import { Calendar, Clock, Instagram, Facebook, Twitter, Linkedin, Users, Search, X, ChevronLeft, ChevronRight, Moon, Sun, Youtube, MessageCircle } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

// Interfaces for type safety
interface Product {
  name: string;
  color: string;
  needsPerson?: boolean;
}

interface Network {
  name: string;
  code: string;
  icon: FC<any>;
  color: string;
}

interface Content {
  id: number;
  dateKey: string;
  product: string;
  customTitle?: string;
  networks: string[];
  format: string;
  status: string;
  notes: string;
  createdAt: string;
  archivedAt?: string;
}

interface ScheduledContent {
  [key: string]: Content;
}

interface SelectedSlot {
  date: Date;
  time: string;
}

const App: FC = () => {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent>({});
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [filters, setFilters] = useState<{ product: string; network: string; status: string }>({ product: '', network: '', status: '' });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [testData, setTestData] = useState<any[]>([]);

  useEffect(() => {
    const fetchTestData = async () => {
      const { data, error } = await supabase.from('test').select('*');
      if (error) {
        console.error('Error fetching test data:', error);
      } else {
        setTestData(data || []);
      }
    };
    fetchTestData();
  }, []);

  const products: Product[] = [
    { name: 'Reacción a la noticia', color: '#FF6B6B', needsPerson: true },
    { name: 'Entre Líneas', color: '#4ECDC4' },
    { name: 'La Cocina', color: '#45B7D1' },
    { name: 'Hilando Ideas', color: '#F7DC6F' },
    { name: 'Revista ÁTOMO', color: '#BB8FCE' },
    { name: 'Crítica & Política', color: '#F1948A' },
    { name: 'Perspectiva Z', color: '#82E0AA' },
    { name: 'Efemérides FPP', color: '#85C1E9' },
    { name: 'Carrusel FPP', color: '#F8C471' },
    { name: 'Extractos', color: '#D7BDE2', needsPerson: true },
    { name: 'Editorial FPP', color: '#FDEDEC' },
    { name: 'Merchandising FPP', color: '#EAEDED' },
    { name: 'Ciclo de Cine', color: '#FEF9E7' },
    { name: 'Oferta laboral', color: '#E8F8F5' },
    { name: 'En Simple', color: '#FDF2E9' },
    { name: 'Entrevistas FPP', color: '#A569BD', needsPerson: true },
    { name: 'Otros', color: '#95A5A6' },
    { name: 'FPP Valdivia', color: '#3498DB' },
    { name: 'FPP Santiago', color: '#E74C3C' },
    { name: 'FPP Valparaíso', color: '#F1C40F' },
    { name: 'FPP Concepción', color: '#2ECC71' },
    { name: 'Formación', color: '#9B59B6', needsPerson: true },
    { name: 'Opinión', color: '#F39C12', needsPerson: true }
  ];

  const networks: Network[] = [
    { name: 'Instagram', code: 'IG', icon: Instagram, color: '#E4405F' },
    { name: 'Facebook', code: 'FB', icon: Facebook, color: '#1877F2' },
    { name: 'TikTok', code: 'TT', icon: Users, color: '#000000' },
    { name: 'LinkedIn', code: 'LI', icon: Linkedin, color: '#0A66C2' },
    { name: 'Twitter', code: 'TW', icon: Twitter, color: '#1DA1F2' },
    { name: 'YouTube', code: 'YT', icon: Youtube, color: '#FF0000' },
    { name: 'WhatsApp', code: 'WA', icon: MessageCircle, color: '#25D366' }
  ];

  const formats: string[] = ['Post', 'Story', 'Reel', 'Carrusel'];
  const statuses: string[] = ['Programado', 'En producción', 'Listo', 'Publicado', 'Archivado', 'Eliminar'];

  // Generate time slots (8 AM to 8 PM in 1-hour intervals for full panorama view)
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  const timeSlots: string[] = generateTimeSlots();

  // Get current week dates
  const getWeekDates = (date: Date): Date[] => {
    const week: Date[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates: Date[] = getWeekDates(currentWeek);
  const weekDays: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Format date for storage key
  const formatDateKey = (date: Date, time: string): string => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${time}`;
  };

  // Load data from Supabase on initial render
  useEffect(() => {
    const fetchGridContent = async () => {
      const { data, error } = await supabase.from('grilla_content').select('*');
      if (error) {
        console.error('Error fetching grid content:', error);
      } else if (data) {
        const newContent = data.reduce((acc, item) => {
          acc[item.dateKey] = item;
          return acc;
        }, {} as ScheduledContent);
        setScheduledContent(newContent);
      }
    };
    fetchGridContent();

    const savedDarkMode = localStorage.getItem('contentSchedulerDarkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('contentSchedulerDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Add or update content in Supabase
  const handleSaveContent = async (contentData: Partial<Content>) => {
    if (!selectedSlot) return;

    // --- Delete Logic ---
    if (contentData.status === 'Eliminar') {
      if (editingContent) {
        const { error } = await supabase.from('grilla_content').delete().eq('id', editingContent.id);
        if (error) {
          console.error('Error deleting content:', error);
        } else {
          // Remove from local state
          const keyToDelete = Object.keys(scheduledContent).find(key => scheduledContent[key]?.id === editingContent.id);
          if (keyToDelete) {
            setScheduledContent(prev => {
              const { [keyToDelete]: removedItem, ...newContent } = prev;
              return newContent;
            });
          }
        }
      }
      setShowAddModal(false);
      setEditingContent(null);
      setSelectedSlot(null);
      return;
    }

    const dateKey = formatDateKey(selectedSlot.date, selectedSlot.time);
    let finalDateKey = dateKey;

    if (editingContent) {
      const existingKey = Object.keys(scheduledContent).find(key => scheduledContent[key]?.id === editingContent.id);
      if (existingKey && existingKey !== dateKey) {
        // If the date/time has changed, we need to delete the old entry and create a new one.
        const { error: deleteError } = await supabase.from('grilla_content').delete().eq('id', editingContent.id);
        if (deleteError) console.error('Error deleting old content entry:', deleteError);
      }
    }

    const newContent: Content = {
      id: editingContent?.id || Date.now(),
      dateKey: finalDateKey,
      createdAt: editingContent?.createdAt || new Date().toISOString(),
      product: contentData.product || '',
      customTitle: contentData.customTitle || '',
      networks: contentData.networks || [],
      format: contentData.format || '',
      status: contentData.status || 'Programado',
      notes: contentData.notes || '',
      archivedAt: contentData.status === 'Archivado' ? new Date().toISOString() : undefined,
    };

    const { error } = await supabase.from('grilla_content').upsert(newContent, { onConflict: 'id' });

    if (error) {
      console.error('Error saving content:', error);
    } else {
      // Update local state
      setScheduledContent(prev => ({
        ...prev,
        [finalDateKey]: newContent
      }));
    }

    setShowAddModal(false);
    setEditingContent(null);
    setSelectedSlot(null);
  };

  

  // Get week statistics
  const getWeekStats = (): number => {
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    
    let count = 0;
    Object.keys(scheduledContent).forEach(key => {
      const [dateStr] = key.split('_');
      const date = new Date(dateStr);
      if (date >= weekStart && date <= weekEnd) {
        count++;
      }
    });
    
    return count;
  };

  // Navigate weeks
  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  // Get content for specific slot (handle multiple contents)
  const getContentForSlot = (date: Date, time: string): Content | null => {
    const dateKey = formatDateKey(date, time);
    const baseContent = scheduledContent[dateKey];
    
    if (baseContent) return baseContent;
    
    // Look for additional content in the same slot
    const additionalContent = Object.keys(scheduledContent)
      .filter(key => key.startsWith(dateKey + '_'))
      .map(key => scheduledContent[key]);
    
    return additionalContent[0] || null;
  };

  // Filter and search content
  const isContentVisible = (content: Content): boolean => {
    if (filters.product && content.product !== filters.product) return false;
    if (filters.network && !content.networks.includes(filters.network)) return false;
    if (filters.status && content.status !== filters.status) return false;
    if (searchTerm && !content.product.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !content.customTitle?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  };

  return (
    <div className={`min-h-screen p-4 transition-colors bg-black`}>
      {/* Header */}
      <div className={`rounded-lg shadow-sm border p-6 mb-6 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Calendar className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Grilla de Contenido FPP</h1>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Programador de publicaciones en redes sociales</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-900'}`}>
              <Clock className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className="font-semibold">{getWeekStats()} publicaciones esta semana</span>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button 
            onClick={() => navigateWeek(-1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Semana Anterior
          </button>
          
          <div className="text-center">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {weekDates[0].toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - {' '}
              {weekDates[6].toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Semana {Math.ceil(weekDates[0].getDate() / 7)} de {weekDates[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
          </div>
          
          <button 
            onClick={() => navigateWeek(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Semana Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Buscar contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'}`}
            />
          </div>
          
          <select 
            value={filters.product}
            onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode ? 'border-gray-600 bg-gray-700 text-white focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'}`}
          >
            <option value="">Todos los productos</option>
            {products.map(product => (
              <option key={product.name} value={product.name}>{product.name}</option>
            ))}
          </select>
          
          <select 
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode ? 'border-gray-600 bg-gray-700 text-white focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'}`}
          >
            <option value="">Todos los estados</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`rounded-lg shadow-sm border overflow-hidden transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Days Header */}
        <div className={`grid grid-cols-8 border-b transition-colors ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className={`p-3 font-semibold border-r transition-colors ${darkMode ? 'text-gray-200 border-gray-700' : 'text-gray-700 border-gray-200'}`}>Horario</div>
          {weekDays.map((day, index) => (
            <div key={day} className={`p-3 text-center font-semibold border-r last:border-r-0 transition-colors ${darkMode ? 'text-gray-200 border-gray-700' : 'text-gray-700 border-gray-200'}`}>
              <div className="text-sm">{day}</div>
              <div className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {weekDates[index].toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="max-h-[70vh] overflow-y-auto">
          {timeSlots.map(time => (
            <div key={time} className={`grid grid-cols-8 border-b last:border-b-0 min-h-[50px] transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Time Label */}
              <div className={`p-2 border-r flex items-center justify-center font-medium text-sm transition-colors ${darkMode ? 'bg-gray-900 text-gray-300 border-gray-700' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {time}
              </div>
              
              {/* Day Cells */}
              {weekDates.map(date => {
                const content = getContentForSlot(date, time);
                const dateKey = formatDateKey(date, time);
                
                return (
                  <div 
                    key={dateKey}
                    className={`border-r last:border-r-0 p-1 cursor-pointer relative min-h-[50px] transition-colors ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => {
                      setSelectedSlot({ date, time });
                      setEditingContent(null); // Always allow new content
                      setShowAddModal(true);
                    }}
                  >
                    {content && isContentVisible(content) && (
                      <ContentCard 
                        content={content}
                        products={products}
                        networks={networks}
                        darkMode={darkMode}
                        onEdit={() => {
                          setSelectedSlot({ date, time });
                          setEditingContent(content);
                          setShowAddModal(true);
                        }}
                      />
                    )}
                    
                    {/* Multiple content indicator */}
                    {Object.keys(scheduledContent).filter(key => key.startsWith(formatDateKey(date, time).split('_')[0] + '_' + time)).length > 1 && (
                      <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${darkMode ? 'bg-yellow-400' : 'bg-orange-500'}`}
                           title="Múltiples publicaciones en este horario"></div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Archive Section */}
      {Object.values(scheduledContent).some((content: Content) => content.status === 'Archivado') && (
        <div className={`rounded-lg shadow-sm border mt-4 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 border-b transition-colors ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              📁 Contenido Archivado
              <span className={`text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ({Object.values(scheduledContent).filter((content: Content) => content.status === 'Archivado').length} elementos)
              </span>
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(scheduledContent)
                .filter(([, content]) => (content as Content).status === 'Archivado')
                .map(([key, content]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => {
                      setEditingContent(content as Content);
                      setSelectedSlot({ date: new Date(), time: '12:00' }); // Slot por defecto para restaurar
                      setShowAddModal(true);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <StatusBadge status={(content as Content).status} darkMode={darkMode} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('¿Eliminar permanentemente este contenido archivado?')) {
                            setScheduledContent(prev => {
                              const { [key]: removedItem, ...newContent } = prev;
                              return newContent;
                            });
                          }
                        }}
                        className={`text-red-500 hover:text-red-700 text-sm`}
                        title="Eliminar permanentemente"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className={`font-semibold text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {(content as Content).product}
                    </div>
                    {(content as Content).customTitle && (
                      <div className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {(content as Content).customTitle}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {(content as Content).networks && (content as Content).networks.slice(0, 3).map(networkCode => {
                        const network = networks.find(n => n.code === networkCode);
                        return (
                          <span key={networkCode} className={`inline-flex items-center gap-1 px-1 py-0.5 rounded text-xs ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                            {network && <network.icon className="w-2 h-2" />}
                            {networkCode}
                          </span>
                        );
                      })}
                      {(content as Content).networks && (content as Content).networks.length > 3 && (
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          +{(content as Content).networks.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Test Supabase Connection */}
      <div className={`rounded-lg shadow-sm border p-6 mt-6 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Test de Conexión con Supabase</h2>
        {testData.length > 0 ? (
          <ul>
            {testData.map(item => (
              <li key={item.id} className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {item.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No se encontraron datos de prueba. Asegúrate de haber creado la tabla 'test' en Supabase con algunos datos.</p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <ContentModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingContent(null);
            setSelectedSlot(null);
          }}
          onSave={handleSaveContent}
          editingContent={editingContent}
          selectedSlot={selectedSlot}
          products={products}
          networks={networks}
          formats={formats}
          statuses={statuses}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

// Content Card Component
interface ContentCardProps {
  content: Content;
  products: Product[];
  networks: Network[];
  darkMode: boolean;
  onEdit: () => void;
}

const ContentCard: FC<ContentCardProps> = ({ content, products, networks, darkMode, onEdit }) => {
  const product = products.find(p => p.name === content.product);
  
  // Function to get contrasting text color
  const getTextColor = (bgColor: string | undefined, isDark: boolean): string => {
    if (!bgColor) return isDark ? '#FFFFFF' : '#000000';
    if (isDark) return '#FFFFFF';
    // For light mode, use the original color but darker
    return bgColor;
  };
  
  return (
    <div 
      className={`rounded p-1 border-l-2 text-xs cursor-pointer hover:shadow-sm transition-all ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
      style={{ 
        backgroundColor: darkMode ? product?.color + '30' : product?.color + '20',
        borderLeftColor: product?.color
      }}
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-1">
        <StatusBadge status={content.status} darkMode={darkMode} />
      </div>

      {/* Product Name */}
      <div 
        className="font-semibold mb-1 text-xs leading-tight" 
        style={{ color: getTextColor(product?.color, darkMode) }}
      >
        {content.product}
      </div>

      {/* Custom Title or Person */}
      {content.customTitle && (
        <div className={`mb-1 font-medium text-xs leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {content.customTitle}
        </div>
      )}

      {/* Networks and Formats */}
      <div className="flex flex-wrap gap-1">
        {content.networks && content.networks.slice(0, 3).map(networkCode => {
          const network = networks.find(n => n.code === networkCode);
          return (
            <span key={networkCode} className={`inline-flex items-center gap-1 px-1 py-0.5 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'}`}>
              {network && <network.icon className="w-2 h-2" />}
              {networkCode}
            </span>
          );
        })}
        {content.networks && content.networks.length > 3 && (
          <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            +{content.networks.length - 3}
          </span>
        )}
        {content.format && (
          <span className={`px-1 py-0.5 rounded text-xs ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
            {content.format}
          </span>
        )}
      </div>
    </div>
  );
};

// Status Badge Component
interface StatusBadgeProps {
  status: string;
  darkMode: boolean;
}

const StatusBadge: FC<StatusBadgeProps> = ({ status, darkMode }) => {
  const statusColors: { [key: string]: string } = {
    'Programado': darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800',
    'En producción': darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800',
    'Listo': darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800',
    'Publicado': darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800',
    'Archivado': darkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800',
    'Eliminar': darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
  };

  return (
    <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {status}
    </span>
  );
};

// Content Modal Component
interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contentData: Partial<Content>) => void;
  editingContent: Content | null;
  selectedSlot: SelectedSlot | null;
  products: Product[];
  networks: Network[];
  formats: string[];
  statuses: string[];
  darkMode: boolean;
}

const ContentModal: FC<ContentModalProps> = ({
  isOpen, 
  onClose, 
  onSave, 
  editingContent, 
  selectedSlot, 
  products, 
  networks, 
  formats, 
  statuses, 
  darkMode
}) => {
  const [formData, setFormData] = useState<Partial<Content>>({
    product: '',
    customTitle: '',
    networks: [],
    format: '',
    status: 'Programado',
    notes: ''
  });

  useEffect(() => {
    if (editingContent) {
      setFormData(editingContent);
    } else {
      setFormData({
        product: '',
        customTitle: '',
        networks: [],
        format: '',
        status: 'Programado',
        notes: ''
      });
    }
  }, [editingContent]);

  const handleSave = () => {
    if (!formData.product) return;
    onSave(formData);
  };

  const handleNetworkToggle = (networkCode: string) => {
    setFormData(prev => ({
      ...prev,
      networks: prev.networks?.includes(networkCode)
        ? prev.networks.filter(n => n !== networkCode)
        : [...(prev.networks || []), networkCode]
    }));
  };

  const handleSelectAllNetworks = () => {
    const allNetworkCodes = networks.map(n => n.code);
    const allSelected = allNetworkCodes.every(code => formData.networks?.includes(code));
    
    setFormData(prev => ({
      ...prev,
      networks: allSelected ? [] : allNetworkCodes
    }));
  };

  const selectedProduct = products.find(p => p.name === formData.product);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-4 border-b transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {editingContent ? 'Editar Contenido' : 'Agregar Contenido'}
            </h2>
            <button onClick={onClose} className={`hover:bg-opacity-20 p-1 rounded ${darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          {selectedSlot && (
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedSlot.date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })} a las {selectedSlot.time}
            </p>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Product Selection */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Producto *
            </label>
            <select
              value={formData.product}
              onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode ? 'border-gray-600 bg-gray-700 text-white focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'}`}
              required
            >
              <option value="">Seleccionar producto</option>
              {products.map(product => (
                <option key={product.name} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Title */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {selectedProduct?.needsPerson ? 'Nombre de la persona' : 'Título personalizado'}
            </label>
            <input
              type="text"
              value={formData.customTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, customTitle: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'}`}
              placeholder={selectedProduct?.needsPerson ? 'Ej: Juan Pérez' : 'Ej: Título del contenido'}
            />
          </div>

          {/* Networks */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Redes Sociales *
              </label>
              <button
                type="button"
                onClick={handleSelectAllNetworks}
                className={`text-xs px-2 py-1 rounded transition-colors ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {networks.every(n => formData.networks?.includes(n.code)) ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {networks.map(network => (
                <label key={network.code} className={`flex items-center gap-1 p-2 border rounded cursor-pointer transition-colors text-xs ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={formData.networks?.includes(network.code)}
                    onChange={() => handleNetworkToggle(network.code)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <network.icon className="w-3 h-3" />
                  <span className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{network.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format and Status - Same Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Formato
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode ? 'border-gray-600 bg-gray-700 text-white focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'}`}
              >
                <option value="">Seleccionar formato</option>
                {formats.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode ? 'border-gray-600 bg-gray-700 text-white focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'}`}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'}`}
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingContent ? 'Actualizar' : 'Guardar'}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border rounded-lg transition-colors ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;