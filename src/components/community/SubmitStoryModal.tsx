import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, Video, Mic, Upload, Gift } from 'lucide-react';
import { useStorySubmission } from '@/hooks/useStorySubmission';
import { toast } from 'sonner';

interface SubmitStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  city?: string;
}

export const SubmitStoryModal = ({ open, onOpenChange, groupId, city }: SubmitStoryModalProps) => {
  const { submitStory, uploading } = useStorySubmission();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [storyType, setStoryType] = useState<'text' | 'photo' | 'video'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop lourd (max 10MB)');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    setStoryType(isVideo ? 'video' : 'photo');
    setMedia(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startVoiceRecording = async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Votre navigateur ne supporte pas la reconnaissance vocale');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      toast.info('🎤 Parlez maintenant...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setContent((prev) => prev + ' ' + transcript);
      setIsRecording(false);
      toast.success('✨ Texte capturé !');
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error('Erreur de reconnaissance vocale');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleSubmit = async () => {
    if (!content && !media) {
      toast.error('Ajoute du contenu ou un média');
      return;
    }

    const result = await submitStory({
      story_type: storyType,
      content,
      media: media || undefined,
      city,
      group_id: groupId,
    });

    if (result) {
      onOpenChange(false);
      setContent('');
      setMedia(null);
      setMediaPreview(null);
      setStoryType('text');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Partage ton expérience</span>
            <Gift className="w-5 h-5 text-primary animate-pulse" />
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            +50 crédits à l'approbation 🎁
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
              {storyType === 'video' ? (
                <video src={mediaPreview} controls className="w-full h-full object-cover" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
              )}
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setMedia(null);
                  setMediaPreview(null);
                  setStoryType('text');
                }}
              >
                ✕
              </Button>
            </div>
          )}

          {/* Upload Buttons */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 gap-2"
            >
              <Camera className="w-4 h-4" />
              Photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 gap-2"
            >
              <Video className="w-4 h-4" />
              Vidéo
            </Button>
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="content">Ton histoire</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Raconte ton expérience Random..."
              rows={4}
              className="resize-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={startVoiceRecording}
              disabled={isRecording}
              className="gap-2"
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
              {isRecording ? 'En écoute...' : 'Dicter au micro'}
            </Button>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={uploading || (!content && !media)}
            className="w-full gap-2"
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                Soumettre (+50 crédits)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
