import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, XCircle } from 'lucide-react';
import api from '../api/client';

export default function Notifications() {
  var [alerts, setAlerts] = useState([]);
  var [open, setOpen] = useState(false);
  var ref = useRef(null);

  useEffect(function() {
    var fetchAlerts = async function() {
      try {
        var now = new Date();
        var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        var res = await api.get('/analytics/budget/?month=' + month);
        var budgetAlerts = (res.data || []).filter(function(cat) {
          return cat.budget_limit && cat.progress >= 80;
        }).map(function(cat) {
          return {
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            spent: cat.amount_spent,
            limit: cat.budget_limit,
            progress: cat.progress,
            status: cat.status,
          };
        });
        setAlerts(budgetAlerts);
      } catch (err) {
        // silently fail
      }
    };
    fetchAlerts();
  }, []);

  useEffect(function() {
    var handleClickOutside = function(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return function() { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={function() { setOpen(!open); }}
        className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-800 cursor-pointer transition"
      >
        <Bell size={20} />
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-medium">
            {alerts.length}
          </span>
        )}
      </div>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-[100] overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-sm font-medium text-white">Budget Alerts</p>
          </div>

          {alerts.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              No alerts. Your spending is on track!
            </div>
          ) : (
            <div className="max-h-[300px] overflow-auto">
              {alerts.map(function(alert) {
                return (
                  <div key={alert.slug} className="px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                    <div className="flex items-start gap-3">
                      {alert.status === 'exceeded' ? (
                        <XCircle size={18} className="text-red-400 mt-0.5" />
                      ) : (
                        <AlertTriangle size={18} className="text-amber-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          {alert.icon} {alert.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {alert.status === 'exceeded'
                            ? 'Over budget! GHS ' + alert.spent.toFixed(2) + ' of GHS ' + alert.limit.toFixed(2)
                            : 'Almost there — ' + alert.progress.toFixed(0) + '% used'}
                        </p>
                        <div className="w-full h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: Math.min(alert.progress, 100) + '%',
                              backgroundColor: alert.status === 'exceeded' ? '#EF4444' : '#F59E0B',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
