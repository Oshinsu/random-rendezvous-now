import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { t } = useTranslation();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      toast.error(t('auth.reset_error'), {
        description: error.message
      });
    } else {
      setEmailSent(true);
      toast.success(t('auth.reset_email_sent'), {
        description: t('auth.reset_check_inbox')
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-brand-50 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/auth?tab=signin')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        
        <Card className="glass-card rounded-3xl">
          <CardHeader>
            <CardTitle className="text-center gradient-text">
              {emailSent ? t('auth.reset_email_sent') : t('auth.reset_password')}
            </CardTitle>
            <CardDescription className="text-center">
              {emailSent 
                ? t('auth.reset_email_desc')
                : t('auth.reset_password_desc')
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">{t('auth.email')}</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder={t('auth.email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-2xl"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('auth.loading') : t('auth.send_reset_link')}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('auth.reset_email_detail')}
                </p>
                <Button
                  variant="outline"
                  className="w-full rounded-2xl"
                  onClick={() => navigate('/auth?tab=signin')}
                >
                  {t('auth.back_to_signin')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
