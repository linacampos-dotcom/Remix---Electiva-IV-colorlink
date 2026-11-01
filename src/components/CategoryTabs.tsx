import React from 'react';

export type MainCategoryTab = 'todos' | 'ofertas' | 'interior' | 'exterior' | 'herramientas';

export interface CategoryTabItem {
  id: MainCategoryTab;
  label: string;
  icon?: string;
}

export const CATEGORY_TABS: CategoryTabItem[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'ofertas', label: 'Ofertas' },
  { id: 'interior', label: 'Pintura Interior' },
  { id: 'exterior', label: 'Pintura Exterior ☀️' },
  { id: 'herramientas', label: 'Herramientas' },
];

export interface CategoryTabsProps {
  activeTab: MainCategoryTab;
  onSelectTab: (tab: MainCategoryTab) => void;
  counts?: Partial<Record<MainCategoryTab, number>>;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeTab,
  onSelectTab,
  counts,
}) => {
  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Contenedor con scroll interno contenido y padding vertical compacto */}
      <div 
        role="tablist" 
        aria-label="Categorías de Pinturas y Herramientas"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 w-full scroll-smooth"
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id];

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 border select-none ${
                isActive
                  ? 'bg-blue-900 text-white border-blue-900 shadow-sm scale-[1.02]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 shadow-2xs'
              }`}
            >
              <span>{tab.label}</span>
              {typeof count === 'number' && (
                <span 
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
