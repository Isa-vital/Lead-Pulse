import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/api/endpoints';
import { formatCurrency } from '@/lib/utils';
import { Search, Users, Package, ShoppingCart, Target, X } from 'lucide-react';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', query],
    queryFn: () => searchApi.search(query).then((r) => r.data.data),
    enabled: query.length >= 2,
    staleTime: 10_000,
  });

  // Keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (type: string, id: number) => {
    setIsOpen(false);
    setQuery('');
    switch (type) {
      case 'customer':
        navigate(`/customers/${id}`);
        break;
      case 'product':
        navigate('/products');
        break;
      case 'order':
        navigate('/orders');
        break;
      case 'lead':
        navigate('/pipeline');
        break;
    }
  };

  const hasResults =
    data &&
    (data.customers.length > 0 ||
      data.products.length > 0 ||
      data.orders.length > 0 ||
      data.leads.length > 0);

  return (
    <div className="relative" ref={containerRef}>
      <div className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 dark:bg-gray-800 dark:border-gray-600">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search... (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          className="bg-transparent text-sm outline-none placeholder:text-gray-400 w-64 dark:text-gray-200"
        />
        {query && (
          <button onClick={() => { setQuery(''); setIsOpen(false); }}>
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-xl z-50 max-h-[70vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          {isFetching && (
            <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
          )}

          {!isFetching && !hasResults && (
            <div className="p-4 text-center text-sm text-gray-500">No results found</div>
          )}

          {data && hasResults && (
            <div className="py-2">
              {/* Customers */}
              {data.customers.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Customers
                  </div>
                  {data.customers.map((c) => (
                    <button
                      key={`c-${c.id}`}
                      onClick={() => handleSelect('customer', c.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.email ?? c.company}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Products */}
              {data.products.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5 border-t border-gray-100 dark:border-gray-700 mt-1 pt-2">
                    <Package className="h-3.5 w-3.5" />
                    Products
                  </div>
                  {data.products.map((p) => (
                    <button
                      key={`p-${p.id}`}
                      onClick={() => handleSelect('product', p.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.sku}</p>
                      </div>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(p.price)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Orders */}
              {data.orders.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5 border-t border-gray-100 dark:border-gray-700 mt-1 pt-2">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Orders
                  </div>
                  {data.orders.map((o) => (
                    <button
                      key={`o-${o.id}`}
                      onClick={() => handleSelect('order', o.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{o.order_number}</p>
                        <p className="text-xs text-gray-500 capitalize">{o.status}</p>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatCurrency(o.total)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Leads */}
              {data.leads.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5 border-t border-gray-100 dark:border-gray-700 mt-1 pt-2">
                    <Target className="h-3.5 w-3.5" />
                    Leads
                  </div>
                  {data.leads.map((l) => (
                    <button
                      key={`l-${l.id}`}
                      onClick={() => handleSelect('lead', l.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{l.title}</p>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(l.value)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
