import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Home } from 'lucide-react';
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '@/utils/validation';
import { toast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';

export function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate(ROUTES.HOME, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Home className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Wishouse</h1>
          <p className="text-muted-foreground mt-2">
            Planifiez votre budget maison
          </p>
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="register">Inscription</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login">
              <LoginForm onSuccess={() => navigate(ROUTES.HOME)} signIn={signIn} />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm
                onSuccess={() => setActiveTab('login')}
                signUp={signUp}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

interface LoginFormProps {
  onSuccess: () => void;
  signIn: (email: string, password: string) => Promise<unknown>;
}

function LoginForm({ onSuccess, signIn }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Erreur de connexion',
        description: error instanceof Error ? error.message : 'Email ou mot de passe incorrect',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="votre@email.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Mot de passe</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Se connecter
        </Button>
      </CardFooter>
    </form>
  );
}

interface RegisterFormProps {
  onSuccess: () => void;
  signUp: (email: string, password: string) => Promise<unknown>;
}

function RegisterForm({ onSuccess, signUp }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data.email, data.password);
      toast({
        title: 'Compte créé',
        description: 'Vérifiez votre email pour confirmer votre inscription',
        variant: 'success',
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Erreur d\'inscription',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            placeholder="votre@email.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Mot de passe</Label>
          <Input
            id="register-password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm">Confirmer le mot de passe</Label>
          <Input
            id="register-confirm"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer un compte
        </Button>
      </CardFooter>
    </form>
  );
}
