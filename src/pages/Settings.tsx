import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/useTags';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Loader2, Plus, X, LogOut, Moon, Sun } from 'lucide-react';
import { settingsSchema, type SettingsFormData } from '@/utils/validation';
import { CURRENCIES, DEFAULT_TAG_COLORS } from '@/lib/constants';

export function Settings() {
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const { data: tags = [] } = useTags();
  const updateSettings = useUpdateSettings();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const { signOut, user } = useAuth();

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(DEFAULT_TAG_COLORS[0]);
  const [isAddingTag, setIsAddingTag] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    values: settings
      ? {
          total_budget: settings.total_budget,
          currency: settings.currency,
          dark_mode: settings.dark_mode,
        }
      : undefined,
  });

  const darkMode = watch('dark_mode');

  if (loadingSettings) {
    return <LoadingSpinner fullScreen />;
  }

  const onSubmit = async (data: SettingsFormData) => {
    await updateSettings.mutateAsync(data);
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    await createTag.mutateAsync({
      name: newTagName.trim(),
      color: newTagColor,
    });

    setNewTagName('');
    setIsAddingTag(false);
  };

  const handleDeleteTag = async (id: string) => {
    if (confirm('Supprimer ce tag ?')) {
      await deleteTag.mutateAsync(id);
    }
  };

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setValue('dark_mode', newValue);
    document.documentElement.classList.toggle('dark', newValue);
    updateSettings.mutate({ dark_mode: newValue });
  };

  return (
    <div className="space-y-6 pb-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez votre application Wishouse
        </p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>

      {/* Budget settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="total_budget">Budget total</Label>
              <Input
                id="total_budget"
                type="number"
                step="0.01"
                min="0"
                {...register('total_budget', { valueAsNumber: true })}
              />
              {errors.total_budget && (
                <p className="text-sm text-destructive">
                  {errors.total_budget.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select
                value={watch('currency')}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Apparence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mode sombre</p>
              <p className="text-sm text-muted-foreground">
                Activer le thème sombre
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Tags</CardTitle>
          {!isAddingTag && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setIsAddingTag(true)}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add tag form */}
          {isAddingTag && (
            <div className="space-y-3 p-3 bg-muted rounded-lg">
              <Input
                placeholder="Nom du tag"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                  if (e.key === 'Escape') setIsAddingTag(false);
                }}
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {DEFAULT_TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full transition-all ${
                      newTagColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTagName.trim()}
                >
                  Ajouter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingTag(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Tags list */}
          {tags.length === 0 && !isAddingTag ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun tag créé
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="gap-1 pr-1"
                  style={{ borderColor: tag.color, color: tag.color }}
                >
                  {tag.name}
                  <button
                    className="ml-1 hover:bg-muted rounded p-0.5"
                    onClick={() => handleDeleteTag(tag.id)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* App info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Wishouse v1.0.0</p>
          <p>Planificateur de budget pour votre maison</p>
        </CardContent>
      </Card>
    </div>
  );
}
