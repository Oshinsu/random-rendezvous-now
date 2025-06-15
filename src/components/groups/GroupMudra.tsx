
import { Hand } from 'lucide-react';

const GroupMudra = () => {
  return (
    <div className="mt-8">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <Hand className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-heading font-bold text-blue-800 mb-2">
              🤝 Signe de reconnaissance
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Pour vous retrouver facilement au bar, utilisez ce mudra discret comme signe de reconnaissance entre membres du groupe.
            </p>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-shrink-0">
                <img 
                  src="https://i.postimg.cc/5NQ7rJ1z/Mudra-Naruto-Tigre.png" 
                  alt="Mudra Tigre de Naruto" 
                  className="w-24 h-24 object-contain bg-white rounded-lg shadow-sm border border-blue-200"
                />
              </div>
              <div className="text-xs text-blue-600 font-medium">
                <p className="mb-2">
                  <strong>Le Mudra du Tigre :</strong> Entrelacez vos doigts et pointez vos index vers le haut.
                </p>
                <p>
                  Faites ce geste discrètement près de l'entrée ou du bar pour que les autres membres vous repèrent ! 🐅
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupMudra;
