
import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useBarRating, BarRating } from '@/hooks/useBarRating';
import { OutingHistory } from '@/hooks/useOutingsHistory';

interface BarRatingDialogProps {
  outing: OutingHistory;
  children: React.ReactNode;
}

const BarRatingDialog = ({ outing, children }: BarRatingDialogProps) => {
  const { rateBar, getBarRating, loading } = useBarRating();
  const [rating, setRating] = useState(outing.user_rating || 0);
  const [review, setReview] = useState(outing.user_review || '');
  const [barRating, setBarRating] = useState<BarRating | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && outing.bar_place_id) {
      getBarRating(outing.bar_place_id).then(setBarRating);
    }
  }, [open, outing.bar_place_id, getBarRating]);

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }

    const success = await rateBar(outing.id, rating, review.trim() || undefined);
    if (success) {
      setOpen(false);
      // Rafraîchir le rating du bar
      if (outing.bar_place_id) {
        getBarRating(outing.bar_place_id).then(setBarRating);
      }
    }
  };

  const renderStars = (count: number, size: 'sm' | 'lg' = 'lg') => {
    const starSize = size === 'sm' ? 'h-3 w-3' : 'h-6 w-6';
    
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${starSize} ${
          i < count 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        } ${size === 'lg' ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        onClick={size === 'lg' ? () => setRating(i + 1) : undefined}
        onMouseEnter={size === 'lg' ? () => setHoveredStar(i + 1) : undefined}
        onMouseLeave={size === 'lg' ? () => setHoveredStar(0) : undefined}
      />
    ));
  };

  const displayRating = hoveredStar > 0 ? hoveredStar : rating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Noter {outing.bar_name}
          </DialogTitle>
          <DialogDescription>
            Partagez votre expérience pour aider la communauté
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating global du bar */}
          {barRating && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-amber-800">Note globale</h4>
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  {barRating.total_ratings} avis
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {renderStars(Math.round(barRating.average_rating), 'sm')}
                <span className="text-sm font-medium text-amber-700">
                  {barRating.average_rating.toFixed(1)}/5
                </span>
              </div>
            </div>
          )}

          {/* Votre note */}
          <div className="space-y-3">
            <h4 className="font-medium">Votre note</h4>
            <div className="flex items-center gap-1">
              {renderStars(displayRating, 'lg')}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && "Très décevant"}
                {rating === 2 && "Décevant"}
                {rating === 3 && "Correct"}
                {rating === 4 && "Très bien"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Votre avis (optionnel)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Partagez votre expérience..."
              className="min-h-[80px]"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {review.length}/500 caractères
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || loading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? 'Enregistrement...' : 'Noter le bar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarRatingDialog;
