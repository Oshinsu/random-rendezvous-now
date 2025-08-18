import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  time: string;
  users: number;
  groups: number;
}

export const RealtimeChart = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Générer des données initiales pour les dernières 24h
    const generateInitialData = () => {
      const now = new Date();
      const points: ChartDataPoint[] = [];
      
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        points.push({
          time: time.getHours().toString().padStart(2, '0') + ':00',
          users: Math.floor(Math.random() * 20) + 5, // 5-25 utilisateurs
          groups: Math.floor(Math.random() * 10) + 2  // 2-12 groupes
        });
      }
      
      return points;
    };

    setData(generateInitialData());

    // Simuler des mises à jour temps réel toutes les 30 secondes
    const interval = setInterval(() => {
      setData(prevData => {
        const now = new Date();
        const currentHour = now.getHours().toString().padStart(2, '0') + ':00';
        
        const newPoint: ChartDataPoint = {
          time: currentHour,
          users: Math.floor(Math.random() * 20) + 5,
          groups: Math.floor(Math.random() * 10) + 2
        };

        // Remplacer le point de l'heure actuelle ou ajouter un nouveau point
        const updatedData = [...prevData];
        const lastPointIndex = updatedData.length - 1;
        
        if (updatedData[lastPointIndex]?.time === currentHour) {
          updatedData[lastPointIndex] = newPoint;
        } else {
          updatedData.push(newPoint);
          // Garder seulement les 24 derniers points
          if (updatedData.length > 24) {
            updatedData.shift();
          }
        }
        
        return updatedData;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="users" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Utilisateurs actifs"
            dot={{ fill: '#3b82f6', r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="groups" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Groupes créés"
            dot={{ fill: '#10b981', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};